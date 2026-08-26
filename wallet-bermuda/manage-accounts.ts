/**
 * Bermuda Example: Manage Accounts
 *
 * Demonstrates: Deriving multiple Bermuda accounts by custom BIP-44/Bermuda
 * account indices.
 *
 * Run: npx tsx wallet-bermuda/manage-accounts.ts
 */

import WalletManagerBermuda from '@bermuda/wdk-wallet-bermuda'
import { loadBermudaConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadBermudaConfig()

  logSection('Manage Multiple Accounts')

  const wallet = new WalletManagerBermuda(config.seedPhrase, {
    provider: config.rpcUrl,
  })

  const defaultAccount = await wallet.getBermudaAccount()
  const account00 = await wallet.getBermudaAccount(0, 0)
  const account01 = await wallet.getBermudaAccount(0, 1)

  logResult('Default Bermuda account', { address: defaultAccount.address })
  logResult('Bermuda account 00', { address: account00.address })
  logResult('Bermuda account 01', { address: account01.address })

  wallet.dispose()
  console.log('\nDone.')
}

main().then(() => process.exit(0))
