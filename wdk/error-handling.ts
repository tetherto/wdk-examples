/**
 * WDK Core Example: Error Handling
 *
 * Demonstrates: Handling missing wallet registrations and disposing
 * specific blockchains without affecting others.
 *
 * Run: npx tsx wdk/error-handling.ts
 */

import WDK from '@tetherto/wdk'
import WalletManagerSolana from '@tetherto/wdk-wallet-solana'
import WalletManagerTon from '@tetherto/wdk-wallet-ton'
import { loadWdkConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadWdkConfig()

  logSection('Error Handling')

  const wdk = new WDK(config.seedPhrase)
    .registerWallet('solana', WalletManagerSolana, config.wallets.solana)
    .registerWallet('ton', WalletManagerTon, config.wallets.ton)

  try {
    await wdk.getAccount('tron', 0)
  } catch (error) {
    logResult('Missing Registration', {
      message: error instanceof Error ? error.message : String(error),
    })
  }

  wdk.dispose(['solana'])
  logResult('Disposed Wallets', { blockchains: 'solana' })

  try {
    await wdk.getAccount('solana', 0)
  } catch (error) {
    logResult('After Disposal', {
      message: error instanceof Error ? error.message : String(error),
    })
  }

  const tonAccount = await wdk.getAccount('ton', 0)
  logResult('TON Still Registered', { address: await tonAccount.getAddress() })

  wdk.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
