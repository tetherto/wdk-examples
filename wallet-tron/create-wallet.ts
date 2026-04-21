/**
 * TRON Example: Create Wallet
 *
 * Demonstrates: Initializing a WalletManagerTron, deriving an account,
 * and converting it to a read-only account.
 *
 * Run: npx tsx wallet-tron/create-wallet.ts
 */

import WalletManagerTron from '@tetherto/wdk-wallet-tron'
import { loadTronConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadTronConfig()

  logSection('Create Wallet')

  const wallet = new WalletManagerTron(config.seedPhrase, {
    provider: config.provider,
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
