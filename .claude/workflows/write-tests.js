export const meta = {
  name: 'write-tests',
  description: 'Write tests for a specific file or feature. Pass the target file path or feature description as args.',
  whenToUse: 'Use after implementing a new feature, IPC channel, component, or DatabaseService method to write the corresponding tests',
  phases: [
    { title: 'Analyse', detail: 'Understand the target code and existing tests' },
    { title: 'Write', detail: 'Generate tests per area' },
    { title: 'Run', detail: 'Execute tests and fix failures' },
  ],
}

const target = args ?? 'the most recently modified source file'

// Phase 1: understand the target
phase('Analyse')
const analysis = await agent(
  `Analyse the code that needs tests. Target: ${target}\n\n` +
    'Tasks:\n' +
    '1. Read the target file(s)\n' +
    '2. Check if a corresponding test file already exists\n' +
    '3. Identify the test environment needed (node for main/preload, jsdom/happy-dom for renderer)\n' +
    '4. List every exported function, hook, or component that should be tested\n' +
    '5. Note any external dependencies that need mocking (electron, window.api, DatabaseService)\n' +
    '6. Check `vitest.config.ts` exists — if not, note that /setup-tests must be run first',
  {
    label: 'analyse-target',
    schema: {
      type: 'object',
      required: ['targetFile', 'testFile', 'environment', 'itemsToTest', 'mocksNeeded', 'vitestConfigExists'],
      properties: {
        targetFile: { type: 'string' },
        testFile: { type: 'string' },
        environment: { enum: ['node', 'jsdom', 'happy-dom'] },
        itemsToTest: { type: 'array', items: { type: 'string' } },
        mocksNeeded: { type: 'array', items: { type: 'string' } },
        vitestConfigExists: { type: 'boolean' },
        existingTestCount: { type: 'number' },
      },
    },
  },
)

if (!analysis?.vitestConfigExists) {
  log('ERROR: vitest.config.ts not found. Run /setup-tests first to scaffold the test infrastructure.')
  return { error: 'no-vitest-config' }
}

log(
  `Target: ${analysis?.targetFile} → ${analysis?.testFile} ` +
    `(${analysis?.environment}, ${analysis?.itemsToTest?.length ?? 0} items to test)`,
)

// Phase 2: write tests grouped by type
phase('Write')

const areas = analysis?.itemsToTest ?? []
if (areas.length === 0) {
  log('No testable exports identified.')
  return { status: 'nothing-to-test' }
}

// Group into batches of 3 to avoid very large single test files
const batches = []
for (let i = 0; i < areas.length; i += 3) {
  batches.push(areas.slice(i, i + 3))
}

await pipeline(
  batches,
  (batch, _, batchIndex) =>
    agent(
      `Write Vitest tests for these items from \`${analysis?.targetFile}\`:\n` +
        batch.map((item) => `- ${item}`).join('\n') +
        `\n\nTest file: \`${analysis?.testFile}\` (${batchIndex === 0 ? 'create it' : 'append to it'})\n` +
        `Environment: ${analysis?.environment}\n` +
        `Mocks needed: ${(analysis?.mocksNeeded ?? []).join(', ')}\n\n` +
        'Rules:\n' +
        '- Follow the test-conventions skill patterns exactly\n' +
        '- Test both the success path and the error/edge case path for each item\n' +
        '- Use descriptive test names: describe("functionName", () => { it("returns X when Y", ...) })\n' +
        '- Mock only what you must — test real logic, not mock interactions\n' +
        '- Read the target source file before writing anything',
      {
        label: `write-tests-batch-${batchIndex + 1}`,
        phase: 'Write',
        agentType: 'test-writer',
      },
    ),
)

// Phase 3: run and fix
phase('Run')
await agent(
  `Run \`npm test -- --reporter=verbose ${analysis?.testFile}\` and report results. ` +
    'If tests fail: read the error, identify whether the issue is in the test or the source, ' +
    'and fix only the test file. Never modify source files to make tests pass. ' +
    'Show the final pass/fail count.',
  { label: 'run-and-fix' },
)

log(`Tests written for ${analysis?.targetFile}. Run \`npm test\` to execute all tests.`)
return { targetFile: analysis?.targetFile, testFile: analysis?.testFile }
