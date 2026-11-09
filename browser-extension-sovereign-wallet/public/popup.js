// ══════════════════════════════════════════════════════════════
//  WDK Browser Extension Popup — Main Logic
// ══════════════════════════════════════════════════════════════

// ── State ──────────────────────────────────────────────────────
const state = {
  currentSeedPhrase: null,
  activeChain: 'ethereum',
  activeToken: 'USDt',
  accounts: [],
  balances: {},
  addresses: {},
  transactions: [],
  currentReceiveChain: 'ethereum',
  maxBalance: 0,
  sendChain: null,
  usdPrices: {},
  feeEstimateTimer: null,
  resetReturnScreen: 'screen-settings',
  hasWallet: false,
  isUnlocked: false,
  activeAccountIndex: 0,
};

const ONBOARDING_SCREENS = ['screen-welcome', 'screen-create', 'screen-import'];
const MNEMONIC_WORD_COUNTS = [12, 15, 18, 21, 24];

function normalizeMnemonicInput(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, '')
    .replace(/[,;|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mnemonicWordCount(raw) {
  const phrase = normalizeMnemonicInput(raw);
  return phrase ? phrase.split(' ').filter(Boolean).length : 0;
}

function setFormError(el, message) {
  if (!el) return;
  if (message) {
    el.textContent = message;
    el.classList.add('show');
  } else {
    el.textContent = '';
    el.classList.remove('show');
  }
}

// ── Networks config ────────────────────────────────────────────
const NETWORKS = [
  { id: 'ethereum',  name: 'Ethereum',  symbol: 'ETH',   color: '#627EEA', chainIcon: 'icons/chains/ethereum.svg', explorer: 'https://etherscan.io', tokens: ['ETH','USDt','XAUt'] },
  { id: 'polygon',   name: 'Polygon',   symbol: 'MATIC', color: '#8247E5', chainIcon: 'icons/chains/polygon.svg', explorer: 'https://polygonscan.com', tokens: ['MATIC','USDt'] },
  { id: 'arbitrum',  name: 'Arbitrum',  symbol: 'ETH',   color: '#28A0F0', chainIcon: 'icons/chains/arbitrum.svg', explorer: 'https://arbiscan.io', tokens: ['ETH','USDt'] },
  { id: 'bsc',       name: 'BNB Chain', symbol: 'BNB',   color: '#F3BA2F', chainIcon: 'icons/chains/bsc.svg', explorer: 'https://bscscan.com', tokens: ['BNB','USDt'] },
  { id: 'bitcoin',   name: 'Bitcoin',   symbol: 'BTC',   color: '#F7931A', chainIcon: 'icons/chains/bitcoin.svg', explorer: 'https://mempool.space', tokens: ['BTC'] },
  { id: 'solana',    name: 'Solana',    symbol: 'SOL',   color: '#9945FF', chainIcon: 'icons/chains/solana.svg', explorer: 'https://solana.fm', tokens: ['SOL'] },
];

function getNetworkMeta(chainId) {
  return NETWORKS.find((n) => n.id === chainId) || NETWORKS[0];
}

function explorerAddressUrl(chainId, address) {
  const meta = getNetworkMeta(chainId);
  if (chainId === 'bitcoin') return `${meta.explorer}/address/${address}`;
  if (chainId === 'solana') return `${meta.explorer}/address/${address}`;
  return `${meta.explorer}/address/${address}`;
}

function explorerTxUrl(chainId, hash) {
  const meta = getNetworkMeta(chainId);
  if (chainId === 'bitcoin') return `${meta.explorer}/tx/${hash}`;
  if (chainId === 'solana') return `${meta.explorer}/tx/${hash}`;
  return `${meta.explorer}/tx/${hash}`;
}

// ── Message bus (talks to background.js) ──────────────────────
async function msg(type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload }, (res) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      if (res?.error) return reject(new Error(res.error));
      resolve(res);
    });
  });
}

async function syncWalletStatus() {
  try {
    const status = await msg('WALLET_STATUS');
    state.hasWallet = Boolean(status.hasWallet);
    state.isUnlocked = Boolean(status.isUnlocked);
    return status;
  } catch {
    state.hasWallet = false;
    state.isUnlocked = false;
    return { hasWallet: false, isUnlocked: false };
  }
}

function guardedNav(target) {
  if (state.hasWallet && ONBOARDING_SCREENS.includes(target)) {
    showToast(state.isUnlocked ? 'Wallet already set up' : 'Unlock your wallet first');
    showScreen(state.isUnlocked ? 'screen-main' : 'screen-unlock');
    return;
  }
  if (!state.hasWallet && target === 'screen-main') {
    showScreen('screen-welcome');
    return;
  }
  showScreen(target);
}

function resetSeedRevealPanel() {
  state.currentSeedPhrase = null;
  const auth = document.getElementById('seed-reveal-auth');
  const show = document.getElementById('seed-reveal-show');
  const pw = document.getElementById('reveal-password');
  const err = document.getElementById('reveal-error');
  const grid = document.getElementById('seed-reveal-grid');
  if (auth) auth.style.display = 'block';
  if (show) show.style.display = 'none';
  if (pw) pw.value = '';
  if (err) err.classList.remove('show');
  if (grid) grid.replaceChildren();
}

async function withButtonLoading(btn, busyLabel, fn) {
  if (!btn) return fn();
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> ${busyLabel}`;
  try {
    return await fn();
  } finally {
    btn.innerHTML = original;
    btn.disabled = false;
  }
}

// ── Init ───────────────────────────────────────────────────────
async function init() {
  try {
    const status = await syncWalletStatus();
    if (!status.hasWallet) {
      showScreen('screen-welcome');
    } else if (!status.isUnlocked) {
      showScreen('screen-unlock');
    } else {
      showScreen('screen-main');
      loadWalletData();
    }
  } catch {
    state.hasWallet = false;
    state.isUnlocked = false;
    showScreen('screen-welcome');
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Screen Navigation ──────────────────────────────────────────
function showScreen(id) {
  closeAssetSheet();
  const leaving = document.querySelector('.screen.active')?.id;
  if (leaving === 'screen-seed-reveal' && id !== 'screen-seed-reveal') {
    resetSeedRevealPanel();
  }
  if (id === 'screen-reset-confirm') {
    const active = document.querySelector('.screen.active');
    state.resetReturnScreen = active?.id || 'screen-settings';
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'screen-send') {
    state.sendChain = state.sendChain || state.activeChain;
    refreshSendBalances(state.sendChain);
  }
  if (id === 'screen-receive') {
    if (leaving === 'screen-main' || leaving === 'screen-send') {
      state.currentReceiveChain = state.activeChain;
    }
    void syncReceiveUi();
  }
  if (id === 'screen-create' && leaving !== 'screen-create') {
    resetCreateForm();
  }
  if (id === 'screen-import' && leaving !== 'screen-import') {
    resetImportForm();
    void prepareImportScreen();
  }
  if (id === 'screen-accounts') {
    void refreshAccountsList();
  }
  if (id === 'screen-unlock') {
    const pw = document.getElementById('unlock-password');
    if (pw) pw.value = '';
    document.getElementById('unlock-error')?.classList.remove('show');
  }
}

function resetCreateForm() {
  state.currentSeedPhrase = null;
  const stepPw = document.getElementById('create-step-password');
  const stepSeed = document.getElementById('create-step-seed');
  if (stepPw) stepPw.style.display = 'block';
  if (stepSeed) stepSeed.style.display = 'none';
  ['create-password', 'create-password-confirm'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('create-pw-error')?.classList.remove('show');
  document.getElementById('seed-display')?.replaceChildren();
}

function showCreateSeedStep(mnemonic) {
  state.currentSeedPhrase = mnemonic;
  displaySeedPhrase(mnemonic, 'seed-display');
  const stepPw = document.getElementById('create-step-password');
  const stepSeed = document.getElementById('create-step-seed');
  if (stepPw) stepPw.style.display = 'none';
  if (stepSeed) {
    stepSeed.style.display = 'block';
    stepSeed.scrollIntoView({ block: 'nearest' });
  }
}

const TOKEN_ICON_FILES = {
  ETH: 'icons/tokens/eth.png',
  MATIC: 'icons/tokens/matic.png',
  USDt: 'icons/tokens/usdt.png',
  XAUt: 'icons/tokens/xaut.png',
  BTC: 'icons/tokens/btc.png',
  SOL: 'icons/tokens/sol.png',
};

function tokenIconUrl(symbol) {
  return TOKEN_ICON_FILES[symbol] || null;
}

function renderAssetIcon(asset) {
  const src = asset.iconUrl || tokenIconUrl(asset.symbol);
  if (src) {
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(asset.symbol)}" width="40" height="40" />`;
  }
  return escapeHtml(asset.icon || asset.symbol?.slice(0, 1) || '?');
}

let pendingAssetToken = null;

function openAssetSheet(token) {
  pendingAssetToken = token;
  const title = document.getElementById('asset-sheet-title');
  const sheet = document.getElementById('asset-sheet');
  if (title) title.textContent = token;
  if (sheet) {
    sheet.classList.add('open');
    sheet.removeAttribute('inert');
    sheet.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
      sheet.querySelector('.asset-sheet-actions .btn-primary')?.focus();
    });
  }
}

function closeAssetSheet() {
  pendingAssetToken = null;
  const sheet = document.getElementById('asset-sheet');
  if (!sheet) return;
  if (sheet.contains(document.activeElement)) {
    document.activeElement.blur();
  }
  sheet.classList.remove('open');
  sheet.setAttribute('aria-hidden', 'true');
  sheet.setAttribute('inert', '');
}

function selectSendTokenBySymbol(token) {
  const chip = document.querySelector(`#screen-send [data-token="${token}"]`);
  if (chip) selectSendToken(chip, token);
  else {
    state.activeToken = token;
    refreshSendUi();
  }
}

async function goAssetSend() {
  const token = pendingAssetToken;
  closeAssetSheet();
  if (!token) return;
  state.activeToken = token;
  state.sendChain = state.activeChain;
  showScreen('screen-send');
  await refreshSendBalances(state.activeChain);
  selectSendTokenBySymbol(token);
}

function goAssetReceive() {
  closeAssetSheet();
  state.currentReceiveChain = state.activeChain;
  showScreen('screen-receive');
}

function renderReceiveQr() {
  const canvas = document.getElementById('receive-qr');
  if (!canvas) return;
  const chain = state.currentReceiveChain || state.activeChain;
  const address = state.addresses?.[chain];
  const ctx = canvas.getContext('2d');
  if (!address || address === '—' || !window.SovereignQR) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }
  window.SovereignQR.toCanvas(canvas, address).catch(() => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });
}

function formatSendError(err) {
  const m = err?.message || String(err);
  if (m.includes('CALL_EXCEPTION') || m.includes('estimateGas') || m.includes('missing revert')) {
    return 'Transaction would fail. Check token balance and native coin for network fees.';
  }
  if (m.includes('insufficient funds')) {
    return 'Insufficient native coin for network fees.';
  }
  return m.length > 180 ? `${m.slice(0, 180)}…` : m;
}

function formatUsdDisplay(amount) {
  if (!Number.isFinite(amount)) return '—';
  if (amount === 0) return '$0.00';
  if (amount > 0 && amount < 0.01) return '<$0.01';
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function tokenUsdPrice(symbol) {
  const p = state.usdPrices?.[symbol];
  if (Number.isFinite(p)) return p;
  if (symbol === 'USDt') return 1;
  return 0;
}

function formatBalanceDisplay(bal) {
  const n = parseFloat(bal);
  if (!Number.isFinite(n) || n === 0) return '0';
  if (n < 0.000001) return '<0.000001';
  if (n < 1) {
    const s = n.toFixed(6).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return s || '0';
  }
  const s = n.toFixed(4).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  return s || '0';
}

/** Trim trailing zeros for send-amount input (keeps enough precision for crypto). */
function formatSendAmountInput(n) {
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n >= 1) {
    return n.toFixed(8).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  }
  if (n >= 0.0001) {
    return n.toFixed(8).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  }
  const s = n.toPrecision(12);
  return s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

function amountFromBalancePct(balanceStr, pct) {
  const max = parseFloat(balanceStr) || 0;
  if (max <= 0) return '';
  if (pct >= 1) {
    const raw = String(balanceStr ?? '').trim();
    if (raw && parseFloat(raw) > 0) {
      return raw.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    }
    return formatSendAmountInput(max);
  }
  return formatSendAmountInput(max * pct);
}

function updateNetworkHeader(chainId, accountIndex = 0) {
  const meta = getNetworkMeta(chainId);
  const label = document.getElementById('active-network-label');
  const icon = document.getElementById('active-network-icon');
  const title = document.getElementById('main-total-balance');
  const sub = document.getElementById('main-portfolio-sub');
  const assetsChain = document.getElementById('assets-chain-label');
  if (label) label.textContent = meta.name;
  if (icon) icon.src = meta.chainIcon;
  if (title) title.textContent = meta.name;
  if (assetsChain) assetsChain.textContent = meta.name;
  if (sub) sub.textContent = `Account ${accountIndex + 1}`;
}

function getMainAddress() {
  const chain = state.activeChain;
  const fromState = state.addresses?.[chain];
  if (fromState && fromState !== '—') return fromState;
  const el = document.getElementById('main-active-address');
  const full = el?.dataset?.fullAddress;
  if (full && full !== '—') return full;
  const text = el?.textContent?.trim();
  return text && text !== '—' ? text : null;
}

function copyMainAddress() {
  const addr = getMainAddress();
  if (!addr) {
    showToast('Address not loaded — tap Refresh');
    return;
  }
  navigator.clipboard.writeText(addr).then(() => showToast('Address copied'));
}

function openExplorerAddress() {
  const chain = state.activeChain;
  const addr = getMainAddress();
  if (!addr) return;
  window.open(explorerAddressUrl(chain, addr), '_blank', 'noopener,noreferrer');
}

function openExplorerTx(hash) {
  if (!hash) return;
  window.open(explorerTxUrl(state.activeChain, hash), '_blank', 'noopener,noreferrer');
}

async function refreshPortfolio() {
  const buttons = document.querySelectorAll('[data-action="refresh-portfolio"]');
  buttons.forEach((b) => { b.disabled = true; });
  try {
    await loadWalletData();
    showToast('Balances updated');
  } catch (e) {
    showToast(e.message || 'Refresh failed');
  } finally {
    buttons.forEach((b) => { b.disabled = false; });
  }
}

function portfolioHasFunds(assets) {
  return assets.some((a) => {
    const n = parseFloat(a.balance);
    return Number.isFinite(n) && n > 0;
  });
}

async function refreshSendBalances(chain) {
  state.sendChain = chain;
  try {
    const res = await msg('GET_BALANCE', { chain });
    state.balances = res.balance || {};
    if (res.address) {
      state.addresses = state.addresses || {};
      state.addresses[chain] = res.address;
    }
  } catch {
    /* keep last known balances */
  }
  refreshSendUi();
}

function refreshSendUi() {
  const bal = state.balances?.[state.activeToken] ?? '0';
  const num = parseFloat(bal) || 0;
  document.getElementById('send-max-balance').textContent =
    `Balance: ${formatBalanceDisplay(bal)} ${state.activeToken}`;
  state.maxBalance = num;
  const amountEl = document.getElementById('send-amount');
  if (amountEl && parseFloat(amountEl.value) > num) {
    amountEl.value = num > 0 ? String(num) : '';
  }
  updateSendSummary();
}

// ── Tab Switching ──────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab[data-tab]').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.getElementById('tab-assets').style.display = tab === 'assets' ? 'block' : 'none';
  document.getElementById('tab-activity').style.display = tab === 'activity' ? 'block' : 'none';
}

// ── Password Strength ──────────────────────────────────────────
function checkPasswordStrength(pw) {
  const segments = document.querySelectorAll('.strength-segment');
  const colors = ['#ff6b6b','#f4c542','#00b87a','#00e5a0'];
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  segments.forEach((s, i) => s.style.background = i < score ? colors[score-1] : 'var(--bg3)');
}

// ── Create Wallet ──────────────────────────────────────────────
async function generateWallet() {
  const pw = document.getElementById('create-password').value;
  const pw2 = document.getElementById('create-password-confirm').value;
  const errEl = document.getElementById('create-pw-error');

  if (pw.length < 8) { errEl.textContent = 'Password must be at least 8 characters'; errEl.classList.add('show'); return; }
  if (pw !== pw2) { errEl.classList.add('show'); return; }
  errEl.classList.remove('show');

  const btn = document.getElementById('btn-generate');
  btn.innerHTML = '<span class="spinner"></span> Generating...';
  btn.disabled = true;

  try {
    const res = await msg('WALLET_CREATE', { password: pw });
    const mnemonic = res.mnemonic;
    state.currentSeedPhrase = mnemonic;
    displaySeedPhrase(mnemonic, 'seed-display');
    document.getElementById('create-step-password').style.display = 'none';
    document.getElementById('create-step-seed').style.display = 'block';
    state.hasWallet = true;
    state.isUnlocked = true;
    showScreen('screen-create');
    showToast('New wallet ready — write down your 12 words, then tap I\'ve Written It Down');
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.add('show');
  } finally {
    btn.innerHTML = 'Generate Seed Phrase';
    btn.disabled = false;
  }
}

function displaySeedPhrase(mnemonic, containerId) {
  const words = mnemonic.trim().split(/\s+/);
  const container = document.getElementById(containerId);
  container.replaceChildren();
  words.forEach((w, i) => {
    const cell = document.createElement('div');
    cell.className = 'seed-word';
    const num = document.createElement('span');
    num.className = 'seed-num';
    num.textContent = String(i + 1);
    const text = document.createElement('span');
    text.className = 'seed-text';
    text.textContent = w;
    cell.append(num, text);
    container.appendChild(cell);
  });
}

async function confirmSeedWritten() {
  if (!state.hasWallet) {
    showToast('Wallet not ready — try generating again');
    return;
  }
  state.currentSeedPhrase = null;
  showScreen('screen-main');
  try {
    await loadWalletData();
    showToast('Wallet ready');
  } catch (e) {
    showToast(e.message || 'Wallet ready — tap refresh if balances are empty');
  }
}

async function copySeedPhrase() {
  const phrase = state.currentSeedPhrase;
  if (!phrase) {
    showToast('Seed not available — generate your wallet again');
    return;
  }
  try {
    await navigator.clipboard.writeText(phrase);
    showToast('Copied — store it safely offline');
  } catch {
    showToast('Could not copy — write the words down manually');
  }
}

function resetImportForm() {
  ['import-mnemonic', 'import-password', 'import-password-confirm'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  setFormError(document.getElementById('import-mnemonic-error'), null);
  setFormError(document.getElementById('import-pw-error'), null);
  setFormError(document.getElementById('import-error'), null);
  const btn = document.getElementById('btn-import');
  if (btn) btn.disabled = false;
}

async function prepareImportScreen() {
  const genErr = document.getElementById('import-error');
  const btn = document.getElementById('btn-import');
  try {
    const status = await syncWalletStatus();
    if (status.hasWallet) {
      setFormError(
        genErr,
        'A wallet already exists on this device. Reset from unlock/settings, or use Settings → Import Different Wallet.'
      );
      if (btn) btn.disabled = true;
    } else if (btn) {
      btn.disabled = false;
    }
  } catch {
    if (btn) btn.disabled = false;
  }
}

// ── Import Wallet ──────────────────────────────────────────────
async function importWallet() {
  const mnemonic = normalizeMnemonicInput(document.getElementById('import-mnemonic').value);
  const pw = document.getElementById('import-password').value;
  const pw2 = document.getElementById('import-password-confirm').value;
  const mnErr = document.getElementById('import-mnemonic-error');
  const pwErr = document.getElementById('import-pw-error');
  const genErr = document.getElementById('import-error');

  setFormError(mnErr, null);
  setFormError(pwErr, null);
  setFormError(genErr, null);

  const count = mnemonicWordCount(mnemonic);
  if (!MNEMONIC_WORD_COUNTS.includes(count)) {
    setFormError(
      mnErr,
      `Use ${MNEMONIC_WORD_COUNTS.join(', ')} words (detected ${count}). Paste words separated by spaces or new lines.`
    );
    return;
  }
  if (pw.length < 8) {
    setFormError(pwErr, 'Password must be at least 8 characters');
    return;
  }
  if (pw !== pw2) {
    setFormError(pwErr, 'Passwords do not match');
    return;
  }

  const btn = document.getElementById('btn-import');
  await withButtonLoading(btn, 'Importing...', async () => {
    try {
      await msg('WALLET_IMPORT', { mnemonic, password: pw });
      state.hasWallet = true;
      state.isUnlocked = true;
      state.currentSeedPhrase = null;
      showScreen('screen-main');
      await loadWalletData();
      showToast('Wallet imported');
    } catch (e) {
      setFormError(genErr, e.message || 'Import failed');
    }
  });
}

async function replaceWallet() {
  const mnemonic = normalizeMnemonicInput(document.getElementById('replace-mnemonic').value);
  const pw = document.getElementById('replace-password').value;
  const pw2 = document.getElementById('replace-password-confirm').value;
  const mnErr = document.getElementById('replace-mnemonic-error');
  const pwErr = document.getElementById('replace-pw-error');
  const genErr = document.getElementById('replace-error');

  setFormError(mnErr, null);
  setFormError(pwErr, null);
  setFormError(genErr, null);

  const count = mnemonicWordCount(mnemonic);
  if (!MNEMONIC_WORD_COUNTS.includes(count)) {
    setFormError(mnErr, `Use ${MNEMONIC_WORD_COUNTS.join(', ')} words (detected ${count}).`);
    return;
  }
  if (pw.length < 8) {
    setFormError(pwErr, 'Password must be at least 8 characters');
    return;
  }
  if (pw !== pw2) {
    setFormError(pwErr, 'Passwords do not match');
    return;
  }

  const btn = document.getElementById('btn-replace');
  await withButtonLoading(btn, 'Replacing...', async () => {
    try {
      await msg('WALLET_REPLACE', { mnemonic, password: pw });
      state.hasWallet = true;
      state.isUnlocked = true;
      showScreen('screen-main');
      await loadWalletData();
      showToast('Wallet replaced');
    } catch (e) {
      setFormError(genErr, e.message || 'Replace failed');
    }
  });
}

// ── Unlock ─────────────────────────────────────────────────────
async function unlockWallet() {
  const pw = document.getElementById('unlock-password').value;
  const errEl = document.getElementById('unlock-error');
  const btn = document.getElementById('btn-unlock');

  errEl.classList.remove('show');
  btn.innerHTML = '<span class="spinner"></span>';
  btn.disabled = true;

  try {
    await msg('WALLET_UNLOCK', { password: pw });
    state.hasWallet = true;
    state.isUnlocked = true;
    showScreen('screen-main');
    loadWalletData();
  } catch (e) {
    errEl.classList.add('show');
  } finally {
    btn.innerHTML = 'Unlock Wallet';
    btn.disabled = false;
  }
}

async function lockAndGoHome() {
  try {
    await msg('WALLET_LOCK');
  } catch {
    /* still show unlock screen */
  }
  state.isUnlocked = false;
  state.balances = {};
  const pw = document.getElementById('unlock-password');
  if (pw) pw.value = '';
  showScreen('screen-unlock');
  showToast('Wallet locked');
}

// ── Load Wallet Data ───────────────────────────────────────────
async function loadWalletData() {
  let portfolio = {
    address: '',
    addresses: {},
    balances: {},
    assets: [],
    transactions: [],
    activeAccountIndex: 0,
  };
  try {
    portfolio = await msg('GET_PORTFOLIO', { chain: state.activeChain });
  } catch (e) {
    showToast(e.message || 'Failed to load wallet');
  }

  state.addresses = portfolio.addresses || {};
  state.balances = portfolio.balances || {};
  state.usdPrices = portfolio.usdPrices || state.usdPrices || {};
  const assets = portfolio.assets || [];

  const addrEl = document.getElementById('main-active-address');
  const fullAddr = portfolio.address || state.addresses?.[state.activeChain] || '—';
  if (addrEl) {
    if (fullAddr && fullAddr !== '—') {
      addrEl.textContent = fullAddr;
      addrEl.dataset.fullAddress = fullAddr;
      addrEl.title = fullAddr;
    } else {
      addrEl.textContent = '—';
      delete addrEl.dataset.fullAddress;
      addrEl.title = '';
    }
  }

  updateNetworkHeader(state.activeChain, portfolio.activeAccountIndex ?? 0);
  const subEl = document.getElementById('main-portfolio-sub');
  if (subEl) {
    subEl.textContent = `${assets.length} token${assets.length === 1 ? '' : 's'} · Account ${(portfolio.activeAccountIndex ?? 0) + 1}`;
  }

  const usdEl = document.getElementById('main-portfolio-usd');
  if (usdEl) {
    const total = portfolio.portfolioUsd;
    if (Number.isFinite(total) && total > 0) {
      usdEl.textContent = `≈ ${formatUsdDisplay(total)}`;
      usdEl.style.display = 'block';
    } else {
      usdEl.textContent = '';
      usdEl.style.display = 'none';
    }
  }

  const fundHint = document.getElementById('fund-hint');
  if (fundHint) fundHint.style.display = portfolioHasFunds(assets) ? 'none' : 'block';

  const assetsList = document.getElementById('assets-list');
  if (!assets.length) {
    assetsList.innerHTML = '<div class="text-muted" style="padding:16px;text-align:center">No assets on this network</div>';
  } else {
  assetsList.innerHTML = assets.map(a => `
    <div class="asset-item" data-action="open-asset-sheet" data-token="${escapeHtml(a.symbol)}" role="button" tabindex="0" title="Send or receive ${escapeHtml(a.symbol)}">
      <div class="asset-icon">${renderAssetIcon(a)}</div>
      <div class="asset-info">
        <div class="asset-name">${escapeHtml(a.symbol)}</div>
        <div class="asset-subname">${escapeHtml(a.name)} · ${escapeHtml(a.network || '')}</div>
      </div>
      <div class="asset-amounts">
        <div class="asset-balance tabular" style="color:${escapeHtml(a.color)}">${escapeHtml(a.balance)}</div>
        <div class="asset-value">${escapeHtml(a.value)}</div>
      </div>
    </div>
  `).join('');
  }

  const txs = (portfolio.transactions || []).map(tx => ({
    type: tx.type,
    amount: `${tx.type === 'receive' ? '+' : '-'}${formatBalanceDisplay(tx.amount)}`,
    token: tx.token,
    addr: shortAddr(tx.type === 'receive' ? tx.from : tx.to),
    time: formatTime(tx.timestamp),
    status: tx.status,
    hash: tx.hash,
  }));

  const txList = document.getElementById('tx-list');
  if (!txs.length) {
    txList.innerHTML = '<div class="text-muted" style="padding:16px;text-align:center">No recent activity</div>';
  } else {
  txList.innerHTML = txs.map(tx => `
    <div class="tx-item clickable" data-action="open-explorer-tx" data-hash="${escapeHtml(tx.hash || '')}" title="View on explorer">
      <div class="tx-icon ${tx.type==='receive'?'tx-receive':'tx-send'}">
        ${tx.type==='receive'?'↓':'↑'}
      </div>
      <div class="tx-info">
        <div class="tx-type">${escapeHtml(tx.type)}</div>
        <div class="tx-address">${escapeHtml(tx.addr)}</div>
      </div>
      <div class="tx-amounts">
        <div class="tx-amount tabular ${tx.type==='send'?'tx-send-amt':''}">${escapeHtml(tx.amount)} ${escapeHtml(tx.token)}</div>
        <div class="tx-date">${escapeHtml(tx.time)} · <span class="tx-status">✓ ${escapeHtml(tx.status)}</span></div>
      </div>
    </div>
  `).join('');
  }

  state.activeAccountIndex = portfolio.activeAccountIndex ?? 0;

  if (document.getElementById('screen-accounts')?.classList.contains('active')) {
    void refreshAccountsList();
  }

  // Networks
  const networksList = document.getElementById('networks-list');
  networksList.innerHTML = NETWORKS.map(n => `
    <div class="settings-item" data-action="select-network" data-chain="${n.id}" data-name="${n.name}">
      <div class="settings-item-left">
        <img src="${escapeHtml(n.chainIcon)}" alt="" width="22" height="22" style="border-radius:50%" />
        <div>
          <div class="settings-item-label">${n.name}</div>
          <div class="settings-item-sub">${n.tokens.join(', ')}</div>
        </div>
      </div>
      <span class="settings-item-right">›</span>
    </div>
  `).join('');

  refreshSendUi();
  if (document.getElementById('screen-receive')?.classList.contains('active')) {
    void syncReceiveUi();
  }
}

// ── Network Selection ──────────────────────────────────────────
function selectNetwork(id, name) {
  state.activeChain = id;
  state.sendChain = id;
  updateNetworkHeader(id, state.activeAccountIndex || 0);
  showScreen('screen-main');
  loadWalletData();
}

// ── Send Flow ──────────────────────────────────────────────────
function selectSendToken(el, token) {
  document.querySelectorAll('#screen-send .token-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  state.activeToken = token;
  refreshSendUi();
}

async function selectChip(el, chain) {
  const root = el.closest('.chain-select');
  if (root) root.querySelectorAll('.chain-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  await refreshSendBalances(chain);
  const meta = getNetworkMeta(chain);
  const nativeChip = document.querySelector(`#screen-send [data-token="${meta.symbol}"]`);
  if (nativeChip) selectSendToken(nativeChip, meta.symbol);
  else if (meta.tokens.includes('USDt')) {
    const usdt = document.querySelector('#screen-send [data-token="USDt"]');
    if (usdt) selectSendToken(usdt, 'USDt');
  }
}

function setMaxAmount(pct) {
  const errEl = document.getElementById('send-error');
  if (errEl) {
    errEl.textContent = '';
    errEl.classList.remove('show');
  }

  const balStr = state.balances?.[state.activeToken] ?? '0';
  const max = parseFloat(balStr) || 0;
  if (max <= 0) {
    showToast(`No ${state.activeToken} balance on this network`);
    return;
  }

  const amount = amountFromBalancePct(balStr, pct);
  const num = parseFloat(amount);
  if (!amount || !Number.isFinite(num) || num <= 0) {
    showToast('Amount is too small for this percentage');
    return;
  }

  const amountEl = document.getElementById('send-amount');
  if (amountEl) amountEl.value = amount;
  updateSendSummary();
}

document.addEventListener('input', function(e) {
  if (e.target.id === 'send-amount' || e.target.id === 'send-address') updateSendSummary();
});

function updateSendSummary() {
  const amount = parseFloat(document.getElementById('send-amount')?.value) || 0;
  const token = state.activeToken;
  const amountUsd = amount * tokenUsdPrice(token);

  const amountEl = document.getElementById('summary-amount');
  const amountUsdEl = document.getElementById('summary-amount-usd');
  if (amountEl) {
    amountEl.textContent = `${formatBalanceDisplay(String(amount))} ${token}`;
  }
  if (amountUsdEl) {
    amountUsdEl.textContent = `≈ ${formatUsdDisplay(amountUsd)}`;
  }

  if (state.feeEstimateTimer) clearTimeout(state.feeEstimateTimer);
  state.feeEstimateTimer = setTimeout(() => refreshFeeEstimate(), 450);
}

async function refreshFeeEstimate() {
  const feeEl = document.getElementById('summary-fee');
  const feeUsdEl = document.getElementById('summary-fee-usd');
  const totalEl = document.getElementById('summary-total');
  const noteEl = document.getElementById('summary-fee-note');
  if (!feeEl) return;

  const chain = state.sendChain || state.activeChain;
  const to = document.getElementById('send-address')?.value?.trim() || '';
  const amount = document.getElementById('send-amount')?.value || '0';
  const token = state.activeToken;

  feeEl.textContent = 'Estimating…';
  if (feeUsdEl) feeUsdEl.textContent = '…';

  try {
    const res = await msg('ESTIMATE_SEND_FEE', { chain, to, amount, token });
    const feeNative = parseFloat(res.feeNative) || 0;
    const feeSymbol = res.feeSymbol || 'ETH';
    const feeUsd = feeNative * tokenUsdPrice(feeSymbol);
    const amountNum = parseFloat(amount) || 0;
    const amountUsd = amountNum * tokenUsdPrice(token);
    const totalUsd = amountUsd + (token === feeSymbol ? feeNative * tokenUsdPrice(token) : feeUsd);

    feeEl.textContent = `~${formatBalanceDisplay(res.feeNative)} ${feeSymbol}`;
    if (feeUsdEl) feeUsdEl.textContent = `≈ ${formatUsdDisplay(feeUsd)}`;
    if (totalEl) totalEl.textContent = `≈ ${formatUsdDisplay(totalUsd)}`;
    if (noteEl) {
      noteEl.textContent =
        token === feeSymbol
          ? 'Amount + gas in same coin'
          : `Gas paid in ${feeSymbol}`;
    }
  } catch {
    feeEl.textContent = '—';
    if (feeUsdEl) feeUsdEl.textContent = 'Enter valid address';
    if (totalEl) {
      const amountNum = parseFloat(amount) || 0;
      totalEl.textContent = `≈ ${formatUsdDisplay(amountNum * tokenUsdPrice(token))}`;
    }
  }
}

async function validateSendAddress() {
  const addr = document.getElementById('send-address').value;
  const errEl = document.getElementById('send-address-error');
  if (addr.length < 6) {
    errEl.classList.remove('show');
    return;
  }
  try {
    const res = await msg('VALIDATE_ADDRESS', { address: addr, chain: state.sendChain || state.activeChain });
    if (!res.isValid) errEl.classList.add('show');
    else errEl.classList.remove('show');
  } catch {
    errEl.classList.add('show');
  }
}

async function sendTransaction() {
  const toEl = document.getElementById('send-address');
  const amountEl = document.getElementById('send-amount');
  const to = toEl?.value?.trim() || '';
  const amountStr = amountEl?.value?.trim() || '';
  const errEl = document.getElementById('send-error');
  errEl.textContent = '';
  errEl.classList.remove('show');

  if (!to) {
    errEl.textContent = 'Enter the recipient address';
    errEl.classList.add('show');
    toEl?.focus();
    return;
  }

  const amount = parseFloat(amountStr);
  if (!amountStr || !Number.isFinite(amount) || amount <= 0) {
    errEl.textContent = 'Enter an amount greater than zero';
    errEl.classList.add('show');
    amountEl?.focus();
    return;
  }

  const available = state.maxBalance || 0;
  if (amount > available * 1.000001) {
    errEl.textContent = `Insufficient balance (available: ${formatBalanceDisplay(String(available))} ${state.activeToken})`;
    errEl.classList.add('show');
    return;
  }

  const btn = document.getElementById('btn-send');
  const chain = state.sendChain || state.activeChain;
  const fromAddr = state.addresses?.[chain];
  if (fromAddr && to.trim().toLowerCase() === fromAddr.toLowerCase()) {
    errEl.textContent = 'Cannot send to your own address.';
    errEl.classList.add('show');
    return;
  }

  await withButtonLoading(btn, 'Broadcasting...', async () => {
    try {
      const res = await msg('SEND_TRANSACTION', {
        to,
        amount: amountStr,
        chain,
        token: state.activeToken,
      });
      showToast(`Sent ${amountStr} ${state.activeToken} — ${shortAddr(res.txHash)}`);
      document.getElementById('send-address').value = '';
      document.getElementById('send-amount').value = '';
      showScreen('screen-main');
      await loadWalletData();
    } catch (e) {
      errEl.textContent = formatSendError(e);
      errEl.classList.add('show');
    }
  });
}

// ── Receive ────────────────────────────────────────────────────
const chainTokenNotes = {
  ethereum: 'ERC-20 tokens or ETH',
  polygon:  'Polygon tokens or MATIC',
  arbitrum: 'Arbitrum tokens or ETH',
  bsc:      'BEP-20 tokens or BNB',
  bitcoin:  'Bitcoin (BTC) only — native SegWit (bc1)',
  solana:   'Solana (SOL) or SPL tokens',
};

async function ensureChainAddress(chain) {
  const cached = state.addresses?.[chain];
  if (cached && cached !== '—') return cached;
  try {
    const res = await msg('GET_CHAIN_ADDRESS', { chain });
    if (res.address) {
      state.addresses = state.addresses || {};
      state.addresses[chain] = res.address;
      return res.address;
    }
  } catch (e) {
    showToast(e.message || `Could not load ${chain} address`);
  }
  return null;
}

async function syncReceiveUi() {
  const chain = state.currentReceiveChain || state.activeChain;
  const meta = getNetworkMeta(chain);
  const chip = document.querySelector(`#screen-receive [data-chain="${chain}"]`);
  document.querySelectorAll('#screen-receive .chain-chip').forEach((c) => c.classList.remove('active'));
  if (chip) chip.classList.add('active');

  const labelEl = document.getElementById('receive-chain-label');
  const noteEl = document.getElementById('receive-token-note');
  const recvEl = document.getElementById('receive-address');
  if (labelEl) labelEl.textContent = `${meta.name} address`;
  if (noteEl) noteEl.textContent = chainTokenNotes[chain] || '';
  if (recvEl) recvEl.textContent = 'Loading…';

  const addr = await ensureChainAddress(chain);
  if (recvEl) recvEl.textContent = addr || '—';
  renderReceiveQr();
}

async function selectReceiveChain(el, chain) {
  state.currentReceiveChain = chain;
  document.querySelectorAll('#screen-receive .chain-chip').forEach((c) => c.classList.remove('active'));
  el.classList.add('active');
  await syncReceiveUi();
}

function copyAddress() {
  const chain = state.currentReceiveChain || state.activeChain;
  const addr = state.addresses?.[chain];
  if (!addr || addr === '—') {
    showToast('Address not loaded — wait or try again');
    return;
  }
  navigator.clipboard.writeText(addr).then(() => showToast('Address copied'));
}

// ── Accounts ───────────────────────────────────────────────────
async function refreshAccountsList() {
  const list = document.getElementById('accounts-list');
  if (!list) return;

  list.innerHTML =
    '<div class="text-muted" style="padding:16px;text-align:center">Loading accounts…</div>';

  let activeIdx = state.activeAccountIndex ?? 0;
  try {
    const status = await syncWalletStatus();
    activeIdx = status.activeAccountIndex ?? activeIdx;
    state.activeAccountIndex = activeIdx;
  } catch {
    /* use last known index */
  }

  let rows = [];
  try {
    const accRes = await msg('GET_ACCOUNTS', { chain: state.activeChain });
    rows = (accRes.accounts || []).map((a, i) => ({
      name: `Account ${i + 1}`,
      addr: shortAddr(a.address),
      active: i === activeIdx,
    }));
  } catch (e) {
    list.innerHTML = `<div class="text-muted" style="padding:16px;text-align:center">${escapeHtml(e.message || 'Could not load accounts')}</div>`;
    return;
  }

  if (!rows.length) {
    list.innerHTML =
      '<div class="text-muted" style="padding:16px;text-align:center">No accounts yet. Tap + to add one.</div>';
    return;
  }

  list.innerHTML = rows
    .map(
      (acc, i) => `
    <div class="settings-item account-row ${acc.active ? 'account-row-active' : ''}" data-action="switch-account" data-index="${i}" role="button" tabindex="0" title="Switch to ${escapeHtml(acc.name)}">
      <div class="settings-item-left">
        <span class="settings-item-icon">👤</span>
        <div>
          <div class="settings-item-label">${escapeHtml(acc.name)} ${acc.active ? '<span style="color:var(--accent);font-size:10px">● Active</span>' : ''}</div>
          <div class="settings-item-sub text-mono">${escapeHtml(acc.addr)}</div>
        </div>
      </div>
      <span class="settings-item-right">›</span>
    </div>
  `
    )
    .join('');
}

async function switchToAccount(index) {
  const i = Number(index);
  if (!Number.isInteger(i) || i < 0) return;

  if (i === state.activeAccountIndex) {
    showScreen('screen-main');
    showToast(`Already on Account ${i + 1}`);
    return;
  }

  try {
    const res = await msg('SWITCH_ACCOUNT', { index: i });
    state.activeAccountIndex = res.activeAccountIndex ?? i;
    showToast(`Switched to Account ${i + 1}`);
    showScreen('screen-main');
    await loadWalletData();
  } catch (e) {
    showToast(e.message || 'Could not switch account');
  }
}

async function addAccount() {
  try {
    const res = await msg('ADD_ACCOUNT');
    showToast(`Account ${res.accountCount} added`);
    await refreshAccountsList();
    await loadWalletData();
  } catch (e) {
    showToast(e.message || 'Could not add account');
  }
}

// ── Seed Reveal ────────────────────────────────────────────────
async function revealSeed() {
  const pw = document.getElementById('reveal-password').value;
  const errEl = document.getElementById('reveal-error');
  const btn = document.querySelector('#screen-seed-reveal [data-action="reveal-seed"]');
  errEl.classList.remove('show');

  await withButtonLoading(btn, 'Verifying...', async () => {
    try {
      const res = await msg('GET_SEED_PHRASE', { password: pw });
      state.currentSeedPhrase = res.mnemonic;
      displaySeedPhrase(res.mnemonic, 'seed-reveal-grid');
      document.getElementById('seed-reveal-auth').style.display = 'none';
      document.getElementById('seed-reveal-show').style.display = 'block';
    } catch {
      errEl.classList.add('show');
    }
  });
}

// ── Change Password ────────────────────────────────────────────
async function changePassword() {
  const current = document.getElementById('cp-current').value;
  const next = document.getElementById('cp-new').value;
  const confirm = document.getElementById('cp-confirm').value;
  const errEl = document.getElementById('cp-error');
  const btn = document.querySelector('#screen-change-password [data-action="change-password"]');

  if (next.length < 8) {
    errEl.textContent = 'New password must be at least 8 characters';
    errEl.classList.add('show');
    return;
  }
  if (next !== confirm) {
    errEl.textContent = 'Passwords do not match';
    errEl.classList.add('show');
    return;
  }
  errEl.classList.remove('show');

  await withButtonLoading(btn, 'Updating...', async () => {
    try {
      await msg('CHANGE_PASSWORD', { currentPassword: current, newPassword: next });
      ['cp-current', 'cp-new', 'cp-confirm'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      showToast('Password updated');
      showScreen('screen-settings');
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.add('show');
    }
  });
}

// ── Reset Wallet ───────────────────────────────────────────────
async function resetWallet() {
  const btn = document.querySelector('#screen-reset-confirm [data-action="reset-wallet"]');
  await withButtonLoading(btn, 'Resetting...', async () => {
    try {
      await msg('RESET_WALLET');
      state.currentSeedPhrase = null;
      state.balances = {};
      state.addresses = {};
      state.sendChain = null;
      state.hasWallet = false;
      state.isUnlocked = false;
      showScreen('screen-welcome');
      showToast('Wallet reset — create or import a new wallet');
    } catch (e) {
      showToast(e.message || 'Reset failed');
    }
  });
}

// ── Toast ──────────────────────────────────────────────────────
function showToast(message) {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: var(--accent); color: #000; padding: 10px 20px;
    border-radius: 20px; font-size: 12px; font-weight: 600;
    z-index: 9999; white-space: nowrap; animation: fadeIn 0.2s ease;
    box-shadow: 0 4px 20px rgba(0,229,160,0.3);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ── Listen for session expired ─────────────────────────────────
try {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SESSION_EXPIRED') {
      state.isUnlocked = false;
      showScreen('screen-unlock');
      showToast('Session expired — unlock again');
    }
  });
} catch {}

function shortAddr(addr) {
  if (!addr || addr.length < 12) return addr || '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

// ── Boot ───────────────────────────────────────────────────────


function bindUi() {
  const createPw = document.getElementById('create-password');
  if (createPw) createPw.addEventListener('input', (e) => checkPasswordStrength(e.target.value));
  const sendAddr = document.getElementById('send-address');
  if (sendAddr) sendAddr.addEventListener('input', validateSendAddress);
  const unlockPw = document.getElementById('unlock-password');
  if (unlockPw) {
    unlockPw.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') unlockWallet();
    });
  }
  const importConfirm = document.getElementById('import-password-confirm');
  if (importConfirm) {
    importConfirm.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') importWallet();
    });
  }
  document.getElementById('app').addEventListener('click', handleUiClick);
}

function handleUiClick(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action } = el.dataset;
  switch (action) {
    case 'nav':
      guardedNav(el.dataset.target);
      break;
    case 'generate-wallet':
      generateWallet();
      break;
    case 'import-wallet':
      importWallet();
      break;
    case 'replace-wallet':
      replaceWallet();
      break;
    case 'unlock-wallet':
      unlockWallet();
      break;
    case 'lock':
      lockAndGoHome();
      break;
    case 'confirm-seed':
      confirmSeedWritten();
      break;
    case 'copy-seed':
      copySeedPhrase(el.dataset.mode || 'create');
      break;
    case 'copy-address':
      copyAddress();
      break;
    case 'reveal-seed':
      revealSeed();
      break;
    case 'change-password':
      changePassword();
      break;
    case 'reset-wallet':
      resetWallet();
      break;
    case 'add-account':
      addAccount();
      break;
    case 'send-transaction':
      sendTransaction();
      break;
    case 'switch-tab':
      switchTab(el.dataset.tab);
      break;
    case 'switch-account':
      switchToAccount(Number(el.dataset.index));
      break;
    case 'select-send-token':
      selectSendToken(el, el.dataset.token);
      break;
    case 'select-chip':
      selectChip(el, el.dataset.chain);
      break;
    case 'reset-cancel':
      showScreen(state.resetReturnScreen || 'screen-settings');
      break;
    case 'select-receive-chain':
      selectReceiveChain(el, el.dataset.chain);
      break;
    case 'select-network':
      selectNetwork(el.dataset.chain, el.dataset.name);
      break;
    case 'set-max':
      e.preventDefault();
      setMaxAmount(parseFloat(el.dataset.pct));
      break;
    case 'open-url':
      window.open(el.dataset.url);
      break;
    case 'open-escrow':
      chrome.tabs.create({ url: chrome.runtime.getURL('escrow/index.html') });
      break;
    case 'refresh-portfolio':
      refreshPortfolio();
      break;
    case 'copy-main-address':
      copyMainAddress();
      break;
    case 'open-explorer-address':
      openExplorerAddress();
      break;
    case 'open-explorer-tx':
      if (el.dataset.hash) openExplorerTx(el.dataset.hash);
      break;
    case 'open-asset-sheet':
      openAssetSheet(el.dataset.token);
      break;
    case 'close-asset-sheet':
      closeAssetSheet();
      break;
    case 'asset-go-send':
      goAssetSend();
      break;
    case 'asset-go-receive':
      goAssetReceive();
      break;
    default:
      break;
  }
}

bindUi();
init();
