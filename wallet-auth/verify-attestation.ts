/**
 * Wallet Auth Example: Verify Attestation
 *
 * Demonstrates: Requesting a wallet auth result as an ES256 JWT and verifying
 * it locally against the public JWKS, so the decision a policy acted on can
 * be re-checked later by anyone without calling the API again.
 *
 * Run: npx tsx wallet-auth/verify-attestation.ts
 */

import WalletAuth from '@insumermodel/wdk-protocol-wallet-auth'
import { createRemoteJWKSet, jwtVerify, errors } from 'jose'
import { loadWalletAuthConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'
import { RECIPIENT_CONDITION, EXAMPLE_PASSING_ADDRESS } from './conditions.js'

const JWKS_URL = 'https://insumermodel.com/.well-known/jwks.json'
const ISSUER = 'https://api.insumermodel.com'

async function main() {
  const config = loadWalletAuthConfig()

  logSection('Verify Wallet Auth Attestation')

  const walletAuth = new WalletAuth({ apiKey: config.insumerApiKey })

  // 1. Request the result as a JWT alongside the signed attestation
  const result = await walletAuth.attest({
    address: EXAMPLE_PASSING_ADDRESS,
    conditions: [RECIPIENT_CONDITION],
    jwt: true,
  })
  if (!result.jwt) throw new Error('The response did not include a JWT')

  logResult('Issued', {
    passed: result.passed,
    kid: result.kid,
    jwtPreview: `${result.jwt.slice(0, 40)}…`,
  })

  // 2. Verify the signature locally; the key is selected by the token's kid
  const jwks = createRemoteJWKSet(new URL(JWKS_URL))
  const { payload, protectedHeader } = await jwtVerify(result.jwt, jwks, {
    issuer: ISSUER,
    algorithms: ['ES256'],
  })

  logResult('Verified', {
    alg: protectedHeader.alg,
    kid: protectedHeader.kid,
    subject: payload.sub,
    pass: payload.pass,
    blockNumber: payload.blockNumber,
    expires: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
  })

  // 3. Changing any signed claim breaks verification
  const [header, body, signature] = result.jwt.split('.')
  const claims = JSON.parse(Buffer.from(body, 'base64url').toString())
  const tamperedBody = Buffer.from(JSON.stringify({ ...claims, pass: !claims.pass })).toString('base64url')
  const tampered = [header, tamperedBody, signature].join('.')

  try {
    await jwtVerify(tampered, jwks, { issuer: ISSUER, algorithms: ['ES256'] })
    throw new Error('The tampered token verified, which should never happen')
  } catch (err) {
    if (!(err instanceof errors.JWSSignatureVerificationFailed)) throw err
    logResult('Tampered Copy', { verified: false, error: err.code })
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
