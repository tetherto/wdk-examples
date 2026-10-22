/**
 * Wallet Auth Example: Policy Gate
 *
 * Demonstrates: Using a wallet auth check as a condition in the WDK
 * transaction policy engine. A project-scope policy denies an ERC-20
 * transfer unless the recipient wallet meets an on-chain condition, which
 * InsumerAPI evaluates and signs before anything is signed locally.
 *
 * By default this only simulates the policy decision for two recipients,
 * so no funds are needed. Set ACTUALLY_SEND=true in .env to send a real
 * transfer to EVM_RECIPIENT_ADDRESS through the governed account (requires
 * a funded wallet + token balance).
 *
 * Run: npx tsx wallet-auth/policy-gate.ts
 */

import WDK, { PolicyViolationError } from '@tetherto/wdk'
import type { SimulationResult } from '@tetherto/wdk'
import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import WalletAuth from '@insumermodel/wdk-protocol-wallet-auth'
import { loadWalletAuthConfig, optionalEnv } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'
import { RECIPIENT_CONDITION, EXAMPLE_PASSING_ADDRESS } from './conditions.js'

interface TransferParams {
  token: string
  recipient: string
  amount: bigint
}

async function main() {
  const config = loadWalletAuthConfig()
  const actuallySend = optionalEnv('ACTUALLY_SEND') === 'true'

  logSection('Wallet Auth Policy Gate')

  const walletAuth = new WalletAuth({ apiKey: config.insumerApiKey })

  // The signed result behind each decision, keyed by recipient. In production,
  // persist it as the audit trail for the transfer.
  const checks = new Map<string, { passed: boolean; kid: string; sig: string }>()

  const wdk = new WDK(config.seedPhrase)
    .registerWallet('ethereum', WalletManagerEvm, {
      provider: config.rpcUrl,
      transferMaxFee: 100000000000000,
    })
    .registerPolicy({
      id: 'recipient-wallet-auth',
      name: 'Recipients must pass wallet auth',
      scope: 'project',
      rules: [
        {
          // DENY rules fail closed: if the check throws or times out, the
          // engine treats the rule as matched and blocks the transfer.
          name: 'deny-if-recipient-fails-wallet-auth',
          operation: 'transfer',
          action: 'DENY',
          reason: `Recipient does not meet: ${RECIPIENT_CONDITION.label}`,
          conditions: [
            async ({ args }) => {
              const { recipient } = args[0] as TransferParams
              const result = await walletAuth.attest({
                address: recipient,
                conditions: [RECIPIENT_CONDITION],
              })
              checks.set(recipient.toLowerCase(), { passed: result.passed, kid: result.kid, sig: result.sig })
              return !result.passed
            },
          ],
        },
        {
          // Governed accounts are default-deny, so transfers that clear the
          // DENY rule above need an explicit ALLOW.
          name: 'allow-transfers',
          operation: 'transfer',
          action: 'ALLOW',
          conditions: [],
        },
      ],
    })

  const account = await wdk.getAccount('ethereum', 0)
  logResult('Sender', { address: await account.getAddress() })

  // `simulate` runs the full policy evaluation without executing the transfer.
  const { simulate } = account as unknown as {
    simulate: { transfer: (params: TransferParams) => Promise<SimulationResult> }
  }

  const recipients = [
    { label: 'Recipient That Meets the Condition', address: EXAMPLE_PASSING_ADDRESS },
    { label: 'Recipient From .env', address: config.recipientAddress },
  ]

  for (const { label, address } of recipients) {
    const decision = await simulate.transfer({
      token: config.tokenContract,
      recipient: address,
      amount: 1000000n,
    })
    const check = checks.get(address.toLowerCase())
    // Set when the check itself failed (e.g. network error), which the DENY rule treats as a match.
    const conditionError = decision.trace.find((entry) => entry.error)?.error

    logResult(label, {
      recipient: address,
      decision: decision.decision,
      rule: decision.matched_rule,
      reason: decision.reason,
      conditionError,
      walletAuthPassed: check?.passed,
      signedWithKid: check?.kid,
      signature: check ? `${check.sig.slice(0, 24)}…` : undefined,
    })
  }

  if (actuallySend) {
    console.log('\nSending real token transfer through the governed account...')
    try {
      const result = await account.transfer({
        token: config.tokenContract,
        recipient: config.recipientAddress,
        amount: 1000000n,
      })
      logResult('Transfer Sent', { hash: result.hash })
    } catch (err) {
      if (!(err instanceof PolicyViolationError)) throw err
      logResult('Blocked Before Signing', {
        policy: err.policyId,
        rule: err.ruleName,
        reason: err.reason,
      })
    }
  } else {
    console.log('\nSkipping actual transfer (set ACTUALLY_SEND=true to send)')
  }

  wdk.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
