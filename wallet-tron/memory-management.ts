/**
 * TRON Example: Memory Management
 *
 * Demonstrates: Securely disposing wallet accounts and the wallet
 * manager to clear private keys from memory.
 *
 * Run: npx tsx wallet-tron/memory-management.ts
 */

import WalletManagerTron from '@tetherto/wdk-wallet-tron'
import { loadTronConfig } from '../shared/config.js'
import { logSection } from '../shared/helpers.js'

async function main() {
  const config = loadTronConfig()

  logSection('Memory Management')

  const wallet = new WalletManagerTron(config.seedPhrase, {
    provider: config.provider,
    transferMaxFee: config.transferMaxFee,
  })

  const account = await wallet.getAccount(0)
  console.log('  Account created:', await account.getAddress())

  account.dispose()
  console.log('  Account disposed (private key cleared)')

  wallet.dispose()
  console.log('  Wallet manager disposed (all keys cleared)')

  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
