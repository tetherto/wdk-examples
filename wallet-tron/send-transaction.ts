/**
 * TRON Example: Send Transaction
 *
 * Demonstrates: Estimating native TRX transfer fees with quoteSendTransaction()
 * and optionally sending a transaction when ACTUALLY_SEND=true.
 *
 * Run: npx tsx wallet-tron/send-transaction.ts
 */

import WalletManagerTron from '@tetherto/wdk-wallet-tron'
import { loadTronConfig, optionalEnv } from '../shared/config.js'
import { logSection, logResult, formatSun } from '../shared/helpers.js'

async function main() {
  const config = loadTronConfig()
  const actuallySend = optionalEnv('ACTUALLY_SEND') === 'true'

  logSection('Send Transaction')

  const wallet = new WalletManagerTron(config.seedPhrase, {
    provider: config.provider,
    transferMaxFee: config.transferMaxFee,
  })

  const account = await wallet.getAccount(0)
  logResult('Sender', { address: await account.getAddress() })

  const txParams = {
    to: config.recipientAddress,
    value: 1_000_000n, // 1 TRX
  }

  const quote = await account.quoteSendTransaction(txParams)
  logResult('Fee Estimate', { fee: formatSun(quote.fee) })

  if (actuallySend) {
    console.log('\nSending real TRX transaction...')
    const result = await account.sendTransaction(txParams)
    logResult('Transaction Sent', {
      hash: result.hash,
      fee: formatSun(result.fee),
    })
  } else {
    console.log('\nSkipping actual send (set ACTUALLY_SEND=true to send)')
  }

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
