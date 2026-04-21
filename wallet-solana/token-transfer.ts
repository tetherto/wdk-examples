/**
 * Solana Example: Token Transfer
 *
 * Demonstrates: Estimating SPL token transfer fees with quoteTransfer()
 * and optionally sending a transfer when ACTUALLY_SEND=true.
 *
 * Run: npx tsx wallet-solana/token-transfer.ts
 */

import WalletManagerSolana from '@tetherto/wdk-wallet-solana'
import { loadSolanaConfig, optionalEnv } from '../shared/config.js'
import { logSection, logResult, formatLamports } from '../shared/helpers.js'

async function main() {
  const config = loadSolanaConfig()
  const actuallySend = optionalEnv('ACTUALLY_SEND') === 'true'

  logSection('Token Transfer')

  const wallet = new WalletManagerSolana(config.seedPhrase, {
    rpcUrl: config.rpcUrl,
    commitment: config.commitment,
    transferMaxFee: config.transferMaxFee,
  })

  const account = await wallet.getAccount(0)
  logResult('Sender', { address: await account.getAddress() })

  const transferParams = {
    token: config.tokenMint,
    recipient: config.recipientAddress,
    amount: 1_000_000n,
  }

  const quote = await account.quoteTransfer(transferParams)
  logResult('Transfer Fee Estimate', { fee: formatLamports(quote.fee) })

  if (actuallySend) {
    console.log('\nSending real SPL token transfer...')
    const result = await account.transfer(transferParams)
    logResult('Transfer Sent', {
      hash: result.hash,
      fee: formatLamports(result.fee),
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
