'use strict'
/**
 * Thin wrapper that loads .env into process.env before invoking electron-builder.
 * Required because electron-builder's CLI doesn't auto-load .env.
 */
const path = require('path')
const { execFileSync } = require('child_process')

// Load .env (non-destructive — process.env wins)
const envPath = path.resolve(__dirname, '../.env')
try {
  const fs = require('fs')
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx < 1) continue
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      if (!(key in process.env)) process.env[key] = val
    }
  }
} catch {
  // .env is optional in CI
}

const builderCli = require.resolve('electron-builder/cli.js')
const args = process.argv.slice(2)
execFileSync(process.execPath, [builderCli, ...args], { stdio: 'inherit' })
