/**
 * EVM ERC-4337 Example: Sign & Verify Message
 *
 * Demonstrates: Signing a message with an ERC-4337 account's underlying
 * EOA key and verifying the signature. Works fully offline.
 *
 * Run: npx tsx evm-4337/07-sign-verify-message.ts
 */

import WalletManagerEvmErc4337 from '@tetherto/wdk-wallet-evm-erc-4337'
import { loadErc4337Config } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadErc4337Config()

  logSection('Sign & Verify Message (ERC-4337)')

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
  logResult('Smart Account', { address })

  const message = 'Hello, Account Abstraction!'
  const signature = await account.sign(message)
  logResult('Signed', { message, signature })

  const isValid = await account.verify(message, signature)
  logResult('Verification', { isValid })

  const isTamperedValid = await account.verify('Tampered message', signature)
  logResult('Tampered Verification', { isValid: isTamperedValid })

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
