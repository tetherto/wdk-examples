/**
 * Bermuda Example: Manage Accounts
 *
 * Demonstrates: Deriving multiple Bermuda accounts by custom BIP-44/Bermuda
 * account indices.
 *
 * Run: npx tsx wallet-evm-bermuda/manage-accounts.ts
 */

import WalletManagerBermuda from '@bermuda/wdk-wallet-evm-bermuda'
import { loadBermudaConfig } from '../shared/config.js'
import { logSection, logResult, formatBermudaAddress } from '../shared/helpers.js'

async function main() {
  const config = loadBermudaConfig()

  logSection('Manage Multiple Accounts')

  const wallet = new WalletManagerBermuda(config.seedPhrase, {
    provider: config.rpcUrl,
  })

  const defaultAccount = await wallet.getBermudaAccount()
  const account00 = await wallet.getBermudaAccount(0, 0)
  const account01 = await wallet.getBermudaAccount(0, 1)

  logResult('Default Bermuda account', { address: formatBermudaAddress(defaultAccount.address) })
  logResult('Bermuda account 00', { address: formatBermudaAddress(account00.address) })
  logResult('Bermuda account 01', { address: formatBermudaAddress(account01.address) })

  wallet.dispose()
  console.log('\nDone.')
}

main().then(() => process.exit(0))
