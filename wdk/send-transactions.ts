/**
 * WDK Core Example: Send Transactions
 *
 * Demonstrates: Quoting native transactions across multiple chains and
 * optionally sending them when ACTUALLY_SEND=true.
 *
 * Run: npx tsx wdk/send-transactions.ts
 */

import WDK from '@tetherto/wdk'
import WalletManagerSolana from '@tetherto/wdk-wallet-solana'
import WalletManagerTon from '@tetherto/wdk-wallet-ton'
import WalletManagerTron from '@tetherto/wdk-wallet-tron'
import { loadWdkConfig, optionalEnv } from '../shared/config.js'
import { formatLamports, formatNanotons, formatSun, logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadWdkConfig()
  const actuallySend = optionalEnv('ACTUALLY_SEND') === 'true'

  logSection('Unified Send Flow')

  const wdk = new WDK(config.seedPhrase)
    .registerWallet('solana', WalletManagerSolana, config.wallets.solana)
    .registerWallet('ton', WalletManagerTon, config.wallets.ton)
    .registerWallet('tron', WalletManagerTron, config.wallets.tron)

  const requests = [
    {
      blockchain: 'solana',
      params: { to: config.solana.recipientAddress, value: 1_000_000n },
      formatFee: formatLamports,
    },
    {
      blockchain: 'ton',
      params: { to: config.ton.recipientAddress, value: 1_000_000n },
      formatFee: formatNanotons,
    },
    {
      blockchain: 'tron',
      params: { to: config.tron.recipientAddress, value: 1_000_000n },
      formatFee: formatSun,
    },
  ] as const

  for (const request of requests) {
    const account = await wdk.getAccount(request.blockchain, 0)
    const quote = await account.quoteSendTransaction(request.params)
    logResult(`${request.blockchain} quote`, { fee: request.formatFee(quote.fee) })

    if (actuallySend) {
      const result = await account.sendTransaction(request.params)
      logResult(`${request.blockchain} sent`, {
        hash: result.hash,
        fee: request.formatFee(result.fee),
      })
    }
  }

  if (!actuallySend) {
    console.log('\nSkipping actual sends (set ACTUALLY_SEND=true to send)')
  }

  wdk.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
