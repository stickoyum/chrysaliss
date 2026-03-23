// CompoundingVault — the core of Chrysalis
//
// Every $0.01 margin the Coordinator earns gets deposited here.
// The vault simulates Aave v3 yield (20% APY on Base mainnet USDC pools).
// When accumulated yield >= query cost ($0.08), TreasuryAgent self-initiates
// an autonomous query — which earns another $0.01 → deposits → more yield → loop.
//
// Production path: replace accrueYield() with Aave v3 aToken balance polling:
//   const balance = await aavePool.getReserveData(USDC_ADDRESS)
//   yield = aToken.balanceOf(agentAddress) - principal

export interface VaultState {
  principal: number           // total deposited (sum of all margins + bootstrap)
  totalYieldAccrued: number   // lifetime yield generated so far
  availableYield: number      // yield not yet spent on autonomous queries
  yieldSpent: number          // yield withdrawn to fund autonomous queries
  depositCount: number        // number of deposits (one per query)
  yieldCycles: number         // number of accrual cycles run
  apy: number                 // current simulated APY (20% matches Aave USDC pool)
  triggerThreshold: number    // yield needed to self-fund one query ($0.08)
  yieldToNextQuery: number    // how much more yield needed for next autonomous query
}

const SIMULATED_APY = 0.20          // 20% APY — realistic for Aave USDC on Base
const AUTONOMOUS_QUERY_COST = 0.08  // coordinator charges $0.08/query

export class CompoundingVault {
  private principal = 0
  private totalYieldAccrued = 0
  private yieldSpent = 0
  private depositCount = 0
  private yieldCycles = 0
  private eventLog: string[] = []

  // Seed the vault with initial capital (replaces first N queries of accumulated margin)
  // In production: this is the human's one-time "bootstrap deposit" to Aave supply()
  bootstrap(amount: number) {
    this.principal += amount
    this.log(`[BOOTSTRAP] Seeded vault with $${amount.toFixed(2)} | Principal: $${this.principal.toFixed(4)}`)
  }

  // Coordinator calls this after every successful query ($0.01 margin deposited)
  // Production: coordinator calls aavePool.supply(USDC, 10000, agentAddress, 0)
  deposit(amount: number) {
    this.principal += amount
    this.depositCount++
    this.log(`[DEPOSIT] +$${amount.toFixed(4)} margin → Principal: $${this.principal.toFixed(4)} (${this.depositCount} deposits)`)
  }

  // Apply one yield accrual cycle
  // periodsPerYear=365 means this call represents 1 day of yield at SIMULATED_APY
  // Production: poll Aave aToken balance — it auto-compounds in-contract
  accrueYield(periodsPerYear = 365) {
    const yieldThisCycle = this.principal * (SIMULATED_APY / periodsPerYear)
    this.totalYieldAccrued += yieldThisCycle
    this.yieldCycles++
    // Only log significant yield events to avoid noise
    if (this.yieldCycles % 30 === 0) {
      this.log(`[YIELD] Day ${this.yieldCycles}: +$${(yieldThisCycle * 30).toFixed(6)}/month | Total yield: $${this.totalYieldAccrued.toFixed(6)}`)
    }
    return yieldThisCycle
  }

  // Fast-forward N days of yield (for demo time compression)
  fastForwardDays(days: number) {
    for (let i = 0; i < days; i++) this.accrueYield(365)
    this.log(`[TIME-LAPSE] Fast-forwarded ${days} days | Yield accrued: $${this.totalYieldAccrued.toFixed(4)}`)
  }

  // Check if enough yield has built up to fund an autonomous query
  canSelfFundQuery(): boolean {
    return this.availableYield() >= AUTONOMOUS_QUERY_COST
  }

  // Treasury agent calls this to withdraw yield for an autonomous query
  // Production: aavePool.withdraw(USDC, queryAmount, coordinatorAddress)
  withdrawForQuery(): number {
    if (!this.canSelfFundQuery()) {
      throw new Error(`Insufficient yield: $${this.availableYield().toFixed(6)} < $${AUTONOMOUS_QUERY_COST}`)
    }
    this.yieldSpent += AUTONOMOUS_QUERY_COST
    this.log(`[WITHDRAW] $${AUTONOMOUS_QUERY_COST} yield → autonomous query | Remaining yield: $${this.availableYield().toFixed(6)}`)
    return AUTONOMOUS_QUERY_COST
  }

  availableYield(): number {
    return Math.max(0, this.totalYieldAccrued - this.yieldSpent)
  }

  getState(): VaultState {
    const available = this.availableYield()
    return {
      principal: this.principal,
      totalYieldAccrued: this.totalYieldAccrued,
      availableYield: available,
      yieldSpent: this.yieldSpent,
      depositCount: this.depositCount,
      yieldCycles: this.yieldCycles,
      apy: SIMULATED_APY,
      triggerThreshold: AUTONOMOUS_QUERY_COST,
      yieldToNextQuery: Math.max(0, AUTONOMOUS_QUERY_COST - available),
    }
  }

  getLog(): string[] {
    return this.eventLog
  }

  private log(msg: string) {
    const ts = new Date().toISOString().slice(11, 19)
    this.eventLog.push(`[${ts}] ${msg}`)
  }
}

// Singleton vault — shared across all agents in the same process
export const vault = new CompoundingVault()
