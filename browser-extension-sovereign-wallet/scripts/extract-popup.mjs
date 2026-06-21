import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
let html = fs.readFileSync(path.join(publicDir, 'popup.html'), 'utf8');

const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) throw new Error('no inline script found');
let script = m[1].trim();

html = html.replace(/<script>[\s\S]*<\/script>/, '<script src="popup.js"></script>');

const reps = [
  [/\s+onclick="showScreen\('([^']+)'\)"/g, ' data-action="nav" data-target="$1"'],
  [/\s+onclick="generateWallet\(\)"/g, ' data-action="generate-wallet"'],
  [/\s+onclick="importWallet\(\)"/g, ' data-action="import-wallet"'],
  [/\s+onclick="unlockWallet\(\)"/g, ' data-action="unlock-wallet"'],
  [/\s+onclick="lockAndGoHome\(\)"/g, ' data-action="lock"'],
  [/\s+onclick="confirmSeedWritten\(\)"/g, ' data-action="confirm-seed"'],
  [/\s+onclick="copySeedPhrase\('reveal'\)"/g, ' data-action="copy-seed" data-mode="reveal"'],
  [/\s+onclick="copySeedPhrase\(\)"/g, ' data-action="copy-seed"'],
  [/\s+onclick="copyAddress\(\)"/g, ' data-action="copy-address"'],
  [/\s+onclick="revealSeed\(\)"/g, ' data-action="reveal-seed"'],
  [/\s+onclick="changePassword\(\)"/g, ' data-action="change-password"'],
  [/\s+onclick="resetWallet\(\)"/g, ' data-action="reset-wallet"'],
  [/\s+onclick="addAccount\(\)"/g, ' data-action="add-account"'],
  [/\s+onclick="sendTransaction\(\)"/g, ' data-action="send-transaction"'],
  [/\s+onclick="switchTab\('assets'\)"/g, ' data-action="switch-tab" data-tab="assets"'],
  [/\s+onclick="switchTab\('activity'\)"/g, ' data-action="switch-tab" data-tab="activity"'],
  [/\s+onclick="switchToAccount\((\d+)\)"/g, ' data-action="switch-account" data-index="$1"'],
  [/\s+onclick="selectSendToken\(this,'([^']+)'\)"/g, ' data-action="select-send-token" data-token="$1"'],
  [/\s+onclick="selectChip\(this,'([^']+)'\)"/g, ' data-action="select-chip" data-chain="$1"'],
  [/\s+onclick="selectReceiveChain\(this,'([^']+)'\)"/g, ' data-action="select-receive-chain" data-chain="$1"'],
  [/\s+onclick="selectNetwork\('([^']+)','([^']+)'\)"/g, ' data-action="select-network" data-chain="$1" data-name="$2"'],
  [/\s+onclick="setMaxAmount\(([^)]+)\)"/g, ' data-action="set-max" data-pct="$1"'],
  [/\s+onclick="window\.open\('([^']+)'\)"/g, ' data-action="open-url" data-url="$1"'],
  [/\s+oninput="checkPasswordStrength\(this\.value\)"/g, ''],
  [/\s+oninput="validateSendAddress\(\)"/g, ''],
  [/\s+onkeypress="if\(event\.key==='Enter'\)unlockWallet\(\)"/g, ''],
];

for (const [re, sub] of reps) html = html.replace(re, sub);

// Fix dynamic HTML in loadWalletData
script = script.replace(
  /onclick="selectNetwork\('\$\{n\.id\}','\$\{n\.name\}'\)"/g,
  'data-action="select-network" data-chain="${n.id}" data-name="${n.name}"'
);
script = script.replace(
  /onclick="switchToAccount\(\$\{i\}\)"/g,
  'data-action="switch-account" data-index="${i}"'
);

const bindUi = `
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
  document.getElementById('app').addEventListener('click', handleUiClick);
}

function handleUiClick(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action } = el.dataset;
  switch (action) {
    case 'nav':
      showScreen(el.dataset.target);
      break;
    case 'generate-wallet':
      generateWallet();
      break;
    case 'import-wallet':
      importWallet();
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
    case 'select-receive-chain':
      selectReceiveChain(el, el.dataset.chain);
      break;
    case 'select-network':
      selectNetwork(el.dataset.chain, el.dataset.name);
      break;
    case 'set-max':
      setMaxAmount(parseFloat(el.dataset.pct));
      break;
    case 'open-url':
      window.open(el.dataset.url);
      break;
    default:
      break;
  }
}
`;

script = script.replace(/\ninit\(\);\s*$/, '');
script = script + '\n\n' + bindUi + '\nbindUi();\ninit();\n';

fs.writeFileSync(path.join(publicDir, 'popup.html'), html);
fs.writeFileSync(path.join(publicDir, 'popup.js'), script);

const left = (html.match(/onclick=/g) || []).length;
const leftScript = (script.match(/onclick=/g) || []).length;
console.log('popup.html onclick left:', left);
console.log('popup.js onclick left:', leftScript);
