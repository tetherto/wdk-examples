/**
 * Wallet Auth Example: Pre-transaction condition check
 *
 * Demonstrates: Calling a wallet auth verifier to check whether a wallet
 * satisfies an on-chain condition before building a transaction. Returns
 * a cryptographically signed pass/fail.
 *
 * Companion to feature request #46 (WalletAuthProtocol as a fifth protocol
 * base class). This sample shows the request/response shape an eventual
 * WalletAuthProtocol implementation would expose.
 *
 * Run: npx tsx wallet-auth/condition-check.ts
 */

import { loadWalletAuthConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

interface Condition {
  type: 'token_balance' | 'nft_ownership' | 'eas_attestation' | 'farcaster_id'
  contractAddress?: string
  chainId: number | string
  threshold?: number
  decimals?: number
  label?: string
}

async function main() {
  const { verifierUrl, apiKey, testWallet } = loadWalletAuthConfig()

  logSection('Wallet Auth — pre-transaction condition check')

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
        } satisfies Condition,
      ],
    }),
  })

  if (!res.ok) throw new Error(`Attestation failed: ${res.status} ${await res.text()}`)

  const body = await res.json()
  const attestation = body.data.attestation

  logResult('Attestation', {
    pass: attestation.pass,
    blockNumber: attestation.results[0]?.blockNumber,
    kid: body.data.kid,
    creditsRemaining: body.meta.creditsRemaining,
  })

  if (attestation.pass) {
    console.log('\n→ Wallet satisfies the condition. Safe to proceed with the transaction.')
  } else {
    console.log('\n→ Wallet does NOT satisfy the condition. Skip the transaction.')
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
