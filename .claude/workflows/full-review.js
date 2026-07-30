export const meta = {
  name: 'full-review',
  description:
    'Pre-release quality gate: parallel code review, security audit, accessibility check, performance review, and test coverage check across all changed files',
  whenToUse: 'Run before tagging a release or merging a significant feature branch',
  phases: [
    { title: 'Discover', detail: 'Find changed files and test coverage gaps' },
    { title: 'Review', detail: 'Five parallel review dimensions' },
    { title: 'Verify', detail: 'Adversarially confirm critical findings' },
    { title: 'Gate', detail: 'Pass/fail verdict with blockers vs warnings' }
  ]
}

// Phase 1: discover scope
phase('Discover')
const scope = await agent(
  'Find all files changed since the last git tag (or all src/ files if no tags exist): ' +
    'run `git describe --tags --abbrev=0 2>/dev/null && git diff --name-only $(git describe --tags --abbrev=0) HEAD ' +
    '|| git diff --name-only HEAD~10 HEAD`. ' +
    'Also run `npm test -- --reporter=json 2>/dev/null | tail -5` to get current test pass/fail count if tests exist. ' +
    'Return the file list and test status.',
  {
    label: 'discover-scope',
    schema: {
      type: 'object',
      required: ['files', 'testStatus'],
      properties: {
        files: { type: 'array', items: { type: 'string' } },
        testStatus: { enum: ['passed', 'failed', 'no-tests'] },
        testCount: { type: 'number' }
      }
    }
  }
)

const changedFiles = (scope?.files ?? []).filter(
  (f) => !f.startsWith('dist/') && !f.startsWith('out/') && !f.endsWith('.lock')
)

log(
  `Reviewing ${changedFiles.length} changed file(s). Test status: ${scope?.testStatus ?? 'unknown'}.`
)

// Phase 2: five parallel review dimensions
phase('Review')

const REVIEW_DIMENSIONS = [
  {
    key: 'code',
    agentType: 'code-reviewer',
    prompt: `Review the following changed files for IPC contract correctness, Tailwind v4 styling rules, and Electron security conventions:\n\n${changedFiles.join('\n')}\n\nRead each file and report grouped findings.`
  },
  {
    key: 'security',
    agentType: 'security-auditor',
    prompt: `Security-focused review of changed files:\n\n${changedFiles.join('\n')}\n\nFocus on: IPC input validation gaps, contextBridge over-exposure, shell.openExternal safety, CSP presence. Read each relevant file.`
  },
  {
    key: 'a11y',
    agentType: 'a11y-reviewer',
    prompt: `Accessibility review of any React component files in:\n\n${changedFiles.filter((f) => f.endsWith('.tsx')).join('\n') || 'no .tsx files changed'}\n\nCheck keyboard nav, focus management, ARIA correctness, and contrast.`
  },
  {
    key: 'performance',
    agentType: 'performance-reviewer',
    prompt: `Performance review of renderer files in:\n\n${changedFiles.filter((f) => f.includes('renderer')).join('\n') || 'no renderer files changed'}\n\nCheck re-render hygiene, Zustand selector granularity, Framer Motion variant definitions, bundle imports.`
  },
  {
    key: 'tests',
    agentType: 'test-writer',
    prompt:
      `Check test coverage for changed source files:\n\n${changedFiles.join('\n')}\n\n` +
      'For each changed file: does a corresponding test file exist? ' +
      'If test files exist, do they cover the changed functions/components? ' +
      'List files that are missing tests entirely vs files with partial coverage. ' +
      'Do NOT write any tests — only audit coverage.'
  }
]

const DIMENSION_SCHEMA = {
  type: 'object',
  required: ['dimension', 'blockers', 'warnings'],
  properties: {
    dimension: { type: 'string' },
    blockers: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'description'],
        properties: {
          file: { type: 'string' },
          line: { type: 'number' },
          description: { type: 'string' }
        }
      }
    },
    warnings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'description'],
        properties: {
          file: { type: 'string' },
          line: { type: 'number' },
          description: { type: 'string' }
        }
      }
    }
  }
}

const reviews = await parallel(
  REVIEW_DIMENSIONS.map(
    (d) => () =>
      agent(d.prompt, {
        label: `review:${d.key}`,
        phase: 'Review',
        agentType: d.agentType,
        schema: DIMENSION_SCHEMA
      }).then((r) => ({ ...r, dimension: d.key }))
  )
)

const allBlockers = reviews
  .filter(Boolean)
  .flatMap((r) => (r.blockers ?? []).map((b) => ({ ...b, dimension: r.dimension })))
const allWarnings = reviews
  .filter(Boolean)
  .flatMap((r) => (r.warnings ?? []).map((w) => ({ ...w, dimension: r.dimension })))

log(`Reviews complete: ${allBlockers.length} blocker(s), ${allWarnings.length} warning(s).`)

// Phase 3: verify blockers only
phase('Verify')
const confirmedBlockers =
  allBlockers.length === 0
    ? []
    : (
        await parallel(
          allBlockers.map(
            (b) => () =>
              agent(
                `Adversarially verify this blocker — try to REFUTE it by reading the file. Is it real?\n\n` +
                  `Dimension: ${b.dimension}\nFile: ${b.file}${b.line ? ` line ${b.line}` : ''}\nIssue: ${b.description}`,
                {
                  label: `verify:${b.dimension}`,
                  phase: 'Verify',
                  schema: {
                    type: 'object',
                    required: ['confirmed'],
                    properties: { confirmed: { type: 'boolean' }, rationale: { type: 'string' } }
                  }
                }
              ).then((v) => ({ ...b, confirmed: v?.confirmed ?? true }))
          )
        )
      ).filter((b) => b.confirmed)

// Phase 4: gate
phase('Gate')
const testsFailed = scope?.testStatus === 'failed'
const hasBlockers = confirmedBlockers.length > 0
const passed = !testsFailed && !hasBlockers

await agent(
  `Produce the final quality gate report.\n\n` +
    `VERDICT: ${passed ? 'PASS ✓' : 'FAIL ✗'}\n\n` +
    `Test status: ${scope?.testStatus} (${scope?.testCount ?? 0} tests)\n\n` +
    `Confirmed blockers (${confirmedBlockers.length}):\n${JSON.stringify(confirmedBlockers, null, 2)}\n\n` +
    `Warnings (${allWarnings.length} total, not blocking):\n${JSON.stringify(allWarnings.slice(0, 10), null, 2)}\n\n` +
    'Format as a readable summary with: verdict, must-fix blockers with file+line, and top 5 warnings to address soon.',
  { label: 'gate-report', phase: 'Gate' }
)

return {
  passed,
  blockers: confirmedBlockers.length,
  warnings: allWarnings.length,
  testStatus: scope?.testStatus
}
