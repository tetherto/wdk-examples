/**
 * Wallet Auth Example: Stacked condition check
 *
 * Demonstrates: Stacking multiple conditions (token balance + NFT ownership)
 * in a single signed attestation. All conditions must pass for the overall
 * attestation to pass; per-condition results are returned alongside.
 *
 * Run: npx tsx wallet-auth/condition-stack.ts
 */

import { loadWalletAuthConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const { verifierUrl, apiKey, testWallet } = loadWalletAuthConfig()

  logSection('Wallet Auth — stacked conditions')

  const res = await fetch(`${verifierUrl}/v1/attest`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({
      wallet: testWallet,
      conditions: [
        {
          type: 'token_balance',
          contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          chainId: 1,
          threshold: 1000,
          decimals: 6,
          label: 'USDC >= 1000',
        },
        {
          type: 'nft_ownership',
          contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
          chainId: 1,
          label: 'BAYC holder',
        },
      ],
    }),
  })

  if (!res.ok) throw new Error(`Attestation failed: ${res.status} ${await res.text()}`)

  const body = await res.json()
  const attestation = body.data.attestation

  logResult('Overall', { pass: attestation.pass })
  console.log('\nPer-condition results:')
  for (const r of attestation.results) {
    console.log(`  - ${r.label}: ${r.met ? 'pass' : 'fail'}`)
  }
  logResult('Meta', {
    blockNumber: attestation.results[0]?.blockNumber,
    kid: body.data.kid,
    creditsCharged: body.meta.creditsCharged,
    creditsRemaining: body.meta.creditsRemaining,
  })

  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
