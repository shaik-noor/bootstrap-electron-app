export const meta = {
  name: 'security-audit',
  description:
    'Full Electron security audit: BrowserWindow config, IPC input validation, preload surface, CSP, and dependency risks',
  whenToUse:
    'Run before any release, after adding IPC channels, or after changing BrowserWindow/webPreferences',
  phases: [
    { title: 'Scan', detail: 'Four parallel audit dimensions' },
    { title: 'Verify', detail: 'Adversarially confirm critical findings' },
    { title: 'Report', detail: 'Synthesise ranked findings' }
  ]
}

const DIMENSIONS = [
  {
    key: 'electron-config',
    prompt:
      'Audit `src/main/index.ts` for Electron security misconfigurations. ' +
      'Check: contextIsolation, nodeIntegration, webSecurity, sandbox, allowRunningInsecureContent, ' +
      'enableRemoteModule. Check setWindowOpenHandler — does it deny popups and validate URLs before shell.openExternal? ' +
      'Check that shell.openExternal is only called with https: or mailto: schemes. ' +
      'Read the full file before reporting.'
  },
  {
    key: 'ipc-validation',
    prompt:
      'Audit all ipcMain handlers in `src/main/index.ts` for missing input validation. ' +
      'For each handler that receives renderer-supplied arguments: does it validate type, shape, and range before ' +
      'using the value? Does it pass any value to DatabaseService, filesystem, or shell without sanitisation? ' +
      'Does any sync handler (`ipcMain.on`) do more than a fast, safe read? Read the full file.'
  },
  {
    key: 'preload-surface',
    prompt:
      'Audit `src/preload/index.ts` for over-exposure via contextBridge. ' +
      'Is the exposed `api` surface the minimum needed? Does anything expose raw `ipcRenderer`, `fs`, `path`, ' +
      'or `child_process` to the renderer? Check `@electron-toolkit/preload` — does it expose `ipcRenderer` on ' +
      '`window.electron`? If so, is that surface used directly in renderer code (check `src/renderer/src/`)? ' +
      'Are all function signatures typed (no `any` on the bridge boundary)?'
  },
  {
    key: 'csp-and-renderer',
    prompt:
      'Audit the renderer for Content Security Policy and injection risks. ' +
      'Read `src/renderer/index.html` — is a CSP meta tag present? ' +
      'Search `src/renderer/src/` for: `dangerouslySetInnerHTML`, `eval(`, `new Function(`, ' +
      '`innerHTML =`, dynamic `import(` with user-controlled strings. ' +
      'Also check whether any renderer code imports from `electron` or Node built-ins directly.'
  }
]

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['dimension', 'findings'],
  properties: {
    dimension: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['severity', 'file', 'description', 'recommendation'],
        properties: {
          severity: { enum: ['critical', 'high', 'medium', 'info'] },
          file: { type: 'string' },
          line: { type: 'number' },
          description: { type: 'string' },
          recommendation: { type: 'string' }
        }
      }
    }
  }
}

// Phase 1: four parallel audit dimensions
phase('Scan')
const scans = await parallel(
  DIMENSIONS.map(
    (d) => () =>
      agent(d.prompt, {
        label: `scan:${d.key}`,
        phase: 'Scan',
        agentType: 'security-auditor',
        schema: FINDINGS_SCHEMA
      })
  )
)

const allFindings = scans
  .filter(Boolean)
  .flatMap((s) => (s.findings ?? []).map((f) => ({ ...f, dimension: s.dimension })))

const critical = allFindings.filter((f) => f.severity === 'critical')
const high = allFindings.filter((f) => f.severity === 'high')

log(
  `Scan complete: ${critical.length} critical, ${high.length} high, ` +
    `${allFindings.filter((f) => f.severity === 'medium').length} medium findings.`
)

// Phase 2: adversarially verify critical + high findings
phase('Verify')
const toVerify = [...critical, ...high]

const verified =
  toVerify.length === 0
    ? []
    : await parallel(
        toVerify.map(
          (f) => () =>
            agent(
              `Adversarially verify this security finding — try to REFUTE it. ` +
                `Read the relevant file(s) and determine if the finding is real, a false positive, or already mitigated.\n\n` +
                `Finding: ${f.description}\nFile: ${f.file}${f.line ? ` line ${f.line}` : ''}\nSeverity claimed: ${f.severity}`,
              {
                label: `verify:${f.dimension}:${f.severity}`,
                phase: 'Verify',
                agentType: 'security-auditor',
                schema: {
                  type: 'object',
                  required: ['confirmed', 'rationale'],
                  properties: {
                    confirmed: { type: 'boolean' },
                    adjustedSeverity: { enum: ['critical', 'high', 'medium', 'info'] },
                    rationale: { type: 'string' }
                  }
                }
              }
            ).then((v) => ({
              ...f,
              confirmed: v?.confirmed ?? true,
              rationale: v?.rationale ?? ''
            }))
        )
      )

const confirmedCritical = verified.filter((f) => f.confirmed && f.severity === 'critical')
const confirmedHigh = verified.filter((f) => f.confirmed && f.severity === 'high')
const mediumAndInfo = allFindings.filter((f) => f.severity === 'medium' || f.severity === 'info')

// Phase 3: final report
phase('Report')
await agent(
  'Synthesise the following security audit findings into a clear, ranked report. ' +
    'Group by: Critical → High → Medium → Info. For each finding include: severity, file/line, ' +
    'what an attacker could do, and the recommended fix. Flag the most urgent item to fix first.\n\n' +
    `Confirmed critical (${confirmedCritical.length}): ${JSON.stringify(confirmedCritical)}\n\n` +
    `Confirmed high (${confirmedHigh.length}): ${JSON.stringify(confirmedHigh)}\n\n` +
    `Medium/Info (${mediumAndInfo.length}): ${JSON.stringify(mediumAndInfo)}`,
  { label: 'final-report', phase: 'Report' }
)

return {
  critical: confirmedCritical.length,
  high: confirmedHigh.length,
  medium: mediumAndInfo.filter((f) => f.severity === 'medium').length,
  info: mediumAndInfo.filter((f) => f.severity === 'info').length
}
