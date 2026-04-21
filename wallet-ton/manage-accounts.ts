/**
 * TON Example: Manage Accounts
 *
 * Demonstrates: Deriving multiple accounts by index and custom BIP-44 paths.
 *
 * Run: npx tsx wallet-ton/manage-accounts.ts
 */

import WalletManagerTon from '@tetherto/wdk-wallet-ton'
import { loadTonConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadTonConfig()

  logSection('Manage Multiple Accounts')

  const wallet = new WalletManagerTon(config.seedPhrase, {
    tonClient: config.tonClient,
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
