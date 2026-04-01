import 'dotenv/config'

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
  entryPointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  safeModulesVersion: '0.3.0',
} as const

export function loadErc4337Config() {
  return {
    seedPhrase: requireEnv('SEED_PHRASE'),
    chainId: ERC4337_DEFAULTS.chainId,
    rpcUrl: requireEnv('ERC4337_RPC_URL'),
    bundlerUrl: requireEnv('ERC4337_BUNDLER_URL'),
    entryPointAddress: ERC4337_DEFAULTS.entryPointAddress,
    safeModulesVersion: ERC4337_DEFAULTS.safeModulesVersion,
    paymasterUrl: optionalEnv('ERC4337_PAYMASTER_URL'),
    paymasterAddress: optionalEnv('ERC4337_PAYMASTER_ADDRESS'),
    paymasterTokenAddress: optionalEnv('ERC4337_PAYMASTER_TOKEN_ADDRESS'),
    recipientAddress: requireEnv('ERC4337_RECIPIENT_ADDRESS'),
    tokenContract: requireEnv('ERC4337_TOKEN_CONTRACT'),
  }
}
