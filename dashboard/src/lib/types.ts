export interface LedgerResponse {
  agent: string
  wallet: string
  earned: string
  deposited: string
  queries: number
  autonomousQueries: number
  humanQueries: number
  aave: {
    pool: string
    aToken: string
    principal: string
    aTokenBalance: string
    availableYield: string
    yieldToNextQuery: string
    canTriggerAutonomousQuery: boolean
  }
}

export interface VaultResponse {
  agent: string
  aave: {
    pool: string
    aToken: string
    network: string
    principal: string
    aTokenBalance: string
    availableYield: string
    yieldToNextQuery: string
    status: string
  }
  venice: {
    role: string
    model: string
    privacy: string
  }
  autonomousQueriesRun: number
  recentLog: string[]
}

export interface HealthResponse {
  agent: string
  price?: string
  wallet?: string
  aaveVaultReady?: boolean
}
