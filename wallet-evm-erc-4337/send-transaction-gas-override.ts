/**
 * EVM ERC-4337 Example: Send Transaction with Gas Overrides
 *
 * Demonstrates: Overriding the gas fields of a UserOperation per-call via the
 * EvmErc4337Transaction shape. By default the wallet fetches gas limits from
 * AbstractionKit's estimation and the fee pair from the bundler; setting any of
 * these fields takes control back from those fallbacks.
 *
 * Rather than hardcoding magic numbers, this example reads the SDK's own
 * estimate first (via signTransaction, which builds a UserOp locally without
 * broadcasting), bumps every gas field by BUMP_PERCENT, and submits the bumped
 * values as explicit overrides. Because all five fields are provided, the SDK
 * skips estimation and submits exactly these values -- so the UserOp shown on a
 * UserOp explorer (e.g. Jiffyscan) will match the bumped numbers printed below.
 *
 * Override fields (all optional, accept number | bigint):
 *   - callGasLimit, verificationGasLimit, preVerificationGas
 *   - maxFeePerGas, maxPriorityFeePerGas (treated as a pair: setting either one
 *     disables the bundler-fetched fee fallback for both)
 *
 * In a batched call ([tx1, tx2, ...]) only tx1's gas overrides are honored --
 * a UserOperation carries a single set of gas fields regardless of batch size.
 *
 * By default this only quotes the fee. Set ACTUALLY_SEND=true in .env to send a
 * real 0-value UserOperation. The smart account (printed below) must hold enough
 * Sepolia ETH to repay the bundler -- in native-coins mode the account pays its
 * own gas, so fund the smart account address, not the owner EOA.
 *
 * Run: npx tsx wallet-evm-erc-4337/send-transaction-gas-override.ts
 */

import WalletManagerEvmErc4337, {
  type EvmErc4337Transaction,
} from '@tetherto/wdk-wallet-evm-erc-4337'
import { loadErc4337Config, optionalEnv } from '../shared/config.js'
import { logSection, logResult, formatWei } from '../shared/helpers.js'

// How much to bump every estimated gas field by, as a percentage.
const BUMP_PERCENT = 25n

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Bumps a value up by `percent` (integer percentage), staying in bigint math.
function bump(value: bigint, percent: bigint): bigint {
  return (value * (100n + percent)) / 100n
}

async function main() {
  const config = loadErc4337Config()
  const actuallySend = optionalEnv('ACTUALLY_SEND') === 'true'

  logSection('Send Transaction with Gas Overrides (ERC-4337 UserOperation)')

  const wallet = new WalletManagerEvmErc4337(config.seedPhrase, {
    chainId: config.chainId,
    provider: config.rpcUrl,
    bundlerUrl: config.bundlerUrl,
    safeModulesVersion: config.safeModulesVersion,
    useNativeCoins: true,
  })

  const account = await wallet.getAccount(0)
  const address = await account.getAddress()
  logResult('Smart Account (sender, fund this address)', { address })

  const baseTx: EvmErc4337Transaction = {
    to: config.recipientAddress,
    value: 0n,
    data: '0x',
  }

  // 1) Read the SDK's own estimate by building & signing a UserOp with no
  //    overrides. The first UserOp from a fresh account also deploys the Safe,
  //    so the estimated verificationGasLimit is large -- bumping the estimate
  //    (rather than guessing a fixed number) keeps the override valid to send.
  const estimated = await account.signTransaction(baseTx)
  logResult('Estimated gas (no overrides)', {
    callGasLimit: estimated.callGasLimit,
    verificationGasLimit: estimated.verificationGasLimit,
    preVerificationGas: estimated.preVerificationGas,
    maxFeePerGas: formatWei(estimated.maxFeePerGas),
    maxPriorityFeePerGas: formatWei(estimated.maxPriorityFeePerGas),
  })

  // 2) Bump every gas field by BUMP_PERCENT and feed them back as explicit
  //    overrides on the same call.
  const overrideTx: EvmErc4337Transaction = {
    ...baseTx,
    callGasLimit: bump(estimated.callGasLimit, BUMP_PERCENT),
    verificationGasLimit: bump(estimated.verificationGasLimit, BUMP_PERCENT),
    preVerificationGas: bump(estimated.preVerificationGas, BUMP_PERCENT),
    maxFeePerGas: bump(estimated.maxFeePerGas, BUMP_PERCENT),
    maxPriorityFeePerGas: bump(estimated.maxPriorityFeePerGas, BUMP_PERCENT),
  }
  logResult(`Override gas (estimate + ${BUMP_PERCENT}%)`, {
    callGasLimit: overrideTx.callGasLimit,
    verificationGasLimit: overrideTx.verificationGasLimit,
    preVerificationGas: overrideTx.preVerificationGas,
    maxFeePerGas: formatWei(overrideTx.maxFeePerGas as bigint),
    maxPriorityFeePerGas: formatWei(overrideTx.maxPriorityFeePerGas as bigint),
  })

  // The fee a quote reports is derived from the (bumped) gas fields above.
  const quote = await account.quoteSendTransaction(overrideTx)
  logResult('Fee Estimate (with overrides)', { fee: formatWei(quote.fee) })

  if (!actuallySend) {
    console.log('\nSkipping actual send (set ACTUALLY_SEND=true to send)')
    wallet.dispose()
    console.log('\nDone.')
    return
  }

  console.log('\nSending real UserOperation with gas overrides...')
  const result = await account.sendTransaction(overrideTx)

  // Jiffyscan shows the exact gas fields the bundler received -- compare them
  // against the "Override gas" values printed above to confirm the bump took.
  const explorerUrl = `https://jiffyscan.xyz/userOpHash/${result.hash}?network=sepolia`
  logResult('UserOperation Sent', {
    hash: result.hash,
    fee: formatWei(result.fee),
    explorer: explorerUrl,
  })

  console.log('\nWaiting for the UserOperation to be included on-chain...')
  let receipt = null
  for (let i = 0; i < 12 && !receipt; i++) {
    await sleep(5_000)
    receipt = await account.getUserOperationReceipt(result.hash)
  }

  if (receipt) {
    logResult('On-Chain Receipt', {
      success: receipt.success,
      actualGasCost: formatWei(receipt.actualGasCost),
      actualGasUsed: receipt.actualGasUsed,
    })
  } else {
    console.log('Receipt not available yet -- check the explorer link above.')
  }

  console.log(`\nOpen the explorer link to confirm the bumped gas fields are reflected on-chain:\n  ${explorerUrl}`)

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
