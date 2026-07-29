export const meta = {
  name: 'build-and-check',
  description: 'Run typecheck and build, then report all errors with file locations and suggested fixes',
  whenToUse: 'Use after significant changes to catch type errors and build failures before committing',
  phases: [
    { title: 'Typecheck', detail: 'Run tsc for node and web projects' },
    { title: 'Build', detail: 'Run electron-vite build' },
    { title: 'Fix', detail: 'Apply suggested fixes in parallel' },
  ],
}

// Phase 1: typecheck both TS projects
phase('Typecheck')
const typecheckResult = await agent(
  'Run `npm run typecheck` and capture all output. ' +
    'Parse the TypeScript compiler errors and return them as structured data. ' +
    'For each error include: file path, line number, error code (TS####), and message.',
  {
    label: 'typecheck',
    schema: {
      type: 'object',
      required: ['passed', 'errors'],
      properties: {
        passed: { type: 'boolean' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            required: ['file', 'line', 'code', 'message'],
            properties: {
              file: { type: 'string' },
              line: { type: 'number' },
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
)

if (typecheckResult?.passed) {
  log('Typecheck passed with no errors.')
} else {
  log(`Typecheck found ${typecheckResult?.errors?.length ?? 0} error(s).`)
}

// If typecheck passed, also run the full build
phase('Build')
const buildResult = await agent(
  typecheckResult?.passed
    ? 'Run `npx electron-vite build` (skip typecheck since it already passed). Capture all output. Return whether it succeeded and any error messages.'
    : 'Typecheck failed — skip the vite build. Return passed: false with a note that build was skipped.',
  {
    label: 'build',
    schema: {
      type: 'object',
      required: ['passed', 'errors'],
      properties: {
        passed: { type: 'boolean' },
        skipped: { type: 'boolean' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  },
)

const allErrors = [
  ...(typecheckResult?.errors ?? []).map((e) => ({
    source: 'typecheck',
    file: e.file,
    line: e.line,
    message: `${e.code}: ${e.message}`,
  })),
  ...(buildResult?.errors ?? []).map((e) => ({ source: 'build', file: 'unknown', line: 0, message: e })),
]

if (allErrors.length === 0) {
  log('Build and typecheck succeeded — no errors.')
  return { success: true, errors: [] }
}

// Phase 3: fix errors in parallel, grouped by file
phase('Fix')
const byFile = allErrors.reduce((acc, e) => {
  if (!acc[e.file]) acc[e.file] = []
  acc[e.file].push(e)
  return acc
}, {})

const fixes = await parallel(
  Object.entries(byFile).map(([file, errors]) => () =>
    agent(
      `Fix the following TypeScript errors in \`${file}\`:\n\n` +
        errors.map((e) => `- Line ${e.line}: ${e.message}`).join('\n') +
        '\n\nRead the file first, then apply the minimal fix. Do not refactor beyond what is needed.',
      { label: `fix:${file}`, phase: 'Fix' },
    ),
  ),
)

log(`Attempted fixes for ${Object.keys(byFile).length} file(s). Run /build-and-check again to verify.`)
return { success: false, errors: allErrors, fixesApplied: fixes.filter(Boolean).length }
