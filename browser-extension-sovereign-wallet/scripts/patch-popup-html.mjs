import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const htmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'popup.html');
let html = fs.readFileSync(htmlPath, 'utf8');

if (!html.includes('id="main-active-address"')) {
  html = html.replace(
    '<div class="balance-amount" id="main-total-balance">—</motion.div>',
    '<div class="balance-amount" id="main-total-balance">—</div>\n      <motion.div class="main-address-line" id="main-active-address">—</div>'
  );
}
