/**
 * Solana Example: Memory Management
 *
 * Demonstrates: Securely disposing wallet accounts and the wallet
 * manager to clear private keys from memory.
 *
 * Run: npx tsx wallet-solana/memory-management.ts
 */

import WalletManagerSolana from '@tetherto/wdk-wallet-solana'
import { loadSolanaConfig } from '../shared/config.js'
import { logSection } from '../shared/helpers.js'

async function main() {
  const config = loadSolanaConfig()

  logSection('Memory Management')

  const wallet = new WalletManagerSolana(config.seedPhrase, {
    rpcUrl: config.rpcUrl,
    commitment: config.commitment,
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
