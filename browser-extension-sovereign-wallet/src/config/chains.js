/**
 * Chain configuration: RPC providers, WDK blockchain keys, and mainnet token contracts.
 */

export const EVM_CHAINS = {
  ethereum: {
    id: 'ethereum',
    wdkKey: 'ethereum',
    name: 'Ethereum',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    provider: 'https://eth.drpc.org',
    explorer: 'https://etherscan.io',
    explorerTx: 'https://etherscan.io/tx/',
    tokens: {
      USDt: { symbol: 'USDt', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
      XAUt: { symbol: 'XAUt', address: '0x68749665FF8Dee9Cd2eB2B8ae0F6A5b93D0e5C3', decimals: 6 },
    },
  },
  polygon: {
    id: 'polygon',
    wdkKey: 'polygon',
    name: 'Polygon',
    nativeSymbol: 'MATIC',
    nativeDecimals: 18,
    provider: 'https://polygon.drpc.org',
    explorer: 'https://polygonscan.com',
    explorerTx: 'https://polygonscan.com/tx/',
    tokens: {
      USDt: { symbol: 'USDt', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
    },
  },
  arbitrum: {
    id: 'arbitrum',
    wdkKey: 'arbitrum',
    name: 'Arbitrum',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    provider: 'https://arbitrum.drpc.org',
    explorer: 'https://arbiscan.io',
    explorerTx: 'https://arbiscan.io/tx/',
    tokens: {
      USDt: { symbol: 'USDt', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
    },
  },
  bsc: {
    id: 'bsc',
    wdkKey: 'bsc',
    name: 'BNB Smart Chain',
    nativeSymbol: 'BNB',
    nativeDecimals: 18,
    provider: 'https://bsc.drpc.org',
    explorer: 'https://bscscan.com',
    explorerTx: 'https://bscscan.com/tx/',
    tokens: {
      USDt: {
        symbol: 'USDt',
        address: '0x55d398326f99059fF775485246999027B3197955',
        decimals: 18,
      },
    },
  },
};

export const BITCOIN_CHAIN = {
  id: 'bitcoin',
  wdkKey: 'bitcoin',
  name: 'Bitcoin',
  nativeSymbol: 'BTC',
  nativeDecimals: 8,
  network: 'bitcoin',
  explorer: 'https://mempool.space',
};

export const SOLANA_CHAIN = {
  id: 'solana',
  wdkKey: 'solana',
  name: 'Solana',
  nativeSymbol: 'SOL',
  nativeDecimals: 9,
  rpcUrls: [
    'https://api.mainnet-beta.solana.com',
    'https://solana-rpc.publicnode.com',
  ],
  explorer: 'https://solana.fm',
};

export const ALL_CHAIN_IDS = [
  ...Object.keys(EVM_CHAINS),
  BITCOIN_CHAIN.id,
  SOLANA_CHAIN.id,
];

export function getChainConfig(chainId) {
  if (EVM_CHAINS[chainId]) return EVM_CHAINS[chainId];
  if (chainId === BITCOIN_CHAIN.id) return BITCOIN_CHAIN;
  if (chainId === SOLANA_CHAIN.id) return SOLANA_CHAIN;
  return null;
}

export function isEvmChain(chainId) {
  return chainId in EVM_CHAINS;
}
