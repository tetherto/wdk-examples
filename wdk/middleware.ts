/**
 * WDK Core Example: Middleware
 *
 * Demonstrates: Registering middleware to inspect accounts whenever
 * they are derived through WDK.
 *
 * Run: npx tsx wdk/middleware.ts
 */

import WDK from '@tetherto/wdk'
import WalletManagerSolana from '@tetherto/wdk-wallet-solana'
import WalletManagerTon from '@tetherto/wdk-wallet-ton'
import WalletManagerTron from '@tetherto/wdk-wallet-tron'
import { loadWdkConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadWdkConfig()

  logSection('Middleware')

  const seenAddresses: string[] = []

  const wdk = new WDK(config.seedPhrase)
    .registerWallet('solana', WalletManagerSolana, config.wallets.solana)
    .registerWallet('ton', WalletManagerTon, config.wallets.ton)
    .registerWallet('tron', WalletManagerTron, config.wallets.tron)
    .registerMiddleware('solana', async (account) => {
      seenAddresses.push(await account.getAddress())
    })

  await wdk.getAccount('solana', 0)
  await wdk.getAccount('solana', 1)

  logResult('Middleware Invocations', {
    count: seenAddresses.length,
    first: seenAddresses[0],
    second: seenAddresses[1],
  })

  wdk.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
