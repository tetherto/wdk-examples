/**
 * Chrome extension service workers have no Node.js globals.
 * WDK crypto deps (b4a, wasm hashes) expect Buffer and process.
 */
import { Buffer } from 'buffer';
import process from 'process/browser.js';

globalThis.Buffer = Buffer;
globalThis.process = process;
