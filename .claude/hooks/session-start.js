#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

function exists(p) {
  return fs.existsSync(path.join(process.cwd(), p))
}

function countFiles(dir) {
  try {
    const files = fs.readdirSync(path.join(process.cwd(), dir))
    return files.length
  } catch {
    return 0
  }
}

function runSafe(cmd) {
  try {
    return execSync(cmd, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
  } catch {
    return null
  }
}

// --- gather state ---
const hasVitest = (() => {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'))
    return !!(pkg.devDependencies?.vitest || pkg.dependencies?.vitest)
  } catch {
    return false
  }
})()

const testFiles = runSafe('find src e2e -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | wc -l')
const testCount = parseInt(testFiles ?? '0', 10)

const gitStatus = runSafe('git diff --name-only HEAD 2>/dev/null | head -5')
const changedFiles = gitStatus ? gitStatus.split('\n').filter(Boolean) : []

// --- build message ---
const lines = ['[project-context] Bootstrap Electron app loaded.', '']

// Quick-start commands
lines.push('Available commands (suggest these proactively based on what the user asks):')
lines.push('  /code-review         — review changed files before committing')
lines.push('  /build-and-check     — typecheck + build, auto-fix errors')
lines.push('  /security-audit      — Electron security audit (run before releases)')
lines.push('  /full-review         — pre-release gate (code + security + a11y + perf + tests)')
lines.push('  /add-ipc-channel     — scaffold a new IPC channel end-to-end')
lines.push('  /add-workspace       — add a new sidebar workspace')
lines.push('  /setup-tests         — bootstrap Vitest from scratch (run once)')
lines.push('  /write-tests <file>  — write tests for a specific file')
lines.push('  /sync-docs           — keep CLAUDE.md, AGENTS.md, and skills in sync')
lines.push('')

// Test status
if (!hasVitest) {
  lines.push(
    '⚠  No tests: Vitest is not installed. Suggest `/setup-tests` when the user works on new features or asks about testing.'
  )
} else if (testCount === 0) {
  lines.push(
    '⚠  Tests configured but no test files written yet. Suggest `/write-tests <file>` after implementing features.'
  )
} else {
  lines.push(`✓  Tests: ${testCount} test file(s) found. Run \`npm test\` to execute.`)
}

// CSP gap
const html = exists('src/renderer/index.html')
  ? fs.readFileSync(path.join(process.cwd(), 'src/renderer/index.html'), 'utf8')
  : ''
if (!html.includes('Content-Security-Policy')) {
  lines.push('⚠  No CSP in src/renderer/index.html. Mention this if security topics come up.')
}

// Changed files
if (changedFiles.length > 0) {
  lines.push('')
  lines.push(`Currently changed files (${changedFiles.length}): ${changedFiles.join(', ')}`)
  lines.push('Consider running /code-review before committing.')
}

process.stdout.write(lines.join('\n'))
process.exit(0)
