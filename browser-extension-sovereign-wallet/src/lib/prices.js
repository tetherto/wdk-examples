/**
 * USD prices via CoinGecko (cached). Used for portfolio and fee display.
 */

const COINGECKO_IDS = {
  ETH: 'ethereum',
  MATIC: 'matic-network',
  BTC: 'bitcoin',
  SOL: 'solana',
  USDt: 'tether',
  XAUt: 'tether-gold',
};

let cache = { prices: null, fetchedAt: 0 };
const CACHE_MS = 90_000;

export async function fetchUsdPrices() {
  if (cache.prices && Date.now() - cache.fetchedAt < CACHE_MS) {
    return cache.prices;
  }

  const ids = [...new Set(Object.values(COINGECKO_IDS))].join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Could not load USD prices');
  }

  const data = await res.json();
  const prices = {};
  for (const [symbol, id] of Object.entries(COINGECKO_IDS)) {
    const p = data[id]?.usd;
    prices[symbol] = typeof p === 'number' ? p : symbol === 'USDt' ? 1 : 0;
  }

  cache = { prices, fetchedAt: Date.now() };
  return prices;
}

export function formatUsd(amount) {
  if (!Number.isFinite(amount)) return '—';
  if (amount === 0) return '$0.00';
  if (amount > 0 && amount < 0.01) return '<$0.01';
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function toUsd(balanceStr, priceUsd) {
  const bal = parseFloat(balanceStr);
  if (!Number.isFinite(bal) || !Number.isFinite(priceUsd)) return null;
  return bal * priceUsd;
}
