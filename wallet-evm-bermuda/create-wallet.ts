/**
 * Bermuda Example: Create Wallet
 *
 * Demonstrates: Initializing a WalletManagerBermuda, and deriving the master
 * EVM account and its default Bermuda account.
 *
 * Run: npx tsx wallet-evm-bermuda/create-wallet.ts
 */

import WalletManagerBermuda from '@bermuda/wdk-wallet-evm-bermuda'
import { loadBermudaConfig } from '../shared/config.js'
import { logSection, logResult, formatBermudaAddress } from '../shared/helpers.js'

async function main() {
  const config = loadBermudaConfig()

  logSection('Create Wallet')

  const wallet = new WalletManagerBermuda(config.seedPhrase, {
    provider: config.rpcUrl,
  })

  // WalletManagerBermuda extends WalletManagerEvm. The EVM account at index 0
  // is the master of the default Bermuda account and pays for its deposits, so
  // fund it with XPL before running the deposit example.
  const evmAccount = await wallet.getAccount()
  logResult('Master EVM account', { address: evmAccount.address })

  const account00 = await wallet.getBermudaAccount()
  logResult('Default Bermuda account', { address: formatBermudaAddress(account00.address) })

  wallet.dispose()
  console.log('\nDone.')
}

main().then(() => process.exit(0))
