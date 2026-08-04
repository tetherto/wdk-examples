import dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') })

export function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Copy .env.example to .env and fill in the values.`
    )
  }
  return value
}

export function optionalEnv(key: string): string | undefined {
  return process.env[key] || undefined
}

export function loadEvmConfig() {
  return {
    seedPhrase: requireEnv('SEED_PHRASE'),
    rpcUrl: requireEnv('EVM_RPC_URL'),
    tokenContract: requireEnv('EVM_TOKEN_CONTRACT'),
    recipientAddress: requireEnv('EVM_RECIPIENT_ADDRESS'),
  }
}

const ERC4337_DEFAULTS = {
  chainId: 11155111, // Sepolia
  safeModulesVersion: '0.3.0',
} as const

export function loadErc4337Config() {
  return {
    seedPhrase: requireEnv('SEED_PHRASE'),
    chainId: ERC4337_DEFAULTS.chainId,
    rpcUrl: requireEnv('ERC4337_RPC_URL'),
    bundlerUrl: requireEnv('ERC4337_BUNDLER_URL'),
    safeModulesVersion: ERC4337_DEFAULTS.safeModulesVersion,
    paymasterUrl: optionalEnv('ERC4337_PAYMASTER_URL'),
    paymasterAddress: optionalEnv('ERC4337_PAYMASTER_ADDRESS'),
    paymasterTokenAddress: optionalEnv('ERC4337_PAYMASTER_TOKEN_ADDRESS'),
    recipientAddress: requireEnv('ERC4337_RECIPIENT_ADDRESS'),
    tokenContract: requireEnv('ERC4337_TOKEN_CONTRACT'),
  }
}

export function loadSolanaConfig() {
  return {
    seedPhrase: requireEnv('SEED_PHRASE'),
    rpcUrl: requireEnv('SOLANA_RPC_URL'),
    commitment: 'confirmed' as const,
    transferMaxFee: 10_000_000n,
    recipientAddress: requireEnv('SOLANA_RECIPIENT_ADDRESS'),
    tokenMint: requireEnv('SOLANA_TOKEN_MINT'),
  }
}

export function loadTonConfig() {
  return {
    seedPhrase: requireEnv('SEED_PHRASE'),
    tonClient: {
      url: requireEnv('TON_TONCENTER_URL'),
      secretKey: optionalEnv('TON_TONCENTER_API_KEY'),
    },
    transferMaxFee: 1_000_000_000n,
    recipientAddress: requireEnv('TON_RECIPIENT_ADDRESS'),
    jettonAddress: requireEnv('TON_JETTON_ADDRESS'),
    readOnlyPublicKey: requireEnv('TON_READONLY_PUBLIC_KEY'),
  }
}

export function loadTronConfig() {
  return {
    seedPhrase: requireEnv('SEED_PHRASE'),
    provider: requireEnv('TRON_PROVIDER_URL'),
    transferMaxFee: 10_000_000n,
    recipientAddress: requireEnv('TRON_RECIPIENT_ADDRESS'),
    tokenContract: requireEnv('TRON_TRC20_CONTRACT'),
  }
}

export function loadWalletConnectConfig() {
  return {
    seedPhrase: requireEnv('SEED_PHRASE'),
    projectId: requireEnv('WALLETCONNECT_PROJECT_ID'),
    sepoliaRpcUrl: requireEnv('WALLETCONNECT_SEPOLIA_RPC_URL'),
    solanaDevnetRpcUrl: requireEnv('WALLETCONNECT_SOLANA_DEVNET_RPC_URL'),
  }
}

export function loadWdkConfig() {
  const solana = loadSolanaConfig()
  const ton = loadTonConfig()
  const tron = loadTronConfig()

  return {
    seedPhrase: requireEnv('SEED_PHRASE'),
    wallets: {
      solana: {
        rpcUrl: solana.rpcUrl,
        commitment: solana.commitment,
        transferMaxFee: solana.transferMaxFee,
      },
      ton: {
        tonClient: ton.tonClient,
        transferMaxFee: ton.transferMaxFee,
      },
      tron: {
        provider: tron.provider,
        transferMaxFee: tron.transferMaxFee,
      },
    },
    solana,
    ton,
    tron,
  }
}
