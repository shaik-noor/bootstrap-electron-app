#!/usr/bin/env node
const FILE_RULES = [
  // IPC contract — three-file consistency + tests
  {
    patterns: [/src\/main\/index\.ts$/],
    message:
      '`src/main/index.ts` changed. ' +
      'If you added or changed an IPC handler: (1) run `/add-ipc-channel` or manually update `src/preload/index.ts` and `src/preload/index.d.ts` to match, ' +
      '(2) run `/write-tests src/main/index.ts` to add tests for the new handler, ' +
      '(3) run `/sync-docs` if the channel inventory in docs is now stale.',
  },
  {
    patterns: [/src\/preload\/index\.ts$/, /src\/preload\/index\.d\.ts$/],
    message:
      'Preload script changed. Verify the three-file IPC contract is consistent: ' +
      '`src/main/index.ts` handler ↔ `src/preload/index.ts` wrapper ↔ `src/preload/index.d.ts` type. ' +
      'Run `/code-review` if you want an automated consistency check.',
  },
  // Database schema
  {
    patterns: [/src\/main\/services\/databaseService\.ts$/],
    message:
      '`databaseService.ts` changed. ' +
      'If you added a table or column: run `/write-tests src/main/services/databaseService.ts` to update DB tests, ' +
      'and run `/sync-docs` to keep the Database section in CLAUDE.md accurate.',
  },
  // Shared types
  {
    patterns: [/src\/shared\/types\.ts$/],
    message:
      '`src/shared/types.ts` changed. Shared types flow to main, preload, and renderer — ' +
      'run `/build-and-check` to confirm no TypeScript errors were introduced across all three projects.',
  },
  // Workspace registry / routing
  {
    patterns: [
      /src\/renderer\/src\/lib\/workspaces\.ts$/,
      /src\/renderer\/src\/App\.tsx$/,
    ],
    message:
      'Workspace registry or routing changed. ' +
      'Ensure all three files are consistent: `workspaces.ts` entry ↔ view file import ↔ `App.tsx` routing case. ' +
      'Use `/add-workspace` to add a workspace automatically, or run `/code-review` to verify manually.',
  },
  // Renderer components / views
  {
    patterns: [/src\/renderer\/src\/views\/.+\.tsx$/, /src\/renderer\/src\/components\/.+\.tsx$/],
    message:
      'Renderer component changed. Consider: ' +
      '`/write-tests <file>` to add component tests, ' +
      '`/code-review` to check Tailwind v4 tokens and Electron conventions.',
  },
  // Design tokens
  {
    patterns: [/src\/renderer\/src\/assets\/main\.css$/],
    message:
      'Design tokens changed. If you renamed or removed a token: ' +
      'run `/build-and-check` to catch broken references, and `/sync-docs` to refresh the token snapshot in skill files.',
  },
  // Package.json
  {
    patterns: [/package\.json$/],
    message:
      '`package.json` changed. ' +
      'If you added test deps (vitest, @testing-library/*): run `/setup-tests` to scaffold the test config. ' +
      'Run `/sync-docs` to keep the deps list in CLAUDE.md current. ' +
      'If you changed Electron version: run `npm run postinstall` to rebuild native modules.',
  },
  // .claude instruction files
  {
    patterns: [/\.claude\/agents\/.+\.md$/, /\.claude\/skills\/.+\.md$/, /\.claude\/workflows\/.+\.js$/],
    message:
      'A `.claude/` instruction file changed. Run `/sync-docs` to propagate any naming or convention changes ' +
      'to CLAUDE.md and AGENTS.md so the documentation stays in sync.',
  },
  // electron-builder / vite config
  {
    patterns: [/electron\.vite\.config\.ts$/, /electron-builder\.yml$/],
    message:
      'Build config changed. Run `/build-and-check` to confirm the new configuration produces a clean build.',
  },
]

let input = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => (input += chunk))
process.stdin.on('end', () => {
  try {
    const event = JSON.parse(input)
    const filePath = (event?.tool_input?.file_path ?? '').replace(/\\/g, '/')

    for (const rule of FILE_RULES) {
      if (rule.patterns.some((re) => re.test(filePath))) {
        process.stdout.write(`[action-needed] ${rule.message}`)
        break
      }
    }
  } catch {
    // malformed input — silent exit
  }
  process.exit(0)
})
