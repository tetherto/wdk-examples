/**
 * EVM Example: Sign & Verify Message
 *
 * Demonstrates: Signing a message with a full account and verifying
 * the signature with a read-only account. Works fully offline.
 *
 * Run: npx tsx evm/07-sign-verify-message.ts
 */

import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import { loadEvmConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadEvmConfig()

  logSection('Sign & Verify Message')

  const wallet = new WalletManagerEvm(config.seedPhrase, {
    provider: config.rpcUrl,
  })

  const account = await wallet.getAccount(0)
  const address = await account.getAddress()
  logResult('Signer', { address })

  const message = 'Hello, Ethereum!'
  const signature = await account.sign(message)
  logResult('Signed', { message, signature })

  const readOnlyAccount = await account.toReadOnlyAccount()
  const isValid = await readOnlyAccount.verify(message, signature)
  logResult('Verification', { isValid })

  // Verify with a tampered message should fail
  const isTamperedValid = await readOnlyAccount.verify('Tampered message', signature)
  logResult('Tampered Verification', { isValid: isTamperedValid })

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
