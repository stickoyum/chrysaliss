// Chrysalis — Self-Compounding AI Agent
// Starts all agents: Coordinator, TreasuryAgent

import 'dotenv/config'
import { startCoordinator } from './coordinator.ts'
import { startTreasuryAgent } from './treasuryAgent.ts'
import { startFacilitator } from './facilitator.ts'
import { getAgentWallet, getUsdcBalance } from './config.ts'
import { aaveVault } from './aaveVault.ts'
import type { Hex } from 'viem'

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║            CHRYSALIS — Self-Compounding AI Agent             ║')
  console.log('║  Earn USDC → Deposit full payment to Aave → Accrue yield     ║')
  console.log('║  Vault yield funds autonomous queries → More yield → Loop     ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  const { account } = getAgentWallet()
  const startBalance = await getUsdcBalance(account.address)
  console.log(`Agent wallet: ${account.address}`)
  console.log(`Starting USDC balance: $${startBalance}\n`)

  console.log('Initializing Aave vault...')
  await aaveVault.init(process.env.AGENT_PRIVATE_KEY as Hex)
  const vaultState = await aaveVault.getState()
  console.log(`Aave Pool:   ${vaultState.poolAddress}`)
  console.log(`aToken:      ${vaultState.aTokenAddress}`)
  console.log(`aToken bal:  ${vaultState.aTokenBalance}\n`)

  startFacilitator()
  await new Promise(r => setTimeout(r, 500))
  startCoordinator()
  await new Promise(r => setTimeout(r, 200))
  startTreasuryAgent()

  console.log('\n✓ All agents running.\n')
  console.log('  Send queries to the Coordinator (x402-gated):')
  console.log('    POST http://localhost:4000/query')
  console.log('    Body: { "topic": "DeFi yield strategies", "description": "..." }')
  console.log('\n  Monitor the vault:')
  console.log('    GET  http://localhost:4003/vault   ← live vault state + yield log')
  console.log('    GET  http://localhost:4000/ledger  ← P&L + vault summary')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
