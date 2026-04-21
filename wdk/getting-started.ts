/**
 * WDK Core Example: Getting Started
 *
 * Demonstrates: Generating a seed phrase, validating it, and creating
 * WDK instances from both new and existing seeds.
 *
 * Run: npx tsx wdk/getting-started.ts
 */

import WDK from '@tetherto/wdk'
import { loadWdkConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadWdkConfig()

  logSection('Getting Started')

  const generatedSeed = WDK.getRandomSeedPhrase()
  logResult('Generated Seed', {
    isValid: WDK.isValidSeed(generatedSeed),
    wordCount: generatedSeed.split(' ').length,
  })

  const generatedWdk = new WDK(generatedSeed)
  logResult('Fresh Instance', {
    createdFromGeneratedSeed: generatedWdk instanceof WDK,
  })

  const restoredWdk = new WDK(config.seedPhrase)
  logResult('Restored Instance', {
    createdFromExistingSeed: restoredWdk instanceof WDK,
    isExistingSeedValid: WDK.isValidSeed(config.seedPhrase),
  })

  generatedWdk.dispose()
  restoredWdk.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
