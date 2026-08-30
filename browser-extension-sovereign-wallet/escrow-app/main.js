/**
 * Sovereign Escrow OTC — Create / Join only (deploy docs on GitHub)
 */
import {
  CREATE_STEPS,
  JOIN_STEPS,
  EVM_CHAIN_KEYS,
  chainLabel,
  explorerForChain,
  formatComingSoonLabels,
} from './guide-data.js';

let chainKey = 'bsc';
let config = {};
let userAddress = '';
let walletUnlocked = false;
let hasWallet = false;
let activeTab = 'create';
let currentDeal = null;

const $ = (id) => document.getElementById(id);

function msg(type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (response?.error) reject(new Error(response.error));
      else resolve(response || {});
    });
  });
}

function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
}

function shortAddr(a) {
  if (!a || a.length < 10) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function explorerBase() {
  return config.explorer || explorerForChain(chainKey);
}

function formatUsdt(raw) {
  const d = config.usdtDecimals ?? 6;
  const n = Number(raw) / 10 ** d;
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 6 }) : raw;
}

function guideContext() {
  const counterparty = $('create-counterparty')?.value?.trim() || '';
  const usdt = $('create-usdt')?.value?.trim() || '';
  const token = $('create-token')?.value?.trim() || '';
  const createFormValid =
    /^0x[a-fA-F0-9]{40}$/.test(counterparty) &&
    /^0x[a-fA-F0-9]{40}$/.test(token) &&
    usdt &&
    $('create-token-amount')?.value?.trim();

  return {
    config,
    walletUnlocked,
    hasWallet,
    createFormValid,
    hasDealAddress: /^0x[a-fA-F0-9]{40}$/.test($('join-deal')?.value?.trim() || ''),
    deal: currentDeal,
  };
}

function renderWizard(listId, steps) {
  const ul = $(listId);
  if (!ul) return;
  const ctx = guideContext();
  ul.innerHTML = '';

  let currentIdx = steps.findIndex((s) => !(typeof s.check === 'function' && s.check(ctx)));
  if (currentIdx < 0) currentIdx = steps.length - 1;

  steps.forEach((step, i) => {
    const done = typeof step.check === 'function' && step.check(ctx);
    const li = document.createElement('li');
    if (done) li.classList.add('done');
    if (i === currentIdx && !done) li.classList.add('current');
    li.innerHTML = `
      <span class="step-num">${done ? '✓' : i + 1}</span>
      <div class="step-body">
        <div class="step-title">${step.title}</div>
      </div>
    `;
    ul.appendChild(li);
  });
}

function countDone(steps) {
  const ctx = guideContext();
  return steps.filter((s) => typeof s.check === 'function' && s.check(ctx)).length;
}

function updateProgress() {
  const maps = {
    create: { steps: CREATE_STEPS, title: 'Create OTC' },
    join: { steps: JOIN_STEPS, title: 'Join deal' },
  };
  const m = maps[activeTab] || maps.create;
  const done = countDone(m.steps);
  const total = m.steps.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  $('progress-title').textContent = m.title;
  $('progress-count').textContent = `${done} / ${total}`;
  $('progress-fill').style.width = `${pct}%`;
  updateStepBanner(m.steps);
}

function updateStepBanner(steps) {
  const banner = $('step-banner');
  const ctx = guideContext();
  const next = steps.find((s) => !(typeof s.check === 'function' && s.check(ctx)));

  if (!next) {
    banner.classList.add('hidden');
    return;
  }

  banner.classList.remove('hidden');
  if (activeTab === 'join' && currentDeal) {
    banner.textContent = joinNextActionText(currentDeal);
  } else {
    banner.textContent = `Next: ${next.title}`;
  }
}

function joinNextActionText(deal) {
  if (!walletUnlocked) return 'Unlock Sovereign Wallet in the extension popup first.';
  if (deal.state === 'PendingAccept') {
    if (!deal.buyerAccepted || !deal.sellerAccepted) return 'Both parties must accept terms on-chain.';
    return 'Accepted — proceed to deposits.';
  }
  if (deal.state === 'Open') {
    if (!deal.usdtDeposited) return 'Buyer: approve USDT + deposit.';
    if (!deal.tokenDeposited) return 'Seller: approve token + deposit.';
    return 'Both deposited — settle or wait for auto-settle.';
  }
  if (deal.state === 'Settled') return 'Swap complete.';
  return `Status: ${deal.state}`;
}

function renderProtocolInfo() {
  const el = $('protocol-info');
  if (!el) return;
  if (!config.deployed) {
    el.classList.add('hidden');
    return;
  }
  el.classList.remove('hidden');
  const fee = config.feeRecipient || '—';
  const bps = config.feeBps ?? 0;
  const pct = (bps / 100).toFixed(2);
  const base = explorerBase();
  el.innerHTML = `
    <div class="row"><span>Factory</span><a class="mono link" href="${base}/address/${config.factory}" target="_blank" rel="noopener">${shortAddr(config.factory)}</a></div>
    <div class="row"><span>Registry</span><a class="mono link" href="${base}/address/${config.registry}" target="_blank" rel="noopener">${shortAddr(config.registry)}</a></div>
    <div class="row"><span>Protocol fee</span><span>${bps} bps (${pct}% of USDT)</span></div>
    <div class="row"><span>Fee wallet</span><a class="mono link" href="${base}/address/${fee}" target="_blank" rel="noopener">${shortAddr(fee)}</a></div>
    <p class="fee-note">Fees arrive in USDT when a deal settles.</p>
  `;
}

function renderAllWizards() {
  renderWizard('create-wizard', CREATE_STEPS);
  renderWizard('join-wizard', JOIN_STEPS);
  updateProgress();
}

async function loadConfig() {
  try {
    const res = await fetch(chrome.runtime.getURL('escrow.json'));
    if (res.ok) {
      const json = await res.json();
      if (json.defaultNetwork) chainKey = json.defaultNetwork;
      await msg('ESCROW_INIT_CONFIG', { json });
    }
  } catch {
    /* defaults */
  }
  await refreshChainConfig();
}

async function refreshChainConfig() {
  let c;
  try {
    const res = await msg('ESCROW_GET_CONFIG', { chainKey });
    c = res.config || res;
  } catch (e) {
    toast(e.message || 'Could not load escrow config');
    c = {
      chainKey,
      name: chainLabel(chainKey),
      deployed: false,
      evmChains: [...EVM_CHAIN_KEYS],
      evmDeployStatus: {},
    };
  }

  config = c;
  chainKey = c.chainKey || chainKey;

  populateChainSelect(resolveChainList(c.evmChains), c.evmDeployStatus || {});

  $('network-label').textContent = `${c.name || chainLabel(chainKey)} · chainId ${c.chainId ?? '—'}`;

  const warn = $('deploy-hint');
  const ok = $('deploy-ok');

  if (c.deployed) {
    warn.classList.add('hidden');
    ok.classList.remove('hidden');
    ok.textContent = `Live on ${chainLabel(chainKey)} · factory ${shortAddr(c.factory)}`;
  } else {
    ok.classList.add('hidden');
    warn.classList.remove('hidden');
    warn.textContent = `Escrow factory not deployed on ${chainLabel(chainKey)} yet. Use BSC or deploy per GitHub docs.`;
  }

  const soon = $('coming-soon');
  if (c.comingSoon?.length) {
    soon.textContent = `Coming soon (non-EVM): ${formatComingSoonLabels(c.comingSoon)}`;
  } else {
    soon.textContent = '';
  }

  renderProtocolInfo();
  renderAllWizards();
}

function resolveChainList(chains) {
  if (Array.isArray(chains) && chains.length > 0) return chains;
  return [...EVM_CHAIN_KEYS];
}

function populateChainSelect(chains, deployStatus = {}) {
  const sel = $('chain-select');
  if (!sel) return;
  const list = resolveChainList(chains);
  const prev = sel.value || chainKey;
  sel.innerHTML = '';
  for (const key of list) {
    const opt = document.createElement('option');
    opt.value = key;
    const live = deployStatus[key] === true;
    opt.textContent = live ? `${chainLabel(key)} · live` : `${chainLabel(key)} · pending`;
    if (key === chainKey || key === prev) opt.selected = true;
    sel.appendChild(opt);
  }
  if (!sel.value && list.length) {
    sel.value = list.includes(chainKey) ? chainKey : list[0];
    chainKey = sel.value;
  }
}

async function refreshWalletPill() {
  const status = $('wallet-status');
  if (!status) return;
  try {
    const st = await msg('WALLET_STATUS');
    hasWallet = st.hasWallet;
    walletUnlocked = st.isUnlocked;
    if (!hasWallet) {
      status.textContent = 'Create wallet in popup';
      status.title = 'Open Sovereign Wallet extension → create or import';
      return;
    }
    if (!walletUnlocked) {
      status.textContent = 'Unlock wallet';
      status.title = 'Open Sovereign Wallet popup and enter password';
      return;
    }
    status.textContent = 'Wallet unlocked';
    status.title = 'Loading account…';
  } catch (e) {
    status.textContent = 'Wallet unavailable';
    status.title = e.message || 'Reload extension';
  }
}

async function ensureWallet() {
  const status = $('wallet-status');
  await refreshWalletPill();

  if (!hasWallet || !walletUnlocked) {
    renderAllWizards();
    return false;
  }

  try {
    const { accounts } = await msg('GET_ACCOUNTS', { chain: chainKey });
    if (!accounts?.[0]) {
      status.textContent = 'No account';
      renderAllWizards();
      return false;
    }
    userAddress = (accounts[0].address || accounts[0]).toLowerCase();
    status.textContent = shortAddr(userAddress);
    status.title = userAddress;
  } catch {
    status.textContent = 'Wallet error';
    renderAllWizards();
    return false;
  }

  renderAllWizards();
  return true;
}

async function sendContractTx(to, data) {
  const { txHash } = await msg('ESCROW_SEND_TX', { chainKey, to, data, value: '0' });
  toast(`Tx sent: ${txHash.slice(0, 14)}…`);
  return txHash;
}

async function encodeDealCall(dealAddress, fn, args = []) {
  const { data } = await msg('ESCROW_DEAL_CALL', { dealAddress, fn, args });
  return data;
}

async function readDeal(dealAddress) {
  const { deal } = await msg('ESCROW_GET_DEAL', { dealAddress, chainKey });
  return deal;
}

function renderJoinHint(deal) {
  const el = $('join-next-hint');
  el.classList.remove('hidden');
  el.textContent = joinNextActionText(deal);
}

function renderDeal(deal) {
  currentDeal = deal;
  const card = $('join-summary');
  const actions = $('join-actions');
  card.classList.remove('hidden');
  actions.classList.remove('hidden');
  renderJoinHint(deal);

  card.innerHTML = `
    <div class="row"><span>Status</span><strong>${deal.state}</strong></div>
    <div class="row"><span>Network</span><span>${deal.network}</span></div>
    <div class="row"><span>Buyer</span><span class="mono">${shortAddr(deal.terms.buyer)}</span></div>
    <div class="row"><span>Seller</span><span class="mono">${shortAddr(deal.terms.seller)}</span></div>
    <div class="row"><span>USDT</span><span>${formatUsdt(deal.terms.usdtAmount)}</span></div>
    <div class="row"><span>Token</span><span class="mono">${shortAddr(deal.terms.tradeToken)}</span></div>
    <div class="row"><span>Accepted</span><span>B ${deal.buyerAccepted} · S ${deal.sellerAccepted}</span></div>
    <div class="row"><span>Deposited</span><span>USDT ${deal.usdtDeposited} · token ${deal.tokenDeposited}</span></div>
  `;

  actions.innerHTML = '';
  const add = (label, fn, primary = false) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `btn${primary ? ' primary' : ''}`;
    b.textContent = label;
    b.onclick = () => fn().catch((e) => toast(e.message));
    actions.appendChild(b);
  };

  const isBuyer = userAddress === deal.terms.buyer.toLowerCase();
  const isSeller = userAddress === deal.terms.seller.toLowerCase();

  if (deal.state === 'PendingAccept') {
    if ((isBuyer && !deal.buyerAccepted) || (isSeller && !deal.sellerAccepted)) {
      add('Accept terms', async () => {
        const data = await encodeDealCall(deal.dealAddress, 'acceptTerms');
        await sendContractTx(deal.dealAddress, data);
        await refreshDeal(deal.dealAddress);
      }, true);
    }
  }

  if (deal.state === 'Open' && isBuyer && !deal.usdtDeposited) {
    add('Approve USDT + deposit', async () => {
      const { data: approveData } = await msg('ESCROW_ENCODE_ERC20_APPROVE', {
        spender: deal.dealAddress,
        amount: deal.terms.usdtAmount,
      });
      await sendContractTx(deal.terms.usdt, approveData);
      const dep = await encodeDealCall(deal.dealAddress, 'depositUsdt');
      await sendContractTx(deal.dealAddress, dep);
      await refreshDeal(deal.dealAddress);
    }, true);
  }

  if (deal.state === 'Open' && isSeller && !deal.tokenDeposited) {
    add('Approve token + deposit', async () => {
      const { data: approveData } = await msg('ESCROW_ENCODE_ERC20_APPROVE', {
        spender: deal.dealAddress,
        amount: deal.terms.tokenAmount,
      });
      await sendContractTx(deal.terms.tradeToken, approveData);
      const dep = await encodeDealCall(deal.dealAddress, 'depositToken');
      await sendContractTx(deal.dealAddress, dep);
      await refreshDeal(deal.dealAddress);
    }, true);
  }

  if (deal.state === 'Open' && deal.usdtDeposited && deal.tokenDeposited) {
    add('Settle', async () => {
      const data = await encodeDealCall(deal.dealAddress, 'settle');
      await sendContractTx(deal.dealAddress, data);
      await refreshDeal(deal.dealAddress);
    }, true);
  }

  if (deal.state === 'Open' || deal.state === 'PendingAccept') {
    add('Claim refund (after deadline)', async () => {
      const data = await encodeDealCall(deal.dealAddress, 'claimRefund');
      await sendContractTx(deal.dealAddress, data);
      await refreshDeal(deal.dealAddress);
    });
    add('Request cancel', async () => {
      const data = await encodeDealCall(deal.dealAddress, 'requestCancel');
      await sendContractTx(deal.dealAddress, data);
      await refreshDeal(deal.dealAddress);
    });
  }

  if (!isBuyer && !isSeller) {
    const p = document.createElement('p');
    p.className = 'hint warn-hint';
    p.textContent = 'Your wallet is not the buyer or seller on this deal.';
    actions.appendChild(p);
  }

  renderAllWizards();
}

async function refreshDeal(addr) {
  const deal = await readDeal(addr);
  renderDeal(deal);
}

function switchTab(tabName) {
  activeTab = tabName;
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });
  document.querySelectorAll('.panel').forEach((p) => {
    p.classList.toggle('active', p.id === `panel-${tabName}`);
  });
  updateProgress();
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

$('chain-select').addEventListener('change', async (e) => {
  chainKey = e.target.value;
  await refreshChainConfig();
  await ensureWallet();
});

['create-counterparty', 'create-usdt', 'create-token', 'create-token-amount'].forEach((id) => {
  $(id)?.addEventListener('input', () => renderAllWizards());
});

$('btn-create').addEventListener('click', async () => {
  if (!(await ensureWallet())) {
    toast('Unlock wallet in extension popup first');
    return;
  }
  if (!config.deployed) {
    toast(`Escrow is not available on ${chainLabel(chainKey)} yet`);
    return;
  }

  const role = $('create-role').value;
  const counterparty = $('create-counterparty').value.trim();
  const usdtAmount = $('create-usdt').value;
  const tradeToken = $('create-token').value.trim();
  const tokenAmount = $('create-token-amount').value;
  const tokenDecimals = Number($('create-token-decimals').value);
  const fundingHours = Number($('create-funding-hours').value);
  const description = $('create-description').value;

  if (!/^0x[a-fA-F0-9]{40}$/.test(counterparty)) {
    toast('Invalid counterparty address');
    return;
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(tradeToken)) {
    toast('Invalid token address');
    return;
  }

  const buyer = (role === 'buyer' ? userAddress : counterparty).toLowerCase();
  const seller = (role === 'seller' ? userAddress : counterparty).toLowerCase();
  const fundingDeadline = Math.floor(Date.now() / 1000) + fundingHours * 3600;

  const { termsHash } = await msg('ESCROW_BUILD_TERMS', {
    buyer,
    seller,
    tradeToken,
    usdtAmount,
    tokenAmount,
    fundingDeadline,
    description,
    chainKey,
  });

  const { data, to } = await msg('ESCROW_CREATE_OTC_TX', {
    buyer,
    seller,
    tradeToken,
    usdtAmountHuman: usdtAmount,
    tokenAmountHuman: tokenAmount,
    tokenDecimals,
    fundingDeadlineUnix: fundingDeadline,
    termsHash,
    chainKey,
  });

  await sendContractTx(to || config.factory, data);
  toast('Deal created — copy deal address from OtcDealCreated, then Join tab');
  switchTab('join');
});

$('btn-load-deal').addEventListener('click', async () => {
  if (!(await ensureWallet())) return;
  const addr = $('join-deal').value.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    toast('Invalid deal address');
    return;
  }
  await refreshDeal(addr);
});

function showInitError(text) {
  const el = $('init-error');
  if (!el) return;
  if (text) {
    el.textContent = text;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

async function init() {
  showInitError('');
  populateChainSelect([...EVM_CHAIN_KEYS]);
  void refreshWalletPill();

  try {
    await loadConfig();
    await ensureWallet();
    switchTab('create');
    renderAllWizards();
  } catch (err) {
    populateChainSelect([...EVM_CHAIN_KEYS]);
    console.error('Escrow init failed:', err);
    showInitError(
      err.message || 'Failed to start. Reload the extension and unlock the wallet in the popup.'
    );
    toast(err.message || 'Escrow failed to load');
  }
}

init();
