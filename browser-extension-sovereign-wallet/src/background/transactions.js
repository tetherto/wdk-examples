/**
 * Transaction history: WDK BTC transfers + local log for EVM/Solana sends.
 */

import { formatUnits } from 'ethers';
import {
  BITCOIN_CHAIN,
  EVM_CHAINS,
  SOLANA_CHAIN,
  isEvmChain,
} from '../config/chains.js';
import { getWdkAccount } from './wdk-loader.js';
import { formatBalance } from '../lib/format-balance.js';
import { formatUsd, toUsd } from '../lib/prices.js';

const TX_LOG_KEY = 'wdk_tx_log';

export async function appendTxLog(entry) {
  const stored = await chrome.storage.local.get(TX_LOG_KEY);
  const log = stored[TX_LOG_KEY] || [];
  log.unshift({ ...entry, timestamp: Date.now() });
  await chrome.storage.local.set({ [TX_LOG_KEY]: log.slice(0, 100) });
}

async function getTxLog(chain, address) {
  const stored = await chrome.storage.local.get(TX_LOG_KEY);
  const log = stored[TX_LOG_KEY] || [];
  return log.filter(
    (t) =>
      t.chain === chain &&
      (t.from?.toLowerCase() === address?.toLowerCase() ||
        t.to?.toLowerCase() === address?.toLowerCase())
  );
}

export async function fetchTransactions(chain, accountIndex = 0) {
  const account = await getWdkAccount(chain, accountIndex);
  const address = await account.getAddress();

  if (chain === BITCOIN_CHAIN.id && typeof account.getTransfers === 'function') {
    let transfers = [];
    try {
      transfers = await account.getTransfers({ direction: 'all', limit: 20 });
    } catch {
      return [];
    }
    return transfers.map((t) => ({
      hash: t.txid,
      type: t.direction === 'incoming' ? 'receive' : 'send',
      amount: formatUnits(t.value, BITCOIN_CHAIN.nativeDecimals),
      token: 'BTC',
      from: t.direction === 'incoming' ? '' : address,
      to: t.recipient || address,
      timestamp: t.height ? Date.now() - 60000 : Date.now(),
      status: t.height ? 'confirmed' : 'pending',
      confirmations: t.height || 0,
    }));
  }

  const local = await getTxLog(chain, address);
  return local.map((t) => ({
    hash: t.hash,
    type: t.type,
    amount: t.amount,
    token: t.token,
    from: t.from,
    to: t.to,
    timestamp: t.timestamp,
    status: t.status || 'confirmed',
    confirmations: t.confirmations ?? 12,
  }));
}

const TOKEN_ICONS = {
  ETH: 'icons/tokens/eth.png',
  MATIC: 'icons/tokens/matic.png',
  USDt: 'icons/tokens/usdt.png',
  XAUt: 'icons/tokens/xaut.png',
  BTC: 'icons/tokens/btc.png',
  SOL: 'icons/tokens/sol.png',
};

const SYMBOL_LABELS = {
  ETH: 'Ether',
  MATIC: 'Polygon',
  USDt: 'Tether USD',
  XAUt: 'Tether Gold',
  BTC: 'Bitcoin',
  SOL: 'Solana',
};

function assetRow({ symbol, color, balance, network, usdPrices }) {
  const price = usdPrices?.[symbol];
  const usd = price != null ? toUsd(balance || '0', price) : null;
  return {
    symbol,
    name: SYMBOL_LABELS[symbol] || symbol,
    network,
    icon: symbol.slice(0, 1),
    iconUrl: TOKEN_ICONS[symbol] || null,
    color,
    balance: formatBalance(balance || '0'),
    value: usd != null ? formatUsd(usd) : '—',
    valueUsd: usd,
  };
}

export function formatPortfolioAssets(chain, balances, chainName, usdPrices = {}) {
  const assets = [];
  const cfg = isEvmChain(chain) ? EVM_CHAINS[chain] : null;

  if (cfg) {
    const nativeColor = cfg.nativeSymbol === 'MATIC' ? '#8247E5' : '#627EEA';
    assets.push(
      assetRow({
        symbol: cfg.nativeSymbol,
        color: nativeColor,
        balance: balances[cfg.nativeSymbol],
        network: chainName,
        usdPrices,
      })
    );
    for (const token of Object.values(cfg.tokens)) {
      assets.push(
        assetRow({
          symbol: token.symbol,
          color: token.symbol === 'USDt' ? '#26A17B' : '#F4C542',
          balance: balances[token.symbol],
          network: chainName,
          usdPrices,
        })
      );
    }
    return assets;
  }

  if (chain === BITCOIN_CHAIN.id) {
    assets.push(
      assetRow({
        symbol: 'BTC',
        color: '#F7931A',
        balance: balances.BTC,
        network: chainName,
        usdPrices,
      })
    );
    return assets;
  }

  if (chain === SOLANA_CHAIN.id) {
    assets.push(
      assetRow({
        symbol: 'SOL',
        color: '#9945FF',
        balance: balances.SOL,
        network: chainName,
        usdPrices,
      })
    );
  }

  return assets;
}
