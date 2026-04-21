/**
 * WDK Core Example: Register Wallets
 *
 * Demonstrates: Registering Solana, TON, and TRON wallet managers
 * inside one WDK instance.
 *
 * Run: npx tsx wdk/register-wallets.ts
 */

import WDK from '@tetherto/wdk'
import WalletManagerSolana from '@tetherto/wdk-wallet-solana'
import WalletManagerTon from '@tetherto/wdk-wallet-ton'
import WalletManagerTron from '@tetherto/wdk-wallet-tron'
import { loadWdkConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadWdkConfig()

  logSection('Register Wallet Managers')

  const wdk = new WDK(config.seedPhrase)
    .registerWallet('solana', WalletManagerSolana, config.wallets.solana)
    .registerWallet('ton', WalletManagerTon, config.wallets.ton)
    .registerWallet('tron', WalletManagerTron, config.wallets.tron)

  const solanaAccount = await wdk.getAccount('solana', 0)
  logResult('Solana Wallet', { address: await solanaAccount.getAddress() })

  const tonAccount = await wdk.getAccount('ton', 0)
  logResult('TON Wallet', { address: await tonAccount.getAddress() })

  const tronAccount = await wdk.getAccount('tron', 0)
  logResult('TRON Wallet', { address: await tronAccount.getAddress() })

  wdk.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
