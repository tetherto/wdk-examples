/**
 * TON Example: Sign & Verify Message
 *
 * Demonstrates: Signing a message with a full account and verifying
 * the signature with a read-only account.
 *
 * Run: npx tsx wallet-ton/sign-verify-message.ts
 */

import WalletManagerTon from '@tetherto/wdk-wallet-ton'
import { loadTonConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadTonConfig()

  logSection('Sign & Verify Message')

  const wallet = new WalletManagerTon(config.seedPhrase, {
    tonClient: config.tonClient,
    transferMaxFee: config.transferMaxFee,
  })

  const account = await wallet.getAccount(0)
  logResult('Signer', { address: await account.getAddress() })

  const message = 'Hello, TON!'
  const signature = await account.sign(message)
  logResult('Signed', { message, signature })

  const readOnlyAccount = await account.toReadOnlyAccount()
  const isValid = await readOnlyAccount.verify(message, signature)
  logResult('Verification', { isValid })

  const isTamperedValid = await readOnlyAccount.verify('Tampered message', signature)
  logResult('Tampered Verification', { isValid: isTamperedValid })

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
