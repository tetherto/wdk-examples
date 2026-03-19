/**
 * EVM Example: Token Transfer
 *
 * Demonstrates: Estimating ERC-20 transfer fees with quoteTransfer()
 * and the structure of a token transfer call.
 *
 * By default this only quotes the fee. Set ACTUALLY_SEND=true in .env
 * to execute a real transfer (requires funded wallet + token balance).
 *
 * Run: npx tsx evm/06-token-transfer.ts
 */

import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import { loadEvmConfig, optionalEnv } from '../shared/config.js'
import { logSection, logResult, formatWei } from '../shared/helpers.js'

async function main() {
  const config = loadEvmConfig()
  const actuallySend = optionalEnv('ACTUALLY_SEND') === 'true'

  logSection('Token Transfer')

  const wallet = new WalletManagerEvm(config.seedPhrase, {
    provider: config.rpcUrl,
    transferMaxFee: 100000000000000,
  })

  const account = await wallet.getAccount(0)
  const address = await account.getAddress()
  logResult('Sender', { address })

  const transferParams = {
    token: config.tokenContract,
    recipient: config.recipientAddress,
    amount: 1000000n, // 1 token unit (adjust decimals for your token)
  }

  // Quote the transfer fee (safe, no funds needed)
  const quote = await account.quoteTransfer(transferParams)
  logResult('Transfer Fee Estimate', { fee: formatWei(quote.fee) })

  if (actuallySend) {
    console.log('\nSending real token transfer...')
    const result = await account.transfer(transferParams)
    logResult('Transfer Sent', {
      hash: result.hash,
      fee: formatWei(result.fee),
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
