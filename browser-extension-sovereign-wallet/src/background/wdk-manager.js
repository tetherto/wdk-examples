/**
 * WDK instance lifecycle: register chains, derive accounts, balances, transfers.
 */

import WDK from '@tetherto/wdk';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import WalletManagerBtc from '@tetherto/wdk-wallet-btc';
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';
import { formatUnits, parseUnits } from 'ethers';
import {
  EVM_CHAINS,
  BITCOIN_CHAIN,
  SOLANA_CHAIN,
  isEvmChain,
  getChainConfig,
} from '../config/chains.js';

let wdkInstance = null;
let wdkMnemonic = null;

/** @param {unknown} value */
export function normalizeAddress(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object' && value !== null) {
    if (typeof value.address === 'string') return value.address.trim();
  }
  return String(value).trim();
}

export function disposeWdk() {
  if (wdkInstance) {
    try {
      wdkInstance.dispose();
    } catch {
      /* ignore */
    }
  }
  wdkInstance = null;
  wdkMnemonic = null;
}

export function getWdk() {
  if (!wdkInstance) {
    throw new Error('Wallet is locked.');
  }
  return wdkInstance;
}

export function initWdk(mnemonic) {
  disposeWdk();
  wdkMnemonic = mnemonic;

  let wdk = new WDK(mnemonic);

  for (const cfg of Object.values(EVM_CHAINS)) {
    wdk = wdk.registerWallet(cfg.wdkKey, WalletManagerEvm, {
      provider: cfg.provider,
    });
  }

  wdk = wdk.registerWallet(BITCOIN_CHAIN.wdkKey, WalletManagerBtc, {
    network: BITCOIN_CHAIN.network,
    bip: 84,
    client: {
      type: 'blockbook-http',
      clientConfig: { url: 'https://btc1.trezor.io' },
    },
  });

  wdk = wdk.registerWallet(SOLANA_CHAIN.wdkKey, WalletManagerSolana, {
    provider: SOLANA_CHAIN.rpcUrls,
  });

  wdkInstance = wdk;
  return wdkInstance;
}

export async function getWdkAccount(chainId, index = 0) {
  const cfg = getChainConfig(chainId);
  if (!cfg) throw new Error(`Unsupported chain: ${chainId}`);
  return getWdk().getAccount(cfg.wdkKey, index);
}

export async function deriveAccountsForChain(chainId, count = 5) {
  const accounts = [];
  for (let i = 0; i < count; i++) {
    const account = await getWdkAccount(chainId, i);
    const address = normalizeAddress(await account.getAddress());
    accounts.push({
      index: i,
      address,
      path: account.path ?? null,
      chain: chainId,
    });
  }
  return accounts;
}

export async function fetchBalancesForAddress(chainId, accountIndex = 0) {
  const account = await getWdkAccount(chainId, accountIndex);
  const address = normalizeAddress(await account.getAddress());
  const balances = {};

  if (isEvmChain(chainId)) {
    const cfg = EVM_CHAINS[chainId];
    const nativeBal = await account.getBalance();
    balances[cfg.nativeSymbol] = formatUnits(nativeBal, cfg.nativeDecimals);

    for (const token of Object.values(cfg.tokens)) {
      try {
        const bal = await account.getTokenBalance(token.address);
        balances[token.symbol] = formatUnits(bal, token.decimals);
      } catch {
        balances[token.symbol] = '0';
      }
    }
    return { address, balances };
  }

  if (chainId === BITCOIN_CHAIN.id) {
    try {
      const nativeBal = await account.getBalance();
      balances.BTC = formatUnits(nativeBal, BITCOIN_CHAIN.nativeDecimals);
    } catch {
      balances.BTC = '0';
    }
    return { address, balances };
  }

  if (chainId === SOLANA_CHAIN.id) {
    try {
      const nativeBal = await account.getBalance();
      balances.SOL = formatUnits(nativeBal, SOLANA_CHAIN.nativeDecimals);
    } catch {
      balances.SOL = '0';
    }
    return { address, balances };
  }

  return { address, balances };
}

const ZERO_EVM = '0x0000000000000000000000000000000000000001';

export async function estimateSendFee({ chain, accountIndex, to, amount, token }) {
  const account = await getWdkAccount(chain, accountIndex);
  const recipient = to && to.length > 6 ? to : ZERO_EVM;
  const amt = amount && parseFloat(amount) > 0 ? amount : '0.000001';

  if (isEvmChain(chain)) {
    const cfg = EVM_CHAINS[chain];
    const tokenCfg = token && token !== cfg.nativeSymbol ? cfg.tokens[token] : null;

    if (tokenCfg) {
      const baseAmount = parseUnits(String(amt), tokenCfg.decimals);
      const quote = await account.quoteTransfer({
        token: tokenCfg.address,
        recipient,
        amount: baseAmount,
      });
      return {
        feeNative: formatUnits(quote.fee, cfg.nativeDecimals),
        feeSymbol: cfg.nativeSymbol,
      };
    }

    const value = parseUnits(String(amt), cfg.nativeDecimals);
    const quote = await account.quoteSendTransaction({ to: recipient, value });
    return {
      feeNative: formatUnits(quote.fee, cfg.nativeDecimals),
      feeSymbol: cfg.nativeSymbol,
    };
  }

  if (chain === BITCOIN_CHAIN.id) {
    return { feeNative: '0.000015', feeSymbol: 'BTC' };
  }

  if (chain === SOLANA_CHAIN.id) {
    return { feeNative: '0.000005', feeSymbol: 'SOL' };
  }

  throw new Error(`Fee estimate not available for ${chain}`);
}

export async function sendChainTransaction({
  chain,
  accountIndex,
  to,
  amount,
  token,
}) {
  const account = await getWdkAccount(chain, accountIndex);

  if (isEvmChain(chain)) {
    const cfg = EVM_CHAINS[chain];
    const tokenCfg = token && token !== cfg.nativeSymbol ? cfg.tokens[token] : null;

    if (tokenCfg) {
      const baseAmount = parseUnits(String(amount), tokenCfg.decimals);
      const result = await account.transfer({
        token: tokenCfg.address,
        recipient: to,
        amount: baseAmount,
      });
      return { hash: result.hash, fee: result.fee?.toString() };
    }

    const value = parseUnits(String(amount), cfg.nativeDecimals);
    const result = await account.sendTransaction({ to, value });
    return { hash: result.hash, fee: result.fee?.toString() };
  }

  if (chain === BITCOIN_CHAIN.id) {
    const satoshis = parseUnits(String(amount), BITCOIN_CHAIN.nativeDecimals);
    const result = await account.sendTransaction({
      to,
      value: satoshis,
    });
    return { hash: result.hash, fee: result.fee?.toString() };
  }

  if (chain === SOLANA_CHAIN.id) {
    const lamports = parseUnits(String(amount), SOLANA_CHAIN.nativeDecimals);
    const result = await account.sendTransaction({
      to,
      value: lamports,
    });
    return { hash: result.hash, fee: result.fee?.toString() };
  }

  throw new Error(`Send not supported for chain: ${chain}`);
}

export async function getChainAddress(chainId, accountIndex = 0) {
  const account = await getWdkAccount(chainId, accountIndex);
  return normalizeAddress(await account.getAddress());
}

export async function signPersonalMessage(chainId, accountIndex, message) {
  const account = await getWdkAccount(chainId, accountIndex);
  if (typeof account.sign !== 'function') {
    throw new Error('Signing not supported on this chain.');
  }
  return account.sign(message);
}

/** EVM contract call (escrow, approve, etc.) */
export async function sendEvmContractTransaction({
  chain,
  accountIndex,
  to,
  data,
  value = 0n,
}) {
  if (!isEvmChain(chain)) {
    throw new Error('Contract calls only supported on EVM chains.');
  }
  const account = await getWdkAccount(chain, accountIndex);
  const tx = {
    to,
    data: data || '0x',
    value: typeof value === 'bigint' ? value : BigInt(value || 0),
  };
  const result = await account.sendTransaction(tx);
  return { hash: result.hash, fee: result.fee?.toString() };
}
