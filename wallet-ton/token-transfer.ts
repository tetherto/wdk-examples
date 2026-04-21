/**
 * TON Example: Token Transfer
 *
 * Demonstrates: Estimating Jetton transfer fees with quoteTransfer()
 * and optionally sending a transfer when ACTUALLY_SEND=true.
 *
 * Run: npx tsx wallet-ton/token-transfer.ts
 */

import WalletManagerTon from '@tetherto/wdk-wallet-ton'
import { loadTonConfig, optionalEnv } from '../shared/config.js'
import { logSection, logResult, formatNanotons } from '../shared/helpers.js'

async function main() {
  const config = loadTonConfig()
  const actuallySend = optionalEnv('ACTUALLY_SEND') === 'true'

  logSection('Token Transfer')

  const wallet = new WalletManagerTon(config.seedPhrase, {
    tonClient: config.tonClient,
    transferMaxFee: config.transferMaxFee,
  })

  const account = await wallet.getAccount(0)
  logResult('Sender', { address: await account.getAddress() })

  const transferParams = {
    token: config.jettonAddress,
    recipient: config.recipientAddress,
    amount: 1_000_000n,
  }

  const quote = await account.quoteTransfer(transferParams)
  logResult('Transfer Fee Estimate', { fee: formatNanotons(quote.fee) })

  if (actuallySend) {
    console.log('\nSending real Jetton transfer...')
    const result = await account.transfer(transferParams)
    logResult('Transfer Sent', {
      hash: result.hash,
      fee: formatNanotons(result.fee),
    })
  } else {
    console.log('\nSkipping actual transfer (set ACTUALLY_SEND=true to send)')
  }

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
