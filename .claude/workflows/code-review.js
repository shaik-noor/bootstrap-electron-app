export const meta = {
  name: 'code-review',
  description: 'Review all staged or changed files against project conventions',
  whenToUse: 'Run before committing or opening a PR to catch IPC, styling, and security issues',
  phases: [
    { title: 'Discover', detail: 'Find changed files' },
    { title: 'Review', detail: 'Parallel review per file' },
    { title: 'Synthesize', detail: 'Aggregate findings' }
  ]
}

// Phase 1: discover changed files
phase('Discover')
const discovery = await agent(
  'Run `git diff --name-only HEAD` and also `git diff --name-only --cached`. ' +
    'Return the union of both lists, deduplicated, as an array of file paths. ' +
    'Exclude lock files, dist/, out/, and .claude/ directories.',
  {
    label: 'find-changed-files',
    schema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: { type: 'array', items: { type: 'string' } }
      }
    }
  }
)

const files = (discovery?.files ?? []).filter(Boolean)

if (files.length === 0) {
  log('No changed files found — nothing to review.')
  return { findings: [] }
}

log(`Reviewing ${files.length} changed file(s)…`)

// Phase 2: parallel review — one agent per file
phase('Review')
const reviews = await parallel(
  files.map(
    (f) => () =>
      agent(
        `You are the code-reviewer agent. Review the file \`${f}\` against all project conventions: ` +
          'IPC envelope pattern, Tailwind v4 oklch tokens, Electron security rules (contextIsolation, ' +
          'no window.alert/confirm), and Prettier formatting. Read the file first, then report findings.',
        {
          label: `review:${f}`,
          phase: 'Review',
          agentType: 'code-reviewer',
          schema: {
            type: 'object',
            required: ['file', 'findings'],
            properties: {
              file: { type: 'string' },
              findings: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['severity', 'line', 'message'],
                  properties: {
                    severity: { enum: ['critical', 'major', 'minor'] },
                    line: { type: 'number' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      )
  )
)

// Phase 3: synthesize
phase('Synthesize')
const allFindings = reviews
  .filter(Boolean)
  .flatMap((r) => (r.findings ?? []).map((f) => ({ ...f, file: r.file })))

const critical = allFindings.filter((f) => f.severity === 'critical')
const major = allFindings.filter((f) => f.severity === 'major')
const minor = allFindings.filter((f) => f.severity === 'minor')

log(
  `Review complete: ${critical.length} critical, ${major.length} major, ${minor.length} minor findings across ${files.length} files.`
)

return {
  findings: allFindings,
  summary: { critical: critical.length, major: major.length, minor: minor.length }
}
