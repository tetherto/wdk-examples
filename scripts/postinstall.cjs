'use strict'

const fs = require('fs')
const { createRequire } = require('module')
const path = require('path')

// Resolve @bermuda/sdk build directory - handles npm hoisting.
let sdkBuildSrc
try {
  const projectRequire = createRequire(path.join(process.cwd(), 'package.json'))
  const entry = projectRequire.resolve('@bermuda/sdk')
  const sdkRoot = path.resolve(entry, '..', '..', '..')
  sdkBuildSrc = path.join(sdkRoot, 'build', 'src')
  if (!fs.existsSync(sdkBuildSrc)) {
    console.log('postinstall: @bermuda/sdk build/src not found, skipping')
    process.exit(0)
  }
} catch {
  console.log('postinstall: @bermuda/sdk not resolved, skipping')
  process.exit(0)
}

// --- utils.js patches ---
const utilsPath = path.join(sdkBuildSrc, 'utils.js')
let utils = fs.readFileSync(utilsPath, 'utf8')
let utilsChanged = false

// 1. fetchComplianceBlackList: graceful fallback on failure
if (!utils.includes('using empty blacklist')) {
  const orig =
    'async function ze(e){const t=`${e.replace(/\\/$/,"")}/blacklist`,' +
    'n=await fetch(t);if(!n.ok)throw new Error(`Fetching compliance ' +
    'blacklist failed with ${n.status}`);return await n.json()}'
  const fix =
    'async function ze(e){const t=`${e.replace(/\\/$/,"")}/blacklist`;' +
    'try{const n=await fetch(t);if(!n.ok)throw new Error(`Fetching ' +
    'compliance blacklist failed with ${n.status}`);return await n.json()' +
    '}catch(n){return console.warn(`fetchComplianceBlackList: ${n.message}' +
    ' \\u2013 using empty blacklist`),{blacklist:[]}}}'
  if (utils.includes(orig)) {
    utils = utils.replace(orig, fix)
    utilsChanged = true
    console.log('postinstall: patched fetchComplianceBlackList fallback')
  }
}

// 2. queryFilterBatched: 200ms throttle between batches
if (!utils.includes('setTimeout(w,200)')) {
  const orig =
    'if(s=[...s,...u],i+=o,i>=t)break}return s}'
  const fix =
    'if(s=[...s,...u],i+=o,i>=t)break;' +
    'await new Promise(w=>setTimeout(w,200))}return s}'
  if (utils.includes(orig)) {
    utils = utils.replace(orig, fix)
    utilsChanged = true
    console.log('postinstall: patched queryFilterBatched throttle')
  }
}

if (utilsChanged) fs.writeFileSync(utilsPath, utils)

// --- find-utxos.js patch ---
const fuPath = path.join(sdkBuildSrc, 'find-utxos.js')
let fu = fs.readFileSync(fuPath, 'utf8')

// 3. findUtxos: sequential isSpent instead of Promise.all burst
if (!fu.includes('for(const n of w.events)')) {
  const orig =
    'const b=await Promise.all(w.events.map(async n=>{let e;' +
    'try{e=(await F.decrypt(S,n.encryptedOutput,BigInt(n.index),x)).utxo}' +
    'catch{}if(e){if(e.amount.toString()==="0")return null;' +
    'const s=v(e.token).toLowerCase();' +
    'if(D&&!e.keypair.privkey)return null;' +
    'if(B){const t=await e.getNullifier().then(i=>v(i,32));' +
    'if(await f.isSpent(t))return null}' +
    'return[s,e]}else return null}))' +
    '.then(n=>n.filter(Boolean))' +
    '.then(n=>n.reduce((e,[s,t])=>' +
    '(Array.isArray(e[s])?e[s].push(t):e[s]=[t],e),{}))'
  const fix =
    'const b=await(async()=>{const _r=[];for(const n of w.events){let e;' +
    'try{e=(await F.decrypt(S,n.encryptedOutput,BigInt(n.index),x)).utxo}' +
    'catch{}if(e){if(e.amount.toString()==="0")continue;' +
    'const s=v(e.token).toLowerCase();' +
    'if(D&&!e.keypair.privkey)continue;' +
    'if(B){const t=await e.getNullifier().then(i=>v(i,32));' +
    'if(await f.isSpent(t))continue}' +
    '_r.push([s,e])}}' +
    'return _r.reduce((e,[s,t])=>' +
    '(Array.isArray(e[s])?e[s].push(t):e[s]=[t],e),{})})()'
  if (fu.includes(orig)) {
    fu = fu.replace(orig, fix)
    fs.writeFileSync(fuPath, fu)
    console.log('postinstall: patched findUtxos sequential isSpent')
  }
}
