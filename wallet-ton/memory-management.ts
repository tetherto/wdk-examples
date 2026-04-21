/**
 * TON Example: Memory Management
 *
 * Demonstrates: Securely disposing wallet accounts and the wallet
 * manager to clear private keys from memory.
 *
 * Run: npx tsx wallet-ton/memory-management.ts
 */

import WalletManagerTon from '@tetherto/wdk-wallet-ton'
import { loadTonConfig } from '../shared/config.js'
import { logSection } from '../shared/helpers.js'

async function main() {
  const config = loadTonConfig()

  logSection('Memory Management')

  const wallet = new WalletManagerTon(config.seedPhrase, {
    tonClient: config.tonClient,
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
