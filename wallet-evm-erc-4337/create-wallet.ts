/**
 * EVM ERC-4337 Example: Create Wallet
 *
 * Demonstrates: Initializing WalletManagerEvmErc4337 with both
 * native coins mode and paymaster token mode.
 *
 * Run: npx tsx evm-4337/01-create-wallet.ts
 */

import WalletManagerEvmErc4337 from '@tetherto/wdk-wallet-evm-erc-4337'
import { loadErc4337Config } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadErc4337Config()

  logSection('Create ERC-4337 Wallet (Native Coins Mode)')

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
  logResult('Smart Account 0 (native mode)', { address })

  const readOnlyAccount = await account.toReadOnlyAccount()
  const roAddress = await readOnlyAccount.getAddress()
  logResult('Read-Only Account', { address: roAddress })

  wallet.dispose()

  // Paymaster token mode (only if paymaster config is available)
  if (config.paymasterUrl && config.paymasterAddress && config.paymasterTokenAddress) {
    logSection('Create ERC-4337 Wallet (Paymaster Token Mode)')

    const paymasterWallet = new WalletManagerEvmErc4337(config.seedPhrase, {
      chainId: config.chainId,
      provider: config.rpcUrl,
      bundlerUrl: config.bundlerUrl,
      entryPointAddress: config.entryPointAddress,
      safeModulesVersion: config.safeModulesVersion,
      paymasterUrl: config.paymasterUrl,
      paymasterAddress: config.paymasterAddress,
      paymasterToken: { address: config.paymasterTokenAddress },
    })

    const pmAccount = await paymasterWallet.getAccount(0)
    const pmAddress = await pmAccount.getAddress()
    logResult('Smart Account 0 (paymaster mode)', { address: pmAddress })

    paymasterWallet.dispose()
  } else {
    console.log('\nSkipping paymaster mode (paymaster config not set in .env)')
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
