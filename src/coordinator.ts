// Chrysalis Coordinator — the self-compounding core
//
// earn $0.08 via x402 → DEPOSIT $0.08 to Aave v3 (Base Sepolia)
// Aave accrues real yield on the growing principal
// TreasuryAgent monitors aToken balance — when yield >= $0.08, self-funds next query
// → autonomous query deposits another $0.08 → more yield → loop

import express from 'express'
import { paymentMiddleware } from 'x402-express'
import { getAgentWallet, PORTS, PRICES, MARGIN_PER_QUERY, getUsdcBalance } from './config.ts'
import { FACILITATOR_URL } from './facilitator.ts'
import { aaveVault } from './aaveVault.ts'

export interface QueryResult {
  topic: string
  economics: {
    earned: string
    deposited: string
    vaultPrincipal: string
    vaultYield: string
    runningBalance: string
  }
  source: 'human' | 'autonomous'
  aaveSupplyTx: string
}

const ledger = { earned: 0, queries: 0, autonomousQueries: 0 }

export function startCoordinator() {
  const app = express()
  app.use(express.json())

  const { account } = getAgentWallet()

  app.use(paymentMiddleware(
    account.address,
    { '/query': { price: PRICES.coordinator, network: 'base-sepolia' } },
    { url: FACILITATOR_URL },
  ))

  app.post('/query', async (req, res) => {
    const { topic, _source } = req.body as {
      topic?: string
      _source?: 'human' | 'autonomous'
    }

    const source = _source || 'human'
    const label = topic || 'query'
    console.log(`\n[Coordinator] ${source === 'autonomous' ? '🌱 YIELD-FUNDED' : '👤 Human'} query: "${label}"`)

    try {
      ledger.earned += 0.08
      ledger.queries += 1
      if (source === 'autonomous') ledger.autonomousQueries += 1

      // Deposit full $0.08 to Aave v3 (non-blocking — queued behind any pending settlements)
      console.log(`[Coordinator] → Depositing $${MARGIN_PER_QUERY} to Aave v3...`)
      let supplyTx = 'pending'
      aaveVault.deposit(MARGIN_PER_QUERY).then(tx => {
        supplyTx = tx
        console.log(`[Coordinator] ✓ Aave deposit confirmed | tx: ${tx}`)
      }).catch(err => {
        console.error(`[Coordinator] ✗ Aave deposit failed: ${err}`)
      })

      const vaultState = await aaveVault.getState()
      const walletBalance = await getUsdcBalance(account.address)

      const result: QueryResult = {
        topic: label,
        economics: {
          earned: `$${ledger.earned.toFixed(2)} USDC`,
          deposited: `$${(ledger.queries * MARGIN_PER_QUERY).toFixed(2)} USDC`,
          vaultPrincipal: vaultState.principal,
          vaultYield: vaultState.availableYield,
          runningBalance: `$${walletBalance} USDC`,
        },
        source,
        aaveSupplyTx: supplyTx,
      }

      res.json(result)
    } catch (err) {
      console.error(`[Coordinator] ✗ Error: ${err}`)
      res.status(500).json({ error: String(err) })
    }
  })

  app.get('/ledger', async (_req, res) => {
    const vaultState = await aaveVault.getState()
    res.json({
      agent: 'Chrysalis Coordinator',
      wallet: account.address,
      earned: `$${ledger.earned.toFixed(2)} USDC`,
      deposited: `$${(ledger.queries * MARGIN_PER_QUERY).toFixed(2)} USDC`,
      queries: ledger.queries,
      autonomousQueries: ledger.autonomousQueries,
      humanQueries: ledger.queries - ledger.autonomousQueries,
      aave: {
        pool: vaultState.poolAddress,
        aToken: vaultState.aTokenAddress,
        principal: vaultState.principal,
        aTokenBalance: vaultState.aTokenBalance,
        availableYield: vaultState.availableYield,
        yieldToNextQuery: vaultState.yieldToNextQuery,
        canTriggerAutonomousQuery: vaultState.canTriggerQuery,
      }
    })
  })

  app.get('/health', (_req, res) => {
    res.json({ agent: 'Chrysalis Coordinator', price: PRICES.coordinator, wallet: account.address })
  })

  app.listen(PORTS.coordinator, () => {
    console.log(`[Coordinator] Listening on :${PORTS.coordinator} — charges ${PRICES.coordinator} per query`)
    console.log(`[Coordinator] Full $${MARGIN_PER_QUERY} deposited to Aave after each query`)
    console.log(`[Coordinator] Wallet: ${account.address}`)
  })

  return app
}
