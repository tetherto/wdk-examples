/**
 * EVM ERC-4337 Example: Sign Transaction (without broadcasting)
 *
 * Demonstrates: Building and signing a UserOperation with signTransaction()
 * without sending it to the bundler. This is useful when you want to inspect,
 * store, or relay the signed UserOperation yourself instead of letting the
 * wallet broadcast it.
 *
 * signTransaction() returns a fully-populated, signed UserOperationV7. It
 * accepts the same EvmErc4337Transaction shape as sendTransaction(), so the
 * gas-override fields work here too.
 *
 * No transaction is broadcast by this example -- signing is a local operation
 * (the wallet still quotes the fee, which contacts the bundler/RPC).
 *
 * Run: npx tsx wallet-evm-erc-4337/sign-transaction.ts
 */

import WalletManagerEvmErc4337, {
  type EvmErc4337Transaction,
} from '@tetherto/wdk-wallet-evm-erc-4337'
import { loadErc4337Config } from '../shared/config.js'
import { logSection, logResult, formatWei } from '../shared/helpers.js'

async function main() {
  const config = loadErc4337Config()

  logSection('Sign Transaction (ERC-4337 UserOperation)')

  const wallet = new WalletManagerEvmErc4337(config.seedPhrase, {
    chainId: config.chainId,
    provider: config.rpcUrl,
    bundlerUrl: config.bundlerUrl,
    safeModulesVersion: config.safeModulesVersion,
    useNativeCoins: true,
  })

  const account = await wallet.getAccount(0)
  const address = await account.getAddress()
  logResult('Smart Account (signer)', { address })

  const tx: EvmErc4337Transaction = {
    to: config.recipientAddress,
    value: 0n,
    data: '0x',
  }

  // Build and sign the UserOperation locally -- nothing is broadcast.
  const userOp = await account.signTransaction(tx)

  logResult('Signed UserOperation', {
    sender: userOp.sender,
    nonce: userOp.nonce,
    callGasLimit: userOp.callGasLimit,
    verificationGasLimit: userOp.verificationGasLimit,
    preVerificationGas: userOp.preVerificationGas,
    maxFeePerGas: formatWei(userOp.maxFeePerGas),
    maxPriorityFeePerGas: formatWei(userOp.maxPriorityFeePerGas),
  })

  // The signature is what makes this UserOperation ready to relay to a bundler.
  logResult('Signature', { signature: userOp.signature })

  console.log('\nThe signed UserOperation can now be inspected, stored, or relayed to a bundler.')

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
