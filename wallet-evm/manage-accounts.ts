/**
 * EVM Example: Manage Accounts
 *
 * Demonstrates: Deriving multiple accounts by index and custom derivation paths.
 *
 * Run: npx tsx evm/02-manage-accounts.ts
 */

import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import { loadEvmConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadEvmConfig()

  logSection('Manage Multiple Accounts')

  const wallet = new WalletManagerEvm(config.seedPhrase, {
    provider: config.rpcUrl,
  })

  const account0 = await wallet.getAccount(0)
  const address0 = await account0.getAddress()
  logResult('Account 0', { address: address0 })

  const account1 = await wallet.getAccount(1)
  const address1 = await account1.getAddress()
  logResult('Account 1', { address: address1 })

  // Custom derivation path: m/44'/60'/0'/0/5
  const customAccount = await wallet.getAccountByPath("0'/0/5")
  const customAddress = await customAccount.getAddress()
  logResult('Custom Path (0\'/0/5)', { address: customAddress })

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
