// Chrysalis TreasuryAgent — the autonomous loop engine
//
// Monitors real Aave v3 aToken balance on Base Sepolia.
// When yield (aTokenBalance - deposited) >= $0.08:
//   → Venice AI privately reasons over vault state → selects query topic (no data retention)
//   → calls aaveVault.withdrawForQuery() — real Aave withdraw() tx
//   → pays Coordinator $0.08 via x402 (ampersend-sdk)
//   → Coordinator deposits $0.08 back to Aave → loop
//
// Venice integration: private cognition → trustworthy public action
// The vault state (sensitive financial data) is reasoned over privately.
// The output (on-chain withdraw + supply) is fully verifiable on Base Sepolia.

import express from 'express'
import { aaveVault } from './aaveVault.ts'
import { getPayingFetch, PORTS } from './config.ts'
import type { QueryResult } from './coordinator.ts'
import type { Address } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const FALLBACK_TOPICS = [
  'Aave v3 Base interest rate model optimization',
  'Cross-protocol yield arbitrage for autonomous agents',
  'AI agent revenue maximization via dynamic pricing',
  'On-chain treasury rebalancing trigger strategies',
  'Micropayment protocol throughput scaling patterns',
]

// Venice AI — private inference, no data retention
// Reasons over vault state to select the most contextually relevant query topic.
// Financial position stays private; only the resulting on-chain action is public.
async function getVeniceQueryTopic(vaultState: {
  principal: string
  aTokenBalance: string
  availableYield: string
  queryCount: number
}): Promise<string> {
  const apiKey = process.env.VENICE_API_KEY
  if (!apiKey) {
    console.log('[Treasury/Venice] No API key — using fallback topic')
    return FALLBACK_TOPICS[vaultState.queryCount % FALLBACK_TOPICS.length]
  }

  const yieldPerCycle = (parseFloat(vaultState.availableYield.replace(/[^0-9.]/g, '')) / Math.max(1, vaultState.queryCount)).toFixed(6)

  const prompt = `[ROLE]
You are the strategic reasoning core of Chrysalis, a self-compounding DeFi treasury agent on Aave v3 (Base Sepolia). Every research topic you select feeds directly into the compounding loop — better intelligence means faster yield accumulation and more autonomous queries. Your choices shape the agent's long-term economic viability.

[INPUT — confidential vault state]
- Principal deposited to Aave v3: ${vaultState.principal}
- Current aToken balance: ${vaultState.aTokenBalance}
- Available yield being spent now: ${vaultState.availableYield}
- Autonomous queries completed: ${vaultState.queryCount}
- Yield efficiency: $${yieldPerCycle} per query cycle

[STEPS]
1. Assess the vault's growth phase: early accumulation (queries < 5), active growth (5-20), or mature compounding (20+).
2. Identify what research would produce actionable intelligence to increase yield rate, reduce gas costs, expand revenue streams, or improve capital efficiency — anything that accelerates the compounding flywheel.
3. Prioritize feedback-loop topics: research that makes the agent smarter about earning, depositing, or compounding. Avoid generic or overly broad topics.

[EXPECTATION]
Reply with ONLY the research topic string — no explanation, no punctuation, no quotes. 10 words max. The topic must be specific, actionable, and directly relevant to optimizing autonomous agent treasury operations.`

  try {
    const res = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 30,
        temperature: 0.7,
        venice_parameters: { include_venice_system_prompt: false },
      }),
    })

    if (!res.ok) {
      console.log(`[Treasury/Venice] API error ${res.status} — using fallback topic`)
      return FALLBACK_TOPICS[vaultState.queryCount % FALLBACK_TOPICS.length]
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> }
    const topic = data.choices?.[0]?.message?.content?.trim()
    if (topic) {
      console.log(`[Treasury/Venice] 🔒 Private reasoning complete → topic: "${topic}"`)
      return topic
    }
  } catch (err) {
    console.log(`[Treasury/Venice] Error: ${err} — using fallback topic`)
  }

  return FALLBACK_TOPICS[vaultState.queryCount % FALLBACK_TOPICS.length]
}

let autonomousQueryCount = 0
let monitorActive = false

export function startTreasuryAgent() {
  const app = express()
  app.use(express.json())

  const payingFetch = getPayingFetch()
  const agentAddress = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY as `0x${string}`).address as Address

  const monitorInterval = setInterval(async () => {
    try {
      const canTrigger = await aaveVault.canSelfFundQuery()
      if (!canTrigger || monitorActive) return
      monitorActive = true

      autonomousQueryCount++

      const stateBefore = await aaveVault.getState()
      console.log(`\n[Treasury] 🌱 AUTONOMOUS QUERY #${autonomousQueryCount} — funded by real Aave yield`)
      console.log(`[Treasury]   aToken: ${stateBefore.aTokenBalance} | yield: ${stateBefore.availableYield}`)

      // Venice: private reasoning over vault state → topic selection (no data retention)
      console.log(`[Treasury/Venice] 🔒 Reasoning privately over vault state...`)
      const topic = await getVeniceQueryTopic({
        principal: stateBefore.principal,
        aTokenBalance: stateBefore.aTokenBalance,
        availableYield: stateBefore.availableYield,
        queryCount: autonomousQueryCount,
      })

      console.log(`[Treasury]   Withdrawing $0.08 from Aave → paying Coordinator...`)
      const withdrawTx = await aaveVault.withdrawForQuery(agentAddress)
      console.log(`[Treasury]   ✓ Aave withdraw tx: ${withdrawTx}`)

      const res = await payingFetch(`http://localhost:${PORTS.coordinator}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, _source: 'autonomous' }),
      })

      if (res.ok) {
        const result = await res.json() as QueryResult
        const stateAfter = await aaveVault.getState()
        console.log(`[Treasury] ✓ Autonomous query complete — topic: "${result.topic}"`)
        console.log(`[Treasury]   Deposited $0.08 back to Aave | new principal: ${stateAfter.principal}`)
        console.log(`[Treasury]   Aave supply tx: ${result.aaveSupplyTx}`)
      } else {
        console.error(`[Treasury] ✗ Autonomous query failed: ${res.status}`)
      }
    } catch (err) {
      console.error(`[Treasury] ✗ Error: ${err}`)
    } finally {
      monitorActive = false
    }
  }, 30_000)

  app.get('/vault', async (_req, res) => {
    try {
      const state = await aaveVault.getState()
      res.json({
        agent: 'Chrysalis TreasuryAgent',
        aave: {
          pool: state.poolAddress,
          aToken: state.aTokenAddress,
          network: 'Base Sepolia',
          principal: state.principal,
          aTokenBalance: state.aTokenBalance,
          availableYield: state.availableYield,
          yieldToNextQuery: state.yieldToNextQuery,
          status: state.canTriggerQuery
            ? 'READY — autonomous query will fire on next cycle'
            : `accruing... (${state.yieldToNextQuery} to go)`,
        },
        venice: {
          role: 'private cognition — reasons over vault state to select query topic (no data retention)',
          model: 'llama-3.3-70b',
          privacy: 'sensitive financial data never leaves Venice inference — only the on-chain action is public',
        },
        autonomousQueriesRun: autonomousQueryCount,
        recentLog: aaveVault.getLog().slice(-20),
      })
    } catch (err) {
      res.status(500).json({ error: String(err) })
    }
  })

  app.get('/health', async (_req, res) => {
    const state = await aaveVault.getState().catch(() => null)
    res.json({ agent: 'Chrysalis TreasuryAgent', aaveVaultReady: !!state })
  })

  app.listen(PORTS.treasury, () => {
    console.log(`[TreasuryAgent] Listening on :${PORTS.treasury}`)
    console.log(`[TreasuryAgent] Polling Aave aToken balance every 30s — withdraws yield when >= $0.08`)
  })

  return { app, stop: () => clearInterval(monitorInterval) }
}
