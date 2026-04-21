/**
 * TRON Example: Token Transfer
 *
 * Demonstrates: Estimating TRC20 transfer fees with quoteTransfer()
 * and optionally sending a transfer when ACTUALLY_SEND=true.
 *
 * Run: npx tsx wallet-tron/token-transfer.ts
 */

import WalletManagerTron from '@tetherto/wdk-wallet-tron'
import { loadTronConfig, optionalEnv } from '../shared/config.js'
import { logSection, logResult, formatSun } from '../shared/helpers.js'

async function main() {
  const config = loadTronConfig()
  const actuallySend = optionalEnv('ACTUALLY_SEND') === 'true'

  logSection('Token Transfer')

  const wallet = new WalletManagerTron(config.seedPhrase, {
    provider: config.provider,
    transferMaxFee: config.transferMaxFee,
  })

  const account = await wallet.getAccount(0)
  logResult('Sender', { address: await account.getAddress() })

  const transferParams = {
    token: config.tokenContract,
    recipient: config.recipientAddress,
    amount: 1_000_000n,
  }

  const quote = await account.quoteTransfer(transferParams)
  logResult('Transfer Fee Estimate', { fee: formatSun(quote.fee) })

  if (actuallySend) {
    console.log('\nSending real TRC20 transfer...')
    const result = await account.transfer(transferParams)
    logResult('Transfer Sent', {
      hash: result.hash,
      fee: formatSun(result.fee),
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
