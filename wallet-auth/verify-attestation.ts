/**
 * Wallet Auth Example: Offline JWT verification
 *
 * Demonstrates: Request an attestation in JWT format, then verify the
 * signature locally against the public JWKS — no network call to the
 * verifier required for verification. Useful for caching attestations
 * and re-checking them in offline / air-gapped contexts.
 *
 * Run: npx tsx wallet-auth/verify-attestation.ts
 */

import { jwtVerify, createRemoteJWKSet } from 'jose'
import { loadWalletAuthConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const { verifierUrl, apiKey, testWallet } = loadWalletAuthConfig()

  logSection('Wallet Auth — offline JWT verification')

  // 1. Request an attestation in JWT format
  const res = await fetch(`${verifierUrl}/v1/attest`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({
      wallet: testWallet,
      format: 'jwt',
      conditions: [
        {
          type: 'token_balance',
          contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          chainId: 1,
          threshold: 1,
          decimals: 6,
          label: 'USDC > 0',
        },
      ],
    }),
  })

  if (!res.ok) throw new Error(`Attestation failed: ${res.status}`)
  const body = await res.json()
  const jwt = body.data.jwt as string

  logResult('Issued', { jwtPreview: jwt.slice(0, 60) + '…', kid: body.data.kid })

  // 2. Verify the JWT offline using the public JWKS
  const JWKS = createRemoteJWKSet(new URL('https://insumermodel.com/.well-known/jwks.json'))
  const { payload, protectedHeader } = await jwtVerify(jwt, JWKS, {
    issuer: 'https://api.insumermodel.com',
  })

  logResult('Verified', {
    alg: protectedHeader.alg,
    kid: protectedHeader.kid,
    iss: payload.iss,
    sub: payload.sub,
    pass: (payload as any).pass,
    blockNumber: (payload as any).blockNumber,
  })

  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
