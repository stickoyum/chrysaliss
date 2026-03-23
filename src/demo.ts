// Chrysalis Demo — Self-Compounding Agent with Real Aave v3
//
// Phase 1: Bootstrap — deposit $2 to Aave v3 on Base Sepolia
// Phase 2: 3 human-paid queries — each deposits $0.08 to Aave via supply()
// Phase 3: Show real aToken balance — principal + actual accrued interest
// Phase 4: TreasuryAgent fires autonomous query when yield >= $0.08
//
// All Aave interactions are real: approve(), supply(), withdraw(), balanceOf() on Base Sepolia

import 'dotenv/config'
import { startCoordinator } from './coordinator.ts'
import { startTreasuryAgent } from './treasuryAgent.ts'
import { startFacilitator } from './facilitator.ts'
import { getAgentWallet, getPayingFetch, getUsdcBalance, PORTS } from './config.ts'
import { aaveVault } from './aaveVault.ts'
import type { QueryResult } from './coordinator.ts'
import type { Hex } from 'viem'

const HUMAN_QUERIES = [
  'DeFi yield optimization',
  'Self-funding AI agents',
  'On-chain treasury automation',
]

const BOOTSTRAP_AMOUNT = 2.00

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function printVaultState(label: string) {
  const s = await aaveVault.getState()
  console.log(`\n  ┌─ Aave Vault State: ${label}`)
  console.log(`  │  Pool (Base Sepolia):  ${s.poolAddress}`)
  console.log(`  │  aToken:               ${s.aTokenAddress}`)
  console.log(`  │  Principal deposited:  ${s.principal}`)
  console.log(`  │  aToken balance:       ${s.aTokenBalance}   ← real Aave balance`)
  console.log(`  │  Yield earned:         ${s.availableYield}`)
  if (s.canTriggerQuery) {
    console.log(`  │  Status: ✅ READY — yield >= $0.08, autonomous query can fire`)
  } else {
    console.log(`  │  Status: accruing... (${s.yieldToNextQuery} more needed)`)
  }
  console.log(`  └────────────────────────────────────────────────────`)
}

async function runHumanQuery(
  payingFetch: ReturnType<typeof getPayingFetch>,
  topic: string,
  index: number,
  total: number
) {
  console.log(`\nQuery ${index}/${total}: "${topic}"`)

  const res = await payingFetch(`http://localhost:${PORTS.coordinator}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.log(`  ✗ Failed: ${res.status} — ${JSON.stringify(err)}`)
    return null
  }

  const result = await res.json() as QueryResult
  console.log(`  ┌─ "${result.topic}"`)
  console.log(`  │  💰 Earned: ${result.economics.earned} | Deposited to Aave: ${result.economics.deposited}`)
  console.log(`  │  🏦 Aave supply tx: ${result.aaveSupplyTx}`)
  console.log(`  └─────────────────────────────────────────────────────`)
  return result
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║          CHRYSALIS — Self-Compounding Agent Demo             ║')
  console.log('║   Real Aave v3 on Base Sepolia — supply(), withdraw()        ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  const { account } = getAgentWallet()
  const humanPk = (process.env.HUMAN_PRIVATE_KEY ?? process.env.AGENT_PRIVATE_KEY) as Hex
  const payingFetch = getPayingFetch(humanPk)

  const startBalance = await getUsdcBalance(account.address)
  console.log(`Agent wallet:     ${account.address}`)
  console.log(`Starting balance: $${startBalance} USDC\n`)

  console.log('Initializing Aave vault...')
  await aaveVault.init(process.env.AGENT_PRIVATE_KEY as Hex)

  console.log('Starting agents...')
  startFacilitator()
  await sleep(500)
  startCoordinator()
  const { stop: stopTreasury } = startTreasuryAgent()
  await sleep(1000)

  // ── PHASE 1: Bootstrap ────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('PHASE 1: Bootstrap — seed Aave vault with $2')
  console.log('  faucet.mint() → ERC20.approve() → Pool.supply() → aUSDC')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const existingAToken = await aaveVault.getATokenBalance()
  const existingATokenHuman = parseFloat(existingAToken.toString()) / 1e6

  // Skip bootstrap if vault is already within $0.30 of target — preserves wallet balance for queries
  if (existingATokenHuman >= BOOTSTRAP_AMOUNT - 0.30) {
    console.log(`  ✓ Existing Aave position: $${existingATokenHuman.toFixed(6)} aUSDC — skipping bootstrap`)
  } else {
    const needed = BOOTSTRAP_AMOUNT + 0.50 - existingATokenHuman
    console.log(`  Topping up: need $${needed.toFixed(4)} more (have $${existingATokenHuman.toFixed(4)} aUSDC)`)
    const mintTx = await aaveVault.mintTestUsdc(needed)
    if (mintTx) console.log(`  ✓ Faucet minted | tx: ${mintTx}`)

    const walletBal = await aaveVault.getAaveUsdcBalance()
    const toSupply = Math.min(walletBal, BOOTSTRAP_AMOUNT - existingATokenHuman)
    if (toSupply > 0.001) {
      const bootstrapTx = await aaveVault.deposit(toSupply)
      console.log(`  ✓ Supplied $${toSupply.toFixed(4)} to Aave Pool | tx: ${bootstrapTx}`)
    }
  }
  await printVaultState('After bootstrap')
  await sleep(1000)

  // ── PHASE 2: Human queries ────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('PHASE 2: Human queries — each payment deposited in full to Aave')
  console.log('  pay $0.08 via x402 → Pool.supply($0.08) → aUSDC grows')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  for (let i = 0; i < HUMAN_QUERIES.length; i++) {
    try {
      await runHumanQuery(payingFetch, HUMAN_QUERIES[i], i + 1, HUMAN_QUERIES.length)
    } catch (err) {
      console.log(`  ✗ Error: ${err}`)
    }
    if (i < HUMAN_QUERIES.length - 1) await sleep(4000)
  }

  await printVaultState('After 3 human queries')

  // ── PHASE 3: Show real Aave balance ───────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('PHASE 3: Real Aave yield — aToken balance > deposited amount')
  console.log('  Yield accrues continuously on-chain via Aave liquidity index')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const state = await aaveVault.getState()
  console.log(`\n  Principal supplied to Aave: ${state.principal}`)
  console.log(`  Real aToken balance:        ${state.aTokenBalance}`)
  console.log(`  Real yield earned:          ${state.availableYield}`)
  console.log(`\n  View on Basescan: https://sepolia.basescan.org/address/${account.address}`)

  // ── PHASE 4: Autonomous queries ───────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('PHASE 4: TreasuryAgent monitors aToken balance every 30 seconds')
  console.log('  When yield >= $0.08: Pool.withdraw() → pay Coordinator → supply() → loop')

  if (!state.canTriggerQuery) {
    console.log(`\n  Current yield ${state.availableYield} < $0.08 threshold`)
    console.log(`  Waiting up to 90s to observe any autonomous trigger...`)
    console.log(`  (In production with larger principal, this fires regularly)\n`)
  } else {
    console.log(`\n  Yield is already >= $0.08 — autonomous query will fire shortly!\n`)
  }

  const maxWait = 90_000
  const checkInterval = 3_000
  let waited = 0
  let lastAutoCount = 0

  while (waited < maxWait) {
    await sleep(checkInterval)
    waited += checkInterval

    const ledgerRes = await fetch(`http://localhost:${PORTS.coordinator}/ledger`).catch(() => null)
    if (!ledgerRes?.ok) continue
    const ledger = await ledgerRes.json() as Record<string, unknown>
    const autoNow = ledger.autonomousQueries as number

    if (autoNow > lastAutoCount) {
      lastAutoCount = autoNow
      console.log(`\n  [${new Date().toLocaleTimeString()}] Autonomous query #${autoNow} completed!`)
      await printVaultState(`After ${autoNow} autonomous query/queries`)
      if (autoNow >= 2) break
    }
  }

  // ── FINAL ─────────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('FINAL STATE:')

  const ledgerRes = await fetch(`http://localhost:${PORTS.coordinator}/ledger`)
  const ledger = await ledgerRes.json() as Record<string, unknown>
  const finalState = await aaveVault.getState()

  console.log(`\n  Query Economics:`)
  console.log(`    Total earned:       ${ledger.earned}`)
  console.log(`    Total deposited:    ${ledger.deposited}`)
  console.log(`    Human queries:      ${ledger.humanQueries}`)
  console.log(`    Autonomous queries: ${ledger.autonomousQueries}`)

  console.log(`\n  Aave Vault (Base Sepolia — real on-chain):`)
  console.log(`    Pool:               ${finalState.poolAddress}`)
  console.log(`    aToken:             ${finalState.aTokenAddress}`)
  console.log(`    Principal:          ${finalState.principal}`)
  console.log(`    aToken balance:     ${finalState.aTokenBalance}  ← includes real yield`)
  console.log(`    Available yield:    ${finalState.availableYield}`)

  console.log('\n  Every payment in this demo triggers a real Aave supply() on Base Sepolia.')
  console.log('  The aToken balance grows automatically as Aave accrues interest.')
  console.log('\nChrysalis: earn → supply to Aave → yield → withdraw → earn again. Forever.')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  stopTreasury()
  process.exit(0)
}

main().catch(err => {
  console.error('Demo error:', err)
  process.exit(1)
})
