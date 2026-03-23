# Chrysalis — The Self-Compounding AI Agent

> **Seed it once. It runs forever.** Chrysalis is the first AI agent that earns USDC, deposits every payment into Aave v3, and uses real on-chain yield to fund its own queries — permanently. No human top-up. No treasury drain. Just compound growth.

Every other AI agent eventually runs dry. Chrysalis gets richer with every query.

## The Problem

Every AI agent today burns through its wallet. Earn, spend, stop, refill. The human is always in the loop.

## The Solution

Chrysalis closes the loop with a two-layer compounding economy:

```
Human pays $0.08 USDC via x402
      ↓
 Coordinator (earns $0.08)
      └── deposits full $0.08 → Aave v3 Pool.supply()
                                         ↓
                              aToken balance grows on-chain
                              (real yield via Aave liquidity index)
                                         ↓
                         yield >= $0.08 → TreasuryAgent fires
                              Pool.withdraw($0.08) → pays Coordinator
                                         ↓
                    autonomous query runs — zero human payment
                                         ↓
                         $0.08 deposited back to Aave
                                         ↓
                              principal grows → more yield → ∞
```

**Every Aave interaction is a real on-chain transaction** — `supply()`, `withdraw()`, `balanceOf()` — all verifiable on Base Sepolia.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      User / Client                            │
│              pays $0.08 USDC via x402 (ampersend-sdk)        │
└─────────────────────────┬────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│               Coordinator Agent :4000                         │
│  EARNS $0.08/query via paymentMiddleware                     │
│  DEPOSITS $0.08/query → Aave v3 Pool.supply() (real on-chain)│
└─────────────────────────┬────────────────────────────────────┘
                          │ aToken balance grows
┌─────────────────────────▼────────────────────────────────────┐
│               Aave v3 Pool (Base Sepolia)                     │
│  Real supply() / withdraw() transactions                      │
│  aToken balance = principal + accrued interest                │
└─────────────────────────┬────────────────────────────────────┘
                          │ yield >= $0.08
┌─────────────────────────▼────────────────────────────────────┐
│               TreasuryAgent :4003                             │
│  Polls real Aave aToken balance every 30s                    │
│  Venice AI privately reasons over vault state (no data retention)│
│  When yield >= $0.08: Pool.withdraw() → pays Coordinator     │
│  AUTONOMOUS QUERY — zero human payment                        │
│  Coordinator deposits $0.08 back → loop continues            │
└──────────────────────────────────────────────────────────────┘
```

## ampersend-sdk: Load-Bearing on Both Sides

```typescript
// 1. EARNING — Coordinator gates incoming queries behind x402
app.use(paymentMiddleware(account.address, {
  '/query': { price: '$0.08', network: 'base-sepolia' }
}))

// 2. AUTONOMOUS — TreasuryAgent pays Coordinator using Aave yield
const treasuryFetch = getPayingFetch()
await treasuryFetch(`http://localhost:4000/query`, { ... }) // auto-pays $0.08 from yield
```

Remove ampersend-sdk and both payment flows stop. The agent cannot earn and cannot self-fund.

## Venice AI: Private Cognition, Public Action

TreasuryAgent uses Venice (llama-3.3-70b, no data retention) to privately reason over vault state before each autonomous action. The vault's financial position — principal, yield, efficiency metrics — stays private. Only the resulting on-chain transaction is public and verifiable.

This is the "private cognition → trustworthy public action" pattern: sensitive reasoning happens off-chain with zero data retention, while every on-chain action is fully auditable on Basescan.

## Live Proof (Base Sepolia)

All transactions are verifiable on Basescan:

**Agent wallet:** [`0x7337abD680749819D3eb97A1F52eE58e484EAe0c`](https://sepolia.basescan.org/address/0x7337abD680749819D3eb97A1F52eE58e484EAe0c)

Look for: `Pool.supply()` calls after each query, `Pool.withdraw()` calls by TreasuryAgent, and `transferWithAuthorization` settlements via x402.

## Aave v3 Contracts (Base Sepolia)

| Contract | Address |
|----------|---------|
| Pool | `0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27` |
| Aave test USDC | `0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f` |
| aUSDC | `0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC` |
| Faucet | `0xD9145b5F9B9a6AC29706F01DB08fDeEf6E05D7CD` |

## Run It

```bash
git clone https://github.com/stickoyum/chrysalis
cd chrysalis
npm install

cp .env.example .env
# Fill in AGENT_PRIVATE_KEY (needs Base Sepolia ETH for gas)

# Full demo: bootstrap Aave vault + human queries + autonomous query from yield
npm run demo
```

## Endpoints

| Agent | Port | Endpoint | Price |
|-------|------|----------|-------|
| Coordinator | 4000 | `POST /query` | $0.08 USDC |
| Coordinator | 4000 | `GET /ledger` | free |
| TreasuryAgent | 4003 | `GET /vault` | free |

## Tech Stack

- **ampersend-sdk** — x402 payment handling (earning + autonomous spending)
- **x402-express** — payment middleware for Express servers
- **@x402/fetch** — auto-paying fetch wrapper
- **Venice AI** — llama-3.3-70b, no data retention — private treasury reasoning
- **Aave v3** — real `supply()` / `withdraw()` on Base Sepolia
- **viem** — on-chain reads and transaction submission
- **Base Sepolia** — USDC payments on testnet
- **TypeScript + Node.js**

## Tracks — Total Prize Eligibility: $44,254

| Track | Prize | Fit |
|-------|-------|-----|
| **Synthesis Open Track** | $14,500 | Cross-sponsor compatible — Base, USDC, Aave v3, x402, Venice, autonomous agent |
| **Venice — Private Agents, Trusted Actions** | $11,500 | Venice reasons privately over vault state (no data retention). On-chain actions are fully public. Classic private cognition → trustworthy public action. |
| **Protocol Labs — Let the Agent Cook** | $8,000 | TreasuryAgent runs the full autonomous loop — detect yield → withdraw → pay → deposit → loop — with zero human involvement. Real tool use, `agent.json` and `agent_log.json` included. |
| **Protocol Labs — Agents with Receipts** | $8,004 | Every action has an on-chain tx hash. All Aave interactions and x402 settlements verifiable on Basescan. |
| **Merit/AgentCash — Build with AgentCash** | $1,750 | x402 pay-per-request is the core mechanic — Coordinator charges, TreasuryAgent pays autonomously from yield. |
| **Ampersend — Best Agent Built with ampersend-sdk** | $500 | ampersend-sdk is load-bearing on both earning and spending sides. |
