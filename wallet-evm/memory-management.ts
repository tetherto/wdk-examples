/**
 * EVM Example: Memory Management
 *
 * Demonstrates: Securely disposing wallet accounts and the wallet
 * manager to clear private keys from memory.
 *
 * Run: npx tsx evm/09-memory-management.ts
 */

import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import { loadEvmConfig } from '../shared/config.js'
import { logSection } from '../shared/helpers.js'

async function main() {
  const config = loadEvmConfig()

  logSection('Memory Management')

  const wallet = new WalletManagerEvm(config.seedPhrase, {
    provider: config.rpcUrl,
  })

  const account = await wallet.getAccount(0)
  const address = await account.getAddress()
  console.log('  Account created:', address)

  // Dispose individual account
  account.dispose()
  console.log('  Account disposed (private key cleared)')

  // Dispose entire wallet manager (disposes all accounts)
  wallet.dispose()
  console.log('  Wallet manager disposed (all keys cleared)')

  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
