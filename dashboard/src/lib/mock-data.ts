import type { LedgerResponse, VaultResponse } from "./types"

export const mockLedger: LedgerResponse = {
  agent: "Chrysalis Coordinator",
  wallet: "0x7337abD680749819D3eb97A1F52eE58e484EAe0c",
  earned: "$0.24 USDC",
  deposited: "$0.24 USDC",
  queries: 3,
  autonomousQueries: 0,
  humanQueries: 3,
  aave: {
    pool: "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27",
    aToken: "0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC",
    principal: "$2.080000 USDC",
    aTokenBalance: "$2.080003 USDC",
    availableYield: "$0.000003 USDC",
    yieldToNextQuery: "$0.079997 USDC",
    canTriggerAutonomousQuery: false,
  },
}

export const mockVault: VaultResponse = {
  agent: "Chrysalis TreasuryAgent",
  aave: {
    pool: "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27",
    aToken: "0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC",
    network: "Base Sepolia",
    principal: "$2.080000 USDC",
    aTokenBalance: "$2.080003 USDC",
    availableYield: "$0.000003 USDC",
    yieldToNextQuery: "$0.079997 USDC",
    status: "accruing... ($0.079997 to go)",
  },
  venice: {
    role: "strategic reasoning core — privately reasons over vault state using RISE-structured prompting",
    model: "llama-3.3-70b",
    privacy:
      "sensitive financial data never leaves Venice inference — only the on-chain action is public",
  },
  autonomousQueriesRun: 0,
  recentLog: [
    "[13:11:02] [AaveVault] Initialized | Pool: 0x8bAB...aE27 | aUSDC: 0x10F1...0ACC | existing: $2.000000",
    "[13:11:08] [AaveVault] ✓ Approved | tx: 0x1612...cb9",
    "[13:11:15] [AaveVault] ✓ Supplied $0.290003 | supply tx: 0x0f1d...35c",
    "[13:12:01] [AaveVault] Depositing $0.080000 Aave test USDC to Pool...",
    "[13:12:08] [AaveVault] ✓ Approved | tx: 0x3456...d7a",
    "[13:12:14] [AaveVault] ✓ Supplied $0.080000 | supply tx: 0x9aea...ad9",
  ],
}
