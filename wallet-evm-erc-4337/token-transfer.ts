/**
 * EVM ERC-4337 Example: Token Transfer
 *
 * Demonstrates: Estimating ERC-20 transfer fees via UserOperation and
 * showing per-call config overrides (e.g., switching to native coins gas).
 *
 * By default this only quotes the fee. Set ACTUALLY_SEND=true in .env
 * to execute a real transfer (requires funded smart account + token balance).
 *
 * Run: npx tsx evm-4337/06-token-transfer.ts
 */

import WalletManagerEvmErc4337 from '@tetherto/wdk-wallet-evm-erc-4337'
import { loadErc4337Config, optionalEnv } from '../shared/config.js'
import { logSection, logResult, formatWei } from '../shared/helpers.js'

async function main() {
  const config = loadErc4337Config()
  const actuallySend = optionalEnv('ACTUALLY_SEND') === 'true'

  logSection('Token Transfer (ERC-4337 UserOperation)')

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

  const transferParams = {
    token: config.tokenContract,
    recipient: config.recipientAddress,
    amount: 1000000n,
  }

  // Quote the transfer fee
  const quote = await account.quoteTransfer(transferParams)
  logResult('Transfer Fee Estimate', { fee: formatWei(quote.fee) })

  // You can also override the gas mode per-call:
  // const quoteNative = await account.quoteTransfer(transferParams, { useNativeCoins: true })

  if (actuallySend) {
    console.log('\nSending real token transfer via UserOperation...')
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
