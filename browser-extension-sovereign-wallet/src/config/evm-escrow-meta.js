/**
 * Shared EVM escrow metadata — keep in sync with chains.js USDt entries.
 */
import { EVM_CHAINS } from './chains.js';

/** Non-EVM chains shown as "coming soon" in escrow (wallet may still support them). */
export const ESCROW_COMING_SOON_DEFAULT = ['bitcoin', 'solana'];

export const ESCROW_COMING_SOON_LABELS = {
  bitcoin: 'Bitcoin',
  solana: 'Solana',
};

/** Stable list for escrow network dropdown (not a function). */
export const EVM_CHAIN_KEYS = Object.freeze(Object.keys(EVM_CHAINS));

export function listEvmChainKeys() {
  return [...EVM_CHAIN_KEYS];
}

export function chainLabel(chainKey) {
  return EVM_CHAINS[chainKey]?.name || chainKey;
}

export function nativeGasSymbol(chainKey) {
  return EVM_CHAINS[chainKey]?.nativeSymbol || 'native';
}

export function explorerForChain(chainKey) {
  return EVM_CHAINS[chainKey]?.explorer || 'https://etherscan.io';
}

export function usdtForChain(chainKey) {
  const t = EVM_CHAINS[chainKey]?.tokens?.USDt;
  if (!t) return null;
  return { address: t.address, decimals: t.decimals };
}

export function formatComingSoonLabels(keys) {
  return (keys || [])
    .map((k) => ESCROW_COMING_SOON_LABELS[k] || k)
    .join(', ');
}
