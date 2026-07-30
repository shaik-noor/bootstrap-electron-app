export const meta = {
  name: 'setup-tests',
  description:
    'Scaffold the full test infrastructure: install Vitest + Testing Library + Playwright, create configs, and write the first tests for DatabaseService and IPC handlers',
  whenToUse:
    'Run once to bootstrap the test setup from scratch — this project currently has no tests',
  phases: [
    { title: 'Install', detail: 'Add test dependencies to package.json' },
    { title: 'Config', detail: 'Create vitest.config.ts, playwright.config.ts, test setup files' },
    { title: 'Seed', detail: 'Write first real tests for DatabaseService and IPC handlers' },
    { title: 'Verify', detail: 'Run tests and confirm they pass' }
  ]
}

// Phase 1: install deps
phase('Install')
await agent(
  'Install test dependencies for this Electron + React + TypeScript project. Run:\n\n' +
    '```\n' +
    'npm install -D vitest @vitest/ui @testing-library/react @testing-library/user-event ' +
    'happy-dom @types/testing-library__jest-dom\n' +
    '```\n\n' +
    'Do NOT install @playwright/test yet — that is a larger addition. ' +
    'After install, verify the packages appear in package.json devDependencies.',
  { label: 'install-vitest' }
)

// Phase 2: create all config files in parallel
phase('Config')
await parallel([
  () =>
    agent(
      'Create `vitest.config.ts` at the project root with two test projects: ' +
        '(1) `node` environment for `src/main/**/*.test.ts` and `src/preload/**/*.test.ts`, ' +
        '(2) `happy-dom` environment for `src/renderer/**/*.test.{ts,tsx}` with ' +
        'setupFiles pointing to `src/renderer/src/__tests__/setup.ts`. ' +
        'Add a path alias `@` → `src/renderer/src` for the renderer project. ' +
        "Use the exact pattern from the test-writer agent's vitest config template.",
      { label: 'create-vitest-config', phase: 'Config' }
    ),
  () =>
    agent(
      'Create the renderer test setup file at `src/renderer/src/__tests__/setup.ts`. ' +
        'It should: (1) mock `window.api` with vi.fn() stubs for all current namespaces ' +
        '(theme.getInitialSync, theme.changed, settings.load, settings.save, app.getVersion), ' +
        '(2) import `@testing-library/jest-dom` for the custom matchers. ' +
        'Use the window.api mock pattern from the test-conventions skill.',
      { label: 'create-renderer-setup', phase: 'Config' }
    )
])

// Add test scripts to package.json
await agent(
  'Add these scripts to `package.json` (read it first, then add under the existing scripts):\n\n' +
    '```json\n' +
    '"test": "vitest run",\n' +
    '"test:watch": "vitest",\n' +
    '"test:ui": "vitest --ui",\n' +
    '"test:coverage": "vitest run --coverage"\n' +
    '```',
  { label: 'add-test-scripts', phase: 'Config' }
)

// Phase 3: seed tests
phase('Seed')
await parallel([
  () =>
    agent(
      'Write tests for `src/main/services/databaseService.ts` at ' +
        '`src/main/services/__tests__/databaseService.test.ts`. ' +
        'Cover: init() creates tables, loadSettings() returns {} on fresh DB, ' +
        'saveSettings() + loadSettings() round-trip preserves all fields, ' +
        'saveSettings() merges partial updates without losing existing keys, ' +
        'loadSettings() handles corrupted JSON gracefully. ' +
        'Use an in-memory DB via the electron app.getPath mock (tmpdir). ' +
        'Read the full databaseService.ts source before writing tests.',
      { label: 'test-db', phase: 'Seed', agentType: 'test-writer' }
    ),
  () =>
    agent(
      'Write tests for the IPC handlers in `src/main/index.ts` at ' +
        '`src/main/__tests__/ipcHandlers.test.ts`. ' +
        'Test the wrapData and wrapVoid helper functions in isolation: ' +
        'success path returns { success: true, data }, thrown error returns { success: false, error }. ' +
        'Test settings:load and settings:save handlers via the exported registerIpcHandlers function. ' +
        'Mock electron and DatabaseService. Read the full index.ts source first.',
      { label: 'test-ipc', phase: 'Seed', agentType: 'test-writer' }
    )
])

// Phase 4: run and verify
phase('Verify')
await agent(
  'Run `npm test` and report: did the tests pass? If any failed, show the full error output ' +
    'and identify whether the issue is in the test code, config, or source code. ' +
    'Do not fix source code — only fix test files and config.',
  { label: 'run-tests' }
)

log(
  'Test infrastructure scaffolded. Run `npm test` to execute, `npm run test:watch` for watch mode.'
)
return { status: 'scaffolded' }
