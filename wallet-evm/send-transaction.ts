/**
 * EVM Example: Send Transaction
 *
 * Demonstrates: Estimating fees with quoteSendTransaction() and the
 * structure of EIP-1559 and legacy transactions.
 *
 * By default this only quotes (estimates) the fee. Set ACTUALLY_SEND=true
 * in your .env to send a real 0-value transaction (requires funded wallet).
 *
 * Run: npx tsx evm/05-send-transaction.ts
 */

import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import { loadEvmConfig, optionalEnv } from '../shared/config.js'
import { logSection, logResult, formatWei } from '../shared/helpers.js'

async function main() {
  const config = loadEvmConfig()
  const actuallySend = optionalEnv('ACTUALLY_SEND') === 'true'

  logSection('Send Transaction')

  const wallet = new WalletManagerEvm(config.seedPhrase, {
    provider: config.rpcUrl,
    transferMaxFee: 100000000000000,
  })

  const account = await wallet.getAccount(0)
  const address = await account.getAddress()
  logResult('Sender', { address })

  // Quote a transaction fee (safe, no funds needed)
  const quote = await account.quoteSendTransaction({
    to: config.recipientAddress,
    value: 0n,
  })
  logResult('Fee Estimate (0-value tx)', { fee: formatWei(quote.fee) })

  if (actuallySend) {
    console.log('\nSending real 0-value transaction...')
    const result = await account.sendTransaction({
      to: config.recipientAddress,
      value: 0n,
    })
    logResult('Transaction Sent', {
      hash: result.hash,
      fee: formatWei(result.fee),
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
