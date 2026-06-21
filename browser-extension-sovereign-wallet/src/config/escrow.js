/**
 * Multi-chain OTC escrow (USDT + any token) — EVM networks aligned with Sovereign Wallet
 */
import { EVM_CHAINS } from './chains.js';
import {
  ESCROW_COMING_SOON_DEFAULT,
  listEvmChainKeys,
} from './evm-escrow-meta.js';
import dualFactoryAbi from './abis/DualAssetEscrowFactory.json';
import dualDealAbi from './abis/DualAssetDealEscrow.json';
import registryAbi from './abis/EscrowRegistry.json';

const ZERO = '0x0000000000000000000000000000000000000000';

export const EVM_CHAIN_IDS = {
  ethereum: 1,
  polygon: 137,
  arbitrum: 42161,
  bsc: 56,
};

export const ESCROW_COMING_SOON = ESCROW_COMING_SOON_DEFAULT;

let evmChainListOverride = null;
let comingSoonOverride = [...ESCROW_COMING_SOON_DEFAULT];

let deployOverrides = {
  ethereum: { factory: ZERO, registry: ZERO },
  polygon: { factory: ZERO, registry: ZERO },
  arbitrum: { factory: ZERO, registry: ZERO },
  bsc: { factory: ZERO, registry: ZERO },
};

let defaultEscrowChain = 'bsc';
let protocolFeeBps = 50;
let protocolFeeRecipient = ZERO;

export const ESCROW_ABIS = {
  dualFactory: dualFactoryAbi,
  dualDeal: dualDealAbi,
  registry: registryAbi,
};

export const DUAL_DEAL_STATE = [
  'PendingAccept',
  'Open',
  'Settled',
  'Refunded',
  'Cancelled',
];

export function listEscrowEvmChains() {
  if (evmChainListOverride?.length) {
    return evmChainListOverride.filter((k) => k in EVM_CHAINS);
  }
  return listEvmChainKeys();
}

export function getEscrowComingSoon() {
  return [...comingSoonOverride];
}

export function getEvmEscrowDeployStatus() {
  const status = {};
  for (const key of listEscrowEvmChains()) {
    const cfg = getEscrowNetwork(key);
    status[key] = isEscrowDeployed(cfg);
  }
  return status;
}

export function applyEscrowJsonOverrides(json) {
  if (json.protocolFeeRecipient) protocolFeeRecipient = json.protocolFeeRecipient;
  if (json.protocolFeeBps != null) protocolFeeBps = Number(json.protocolFeeBps);
  if (json.defaultNetwork) defaultEscrowChain = json.defaultNetwork;
  if (Array.isArray(json.evmChains)) {
    evmChainListOverride = json.evmChains.filter((k) => typeof k === 'string');
  }
  if (Array.isArray(json.comingSoon)) {
    comingSoonOverride = json.comingSoon.filter((k) => typeof k === 'string');
  }
  if (json.networks) {
    for (const [key, val] of Object.entries(json.networks)) {
      if (!(key in EVM_CHAINS)) continue;
      deployOverrides[key] = { ...deployOverrides[key], ...val };
    }
  }
}

export function getProtocolFeeBps() {
  return protocolFeeBps;
}

export function getProtocolFeeRecipient() {
  return protocolFeeRecipient;
}

export function getDefaultEscrowChain() {
  return defaultEscrowChain;
}

export function getEscrowNetwork(chainKey = defaultEscrowChain) {
  const chain = EVM_CHAINS[chainKey];
  if (!chain) {
    throw new Error(`Escrow not configured for chain: ${chainKey}`);
  }
  const usdt = chain.tokens?.USDt;
  if (!usdt) {
    throw new Error(`USDt not configured on ${chainKey}`);
  }
  const ov = deployOverrides[chainKey] || {};
  const chainId = EVM_CHAIN_IDS[chainKey];
  return {
    networkKey: chainKey,
    chainKey,
    chainId,
    chainIdHex: `0x${chainId.toString(16)}`,
    name: chain.name,
    rpcUrl: chain.provider,
    explorer: chain.explorer,
    explorerTx: chain.explorerTx || `${chain.explorer}/tx/`,
    usdt: usdt.address,
    usdtDecimals: usdt.decimals,
    factory: ov.factory || ZERO,
    registry: ov.registry || ZERO,
  };
}

export function isEscrowDeployed(cfg) {
  return cfg.factory && cfg.factory.toLowerCase() !== ZERO.toLowerCase();
}

export const EIP712_DOMAIN_NAME = 'SovereignEscrow';
export const EIP712_VERSION = '1';
