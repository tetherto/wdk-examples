/**
 * TON Example: Send Transaction
 *
 * Demonstrates: Estimating native TON transfer fees with quoteSendTransaction()
 * and optionally sending a transaction when ACTUALLY_SEND=true.
 *
 * Run: npx tsx wallet-ton/send-transaction.ts
 */

import WalletManagerTon from '@tetherto/wdk-wallet-ton'
import { loadTonConfig, optionalEnv } from '../shared/config.js'
import { logSection, logResult, formatNanotons } from '../shared/helpers.js'

async function main() {
  const config = loadTonConfig()
  const actuallySend = optionalEnv('ACTUALLY_SEND') === 'true'

  logSection('Send Transaction')

  const wallet = new WalletManagerTon(config.seedPhrase, {
    tonClient: config.tonClient,
    transferMaxFee: config.transferMaxFee,
  })

  const account = await wallet.getAccount(0)
  logResult('Sender', { address: await account.getAddress() })

  const txParams = {
    to: config.recipientAddress,
    value: 1_000_000n, // 0.001 TON
  }

  const quote = await account.quoteSendTransaction(txParams)
  logResult('Fee Estimate', { fee: formatNanotons(quote.fee) })

  if (actuallySend) {
    console.log('\nSending real TON transaction...')
    const result = await account.sendTransaction(txParams)
    logResult('Transaction Sent', {
      hash: result.hash,
      fee: formatNanotons(result.fee),
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
