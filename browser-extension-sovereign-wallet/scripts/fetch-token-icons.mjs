/**
 * Download official token logos from Trust Wallet assets (MIT).
 * https://github.com/trustwallet/assets
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons', 'tokens');
const BASE = 'https://raw.githubusercontent.com/trustwallet/assets/master';

const ICONS = {
  'eth.png': `${BASE}/blockchains/ethereum/info/logo.png`,
  'matic.png': `${BASE}/blockchains/polygon/info/logo.png`,
  'btc.png': `${BASE}/blockchains/bitcoin/info/logo.png`,
  'sol.png': `${BASE}/blockchains/solana/info/logo.png`,
  'usdt.png': `${BASE}/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png`,
  'xaut.png': [
    `${BASE}/blockchains/ethereum/assets/0x68749665FF8Dee9Cd2eB2B8ae0F6A5b93D0e5C3/logo.png`,
    'https://assets.coingecko.com/coins/images/10481/small/Tether_Gold.png',
  ],
};

fs.mkdirSync(outDir, { recursive: true });

for (const [file, urls] of Object.entries(ICONS)) {
  const list = Array.isArray(urls) ? urls : [urls];
  let res;
  for (const url of list) {
    res = await fetch(url);
    if (res.ok) break;
  }
  if (!res?.ok) throw new Error(`Failed ${file}: ${res?.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(outDir, file), buf);
  console.log('saved', file);
}

console.log('done');
