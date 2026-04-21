/**
 * Solana Example: Sign & Verify Message
 *
 * Demonstrates: Signing a message with a full account and verifying
 * the signature with a read-only account.
 *
 * Run: npx tsx wallet-solana/sign-verify-message.ts
 */

import WalletManagerSolana from '@tetherto/wdk-wallet-solana'
import { loadSolanaConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadSolanaConfig()

  logSection('Sign & Verify Message')

  const wallet = new WalletManagerSolana(config.seedPhrase, {
    rpcUrl: config.rpcUrl,
    commitment: config.commitment,
    transferMaxFee: config.transferMaxFee,
  })

  const account = await wallet.getAccount(0)
  logResult('Signer', { address: await account.getAddress() })

  const message = 'Hello, Solana!'
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
