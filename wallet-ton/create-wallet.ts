/**
 * TON Example: Create Wallet
 *
 * Demonstrates: Initializing a WalletManagerTon, deriving an account,
 * and converting it to a read-only account.
 *
 * Run: npx tsx wallet-ton/create-wallet.ts
 */

import WalletManagerTon from '@tetherto/wdk-wallet-ton'
import { loadTonConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadTonConfig()

  logSection('Create Wallet')

  const wallet = new WalletManagerTon(config.seedPhrase, {
    tonClient: config.tonClient,
    transferMaxFee: config.transferMaxFee,
  })

  const account = await wallet.getAccount(0)
  logResult('Account 0', { address: await account.getAddress() })

  const readOnlyAccount = await account.toReadOnlyAccount()
  logResult('Read-Only Account', { address: await readOnlyAccount.getAddress() })

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
