/**
 * Bermuda Example: Create Wallet
 *
 * Demonstrates: Initializing a WalletManagerBermuda, and deriving the default
 * Bermuda account.
 *
 * Run: npx tsx wallet-bermuda/create-wallet.ts
 */

import WalletManagerBermuda from '@bermuda/wdk-wallet-bermuda'
import { loadBermudaConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadBermudaConfig()

  logSection('Create Wallet')

  const wallet = new WalletManagerBermuda(config.seedPhrase, {
    provider: config.rpcUrl,
  })

  const account00 = await wallet.getBermudaAccount()
  logResult('Default Bermuda account', { address: account00.address })

  wallet.dispose()
  console.log('\nDone.')
}

main().then(() => process.exit(0))
