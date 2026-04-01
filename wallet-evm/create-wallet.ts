/**
 * EVM Example: Create Wallet
 *
 * Demonstrates: Initializing a WalletManagerEvm, deriving an account,
 * and converting it to a read-only account.
 *
 * Run: npx tsx evm/01-create-wallet.ts
 */

import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import { loadEvmConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadEvmConfig()

  logSection('Create Wallet')

  const wallet = new WalletManagerEvm(config.seedPhrase, {
    provider: config.rpcUrl,
  })

  const account = await wallet.getAccount(0)
  const address = await account.getAddress()
  logResult('Account 0', { address })

  const readOnlyAccount = await account.toReadOnlyAccount()
  const roAddress = await readOnlyAccount.getAddress()
  logResult('Read-Only Account', { address: roAddress })

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
