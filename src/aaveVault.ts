// Chrysalis AaveVault — real Aave v3 integration on Base Sepolia
//
// Replaces the in-memory CompoundingVault with actual on-chain calls:
//   mintTestUsdc() → TestToken.mint() — get Aave test USDC (faucet)
//   deposit()      → ERC20.approve() + Pool.supply()
//   getYield()     → aToken.balanceOf() - totalDeposited
//   withdraw()     → Pool.withdraw()
//
// Aave v3 on Base Sepolia (addresses from bgd-labs/aave-address-book):
//   Pool:   0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27
//   USDC:   0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f  ← Aave test token (NOT Circle USDC)
//   aUSDC:  0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC
//
// NOTE: Aave Base Sepolia uses its own test USDC — different from Circle USDC used by x402.
// x402 payments use Circle USDC (0x036C...). Vault uses Aave test USDC (0xba50...).

import {
  createWalletClient,
  createPublicClient,
  http,
  parseUnits,
  formatUnits,
  type Address,
  type Hex,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'
import { txQueue } from './txQueue.ts'

const AAVE_POOL    = '0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27' as Address
const AAVE_USDC    = '0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f' as Address  // Aave test USDC (NOT Circle USDC)
const AAVE_aUSDC   = '0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC' as Address  // aUSDC token
const AAVE_FAUCET  = '0xD9145b5F45Ad4519c7ACcD6E0A4A82e83bB8A6Dc' as Address  // Aave testnet faucet
const RPC          = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
const QUERY_COST   = 0.08   // $0.08 USDC needed to trigger an autonomous query

// ── ABIs ─────────────────────────────────────────────────────────────────────

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function' as const,
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount',  type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable' as const,
  },
  {
    name: 'balanceOf',
    type: 'function' as const,
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view' as const,
  },
] as const

// Aave testnet faucet — permissionless on public testnets
const FAUCET_ABI = [{
  name: 'mint',
  type: 'function' as const,
  inputs: [
    { name: 'token',  type: 'address' },
    { name: 'to',     type: 'address' },
    { name: 'amount', type: 'uint256' },
  ],
  outputs: [{ type: 'uint256' }],
  stateMutability: 'nonpayable' as const,
}] as const

const POOL_ABI = [
  {
    name: 'supply',
    type: 'function' as const,
    inputs: [
      { name: 'asset',        type: 'address' },
      { name: 'amount',       type: 'uint256' },
      { name: 'onBehalfOf',   type: 'address' },
      { name: 'referralCode', type: 'uint16'  },
    ],
    outputs: [],
    stateMutability: 'nonpayable' as const,
  },
  {
    name: 'withdraw',
    type: 'function' as const,
    inputs: [
      { name: 'asset',  type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'to',     type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'nonpayable' as const,
  },
] as const

// ── AaveVault ────────────────────────────────────────────────────────────────

export interface VaultState {
  principal: string         // total USDC deposited (human-readable)
  aTokenBalance: string     // current aToken balance = principal + yield
  availableYield: string    // aTokenBalance - principal
  canTriggerQuery: boolean  // availableYield >= QUERY_COST
  yieldToNextQuery: string  // how much more yield needed
  aTokenAddress: string     // the aUSDC token address on Base Sepolia
  poolAddress: string
}

export class AaveVault {
  private publicClient = createPublicClient({ chain: baseSepolia, transport: http(RPC) })
  private walletClient: ReturnType<typeof createWalletClient> | null = null
  private agentAddress: Address | null = null
  private totalDepositedAtomic = 0n   // total Aave test USDC supplied, in atomic units (6 decimals)
  private eventLog: string[] = []

  async init(privateKey: Hex) {
    const account = privateKeyToAccount(privateKey)
    this.agentAddress = account.address
    this.walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(RPC),
    })
    // Sync principal to existing on-chain aToken balance so yield = 0 at start
    const existingBalance = await this.getATokenBalance()
    this.totalDepositedAtomic = existingBalance
    this.log(`[AaveVault] Initialized | Pool: ${AAVE_POOL} | aUSDC: ${AAVE_aUSDC} | existing: $${formatUnits(existingBalance, 6)}`)
    return this
  }

  // Get Aave test USDC wallet balance (not aToken — the underlying token in wallet)
  async getAaveUsdcBalance(): Promise<number> {
    if (!this.agentAddress) throw new Error('AaveVault not initialized')
    const balance = await this.publicClient.readContract({
      address: AAVE_USDC,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [this.agentAddress],
    }) as bigint
    return parseFloat(formatUnits(balance, 6))
  }

  // Mint Aave test USDC via Aave Faucet — skips if wallet already has enough
  // Faucet has a per-address daily timelock; pre-checks balance to avoid unnecessary calls
  async mintTestUsdc(amount: number): Promise<string | null> {
    if (!this.walletClient || !this.agentAddress) throw new Error('AaveVault not initialized')

    const existing = await this.getAaveUsdcBalance()
    if (existing >= amount) {
      this.log(`[AaveVault] Skipping mint — wallet has $${existing.toFixed(6)} Aave USDC (need $${amount})`)
      return null
    }

    const needed = parseFloat((amount - existing).toFixed(6))
    const amountAtomic = parseUnits(needed.toFixed(6), 6)
    this.log(`[AaveVault] Minting $${needed.toFixed(6)} Aave test USDC via faucet...`)
    try {
      const tx = await txQueue.run(() => this.walletClient!.writeContract({
        address: AAVE_FAUCET,
        abi: FAUCET_ABI,
        functionName: 'mint',
        args: [AAVE_USDC, this.agentAddress!, amountAtomic],
      }))
      await this.publicClient.waitForTransactionReceipt({ hash: tx, timeout: 120_000 })
      this.log(`[AaveVault] ✓ Faucet minted $${needed.toFixed(6)} | tx: ${tx}`)
      return tx
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('timelock')) {
        const bal = await this.getAaveUsdcBalance()
        this.log(`[AaveVault] ⚠ Faucet timelock active — using existing wallet balance $${bal.toFixed(6)}`)
        return null
      }
      throw err
    }
  }

  // Supply Aave test USDC to Aave Pool — approve then supply
  async deposit(amountUsdc: number): Promise<string> {
    if (!this.walletClient || !this.agentAddress) throw new Error('AaveVault not initialized')

    // Run entire deposit atomically in the queue — balance check, approve, and supply are
    // serialized so concurrent deposits cannot interleave and cause "transfer exceeds balance"
    return txQueue.run(async () => {
      const walletBal = await this.getAaveUsdcBalance()
      if (walletBal < 0.000100) {
        this.log(`[AaveVault] ⚠ Skipping deposit — wallet nearly empty ($${walletBal.toFixed(6)}, faucet timelocked)`)
        return 'skipped_insufficient_test_usdc'
      }

      // Supply whatever is available (handles dust rounding)
      const actualAmount = Math.min(walletBal, amountUsdc)
      const amountAtomic = parseUnits(actualAmount.toFixed(6), 6)
      this.log(`[AaveVault] Depositing $${actualAmount.toFixed(6)} Aave test USDC to Pool...`)

      const approveTx = await this.walletClient!.writeContract({
        address: AAVE_USDC,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [AAVE_POOL, amountAtomic],
      })
      await this.publicClient.waitForTransactionReceipt({ hash: approveTx, timeout: 120_000 })
      this.log(`[AaveVault] ✓ Approved | tx: ${approveTx}`)

      const supplyTx = await this.walletClient!.writeContract({
        address: AAVE_POOL,
        abi: POOL_ABI,
        functionName: 'supply',
        args: [AAVE_USDC, amountAtomic, this.agentAddress!, 0],
      })
      await this.publicClient.waitForTransactionReceipt({ hash: supplyTx, timeout: 120_000 })

      this.totalDepositedAtomic += amountAtomic
      this.log(`[AaveVault] ✓ Supplied $${actualAmount.toFixed(6)} | supply tx: ${supplyTx}`)
      return supplyTx
    })
  }

  // Read real aUSDC balance — this grows autonomously as Aave accrues interest
  async getATokenBalance(): Promise<bigint> {
    if (!this.agentAddress) throw new Error('AaveVault not initialized')
    return await this.publicClient.readContract({
      address: AAVE_aUSDC,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [this.agentAddress],
    }) as bigint
  }

  // Real yield = aToken balance - total deposited
  async getAvailableYield(): Promise<number> {
    const balance = await this.getATokenBalance()
    const yieldAtomic = balance > this.totalDepositedAtomic
      ? balance - this.totalDepositedAtomic
      : 0n
    return parseFloat(formatUnits(yieldAtomic, 6))
  }

  async canSelfFundQuery(): Promise<boolean> {
    const yield_ = await this.getAvailableYield()
    return yield_ >= QUERY_COST
  }

  // Withdraw yield from Aave to fund an autonomous query
  async withdrawForQuery(to: Address): Promise<string> {
    if (!this.walletClient || !this.agentAddress) throw new Error('AaveVault not initialized')

    const yield_ = await this.getAvailableYield()
    if (yield_ < QUERY_COST) {
      throw new Error(`Insufficient yield: $${yield_.toFixed(6)} < $${QUERY_COST}`)
    }

    const amountAtomic = parseUnits(QUERY_COST.toFixed(6), 6)
    const withdrawTx = await txQueue.run(() => this.walletClient!.writeContract({
      address: AAVE_POOL,
      abi: POOL_ABI,
      functionName: 'withdraw',
      args: [AAVE_USDC, amountAtomic, to],
    }))
    await this.publicClient.waitForTransactionReceipt({ hash: withdrawTx, timeout: 120_000 })
    this.log(`[AaveVault] ✓ Withdrew $${QUERY_COST} yield → ${to} | tx: ${withdrawTx}`)
    return withdrawTx
  }

  async getState(): Promise<VaultState> {
    const balance = await this.getATokenBalance()
    const balanceHuman = parseFloat(formatUnits(balance, 6))
    const principalHuman = parseFloat(formatUnits(this.totalDepositedAtomic, 6))
    const yieldHuman = Math.max(0, balanceHuman - principalHuman)
    const canTrigger = yieldHuman >= QUERY_COST

    return {
      principal: `$${principalHuman.toFixed(6)} USDC`,
      aTokenBalance: `$${balanceHuman.toFixed(6)} USDC`,
      availableYield: `$${yieldHuman.toFixed(6)} USDC`,
      canTriggerQuery: canTrigger,
      yieldToNextQuery: `$${Math.max(0, QUERY_COST - yieldHuman).toFixed(6)} USDC`,
      aTokenAddress: AAVE_aUSDC,
      poolAddress: AAVE_POOL,
    }
  }

  getLog(): string[] {
    return this.eventLog
  }

  private log(msg: string) {
    const ts = new Date().toISOString().slice(11, 19)
    const entry = `[${ts}] ${msg}`
    this.eventLog.push(entry)
    // Also forward to console so it shows in demo output
    console.log(entry)
  }
}

// Singleton — initialized once in demo/index startup
export const aaveVault = new AaveVault()
