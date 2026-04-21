/**
 * TRON Example: Manage Accounts
 *
 * Demonstrates: Deriving multiple accounts by index and custom BIP-44 paths.
 *
 * Run: npx tsx wallet-tron/manage-accounts.ts
 */

import WalletManagerTron from '@tetherto/wdk-wallet-tron'
import { loadTronConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadTronConfig()

  logSection('Manage Multiple Accounts')

  const wallet = new WalletManagerTron(config.seedPhrase, {
    provider: config.provider,
    transferMaxFee: config.transferMaxFee,
  })

  const account0 = await wallet.getAccount(0)
  logResult('Account 0', { address: await account0.getAddress() })

  const account1 = await wallet.getAccount(1)
  logResult('Account 1', { address: await account1.getAddress() })

  const customAccount = await wallet.getAccountByPath("0'/0/5")
  logResult('Custom Path (0\'/0/5)', { address: await customAccount.getAddress() })

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
