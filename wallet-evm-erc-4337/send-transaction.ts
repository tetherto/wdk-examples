/**
 * EVM ERC-4337 Example: Send Transaction
 *
 * Demonstrates: Estimating UserOperation fees with quoteSendTransaction()
 * and showing how per-call config overrides work (native vs sponsored).
 *
 * By default this only quotes the fee. Set ACTUALLY_SEND=true in .env
 * to send a real 0-value UserOperation (requires funded smart account).
 *
 * Run: npx tsx evm-4337/05-send-transaction.ts
 */

import WalletManagerEvmErc4337 from '@tetherto/wdk-wallet-evm-erc-4337'
import { loadErc4337Config, optionalEnv } from '../shared/config.js'
import { logSection, logResult, formatWei } from '../shared/helpers.js'

async function main() {
  const config = loadErc4337Config()
  const actuallySend = optionalEnv('ACTUALLY_SEND') === 'true'

  logSection('Send Transaction (ERC-4337 UserOperation)')

  const wallet = new WalletManagerEvmErc4337(config.seedPhrase, {
    chainId: config.chainId,
    provider: config.rpcUrl,
    bundlerUrl: config.bundlerUrl,
    entryPointAddress: config.entryPointAddress,
    safeModulesVersion: config.safeModulesVersion,
    useNativeCoins: true,
  })

  const account = await wallet.getAccount(0)
  const address = await account.getAddress()
  logResult('Smart Account (sender)', { address })

  const txParams = {
    to: config.recipientAddress,
    value: 0n,
    data: '0x' as const,
  }

  // Quote the UserOperation fee
  const quote = await account.quoteSendTransaction(txParams)
  logResult('UserOperation Fee Estimate', { fee: formatWei(quote.fee) })

  if (actuallySend) {
    console.log('\nSending real UserOperation...')
    const result = await account.sendTransaction(txParams)
    logResult('UserOperation Sent', {
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
