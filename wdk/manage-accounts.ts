/**
 * WDK Core Example: Manage Accounts
 *
 * Demonstrates: Retrieving accounts by index and path, then checking
 * multi-chain balances through the unified WDK interface.
 *
 * Run: npx tsx wdk/manage-accounts.ts
 */

import WDK from '@tetherto/wdk'
import WalletManagerSolana from '@tetherto/wdk-wallet-solana'
import WalletManagerTon from '@tetherto/wdk-wallet-ton'
import WalletManagerTron from '@tetherto/wdk-wallet-tron'
import { loadWdkConfig } from '../shared/config.js'
import { formatLamports, formatNanotons, formatSun, logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadWdkConfig()

  logSection('Manage Accounts')

  const wdk = new WDK(config.seedPhrase)
    .registerWallet('solana', WalletManagerSolana, config.wallets.solana)
    .registerWallet('ton', WalletManagerTon, config.wallets.ton)
    .registerWallet('tron', WalletManagerTron, config.wallets.tron)

  const solanaAccount = await wdk.getAccount('solana', 0)
  logResult('Solana Account 0', { address: await solanaAccount.getAddress() })

  const tonAccount = await wdk.getAccountByPath('ton', "0'/0/5")
  logResult('TON Custom Path', { address: await tonAccount.getAddress() })

  const tronAccount = await wdk.getAccountByPath('tron', "0'/0/5")
  logResult('TRON Custom Path', { address: await tronAccount.getAddress() })

  const balances = {
    solana: formatLamports(await (await wdk.getAccount('solana', 0)).getBalance()),
    ton: formatNanotons(await (await wdk.getAccount('ton', 0)).getBalance()),
    tron: formatSun(await (await wdk.getAccount('tron', 0)).getBalance()),
  }
  logResult('Multi-Chain Balances', balances)

  wdk.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
