/**
 * Solana Example: Send Transaction
 *
 * Demonstrates: Estimating native SOL transfer fees with quoteSendTransaction()
 * and optionally sending a transaction when ACTUALLY_SEND=true.
 *
 * Run: npx tsx wallet-solana/send-transaction.ts
 */

import WalletManagerSolana from '@tetherto/wdk-wallet-solana'
import { loadSolanaConfig, optionalEnv } from '../shared/config.js'
import { logSection, logResult, formatLamports } from '../shared/helpers.js'

async function main() {
  const config = loadSolanaConfig()
  const actuallySend = optionalEnv('ACTUALLY_SEND') === 'true'

  logSection('Send Transaction')

  const wallet = new WalletManagerSolana(config.seedPhrase, {
    rpcUrl: config.rpcUrl,
    commitment: config.commitment,
    transferMaxFee: config.transferMaxFee,
  })

  const account = await wallet.getAccount(0)
  logResult('Sender', { address: await account.getAddress() })

  const txParams = {
    to: config.recipientAddress,
    value: 1_000_000n, // 0.001 SOL
  }

  const quote = await account.quoteSendTransaction(txParams)
  logResult('Fee Estimate', { fee: formatLamports(quote.fee) })

  if (actuallySend) {
    console.log('\nSending real SOL transaction...')
    const result = await account.sendTransaction(txParams)
    logResult('Transaction Sent', {
      hash: result.hash,
      fee: formatLamports(result.fee),
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
