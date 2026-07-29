export const meta = {
  name: 'sync-docs',
  description: 'Sync CLAUDE.md, AGENTS.md, and all .claude/ instruction files so they accurately reflect the current codebase state',
  whenToUse: 'Run after any structural change: new IPC channel, new component, new workspace, schema change, new agent/skill/workflow',
  phases: [
    { title: 'Audit', detail: 'Read codebase and all doc files to find gaps' },
    { title: 'Update', detail: 'Apply changes to out-of-sync docs in parallel' },
    { title: 'Verify', detail: 'Confirm all docs are consistent' },
  ],
}

// Phase 1: audit — read everything in parallel and find what's stale
phase('Audit')

const audit = await agent(
  'You are auditing documentation accuracy for an Electron app. Read ALL of the following files:\n\n' +
    '**Source of truth (code):**\n' +
    '- `src/main/index.ts` — IPC handlers registered with ipcMain\n' +
    '- `src/preload/index.ts` — window.api namespaces and methods\n' +
    '- `src/preload/index.d.ts` — TypeScript declarations\n' +
    '- `src/shared/types.ts` — shared types\n' +
    '- `src/renderer/src/assets/main.css` — CSS design tokens\n' +
    '- `src/renderer/src/lib/workspaces.ts` — workspace registry\n' +
    '- `src/renderer/src/App.tsx` — routing\n' +
    '- `src/main/services/databaseService.ts` — DB schema\n' +
    '- `package.json` — scripts, dependencies\n\n' +
    '**Docs to check:**\n' +
    '- `CLAUDE.md`\n' +
    '- `AGENTS.md`\n' +
    '- `.claude/agents/code-reviewer.md`\n' +
    '- `.claude/agents/ipc-builder.md`\n' +
    '- `.claude/agents/ui-component-builder.md`\n' +
    '- `.claude/agents/db-schema-builder.md`\n' +
    '- `.claude/agents/electron-packager.md`\n' +
    '- `.claude/skills/ipc-status.md`\n' +
    '- `.claude/skills/design-tokens.md`\n' +
    '- `.claude/skills/workspace-list.md`\n\n' +
    'For each doc file, identify ONLY concrete, verifiable discrepancies: ' +
    'channel names that changed, types that are wrong, workspaces added or removed, ' +
    'dependencies that changed version, scripts that were renamed, agents/skills that reference ' +
    'non-existent files. Ignore style preferences and subjective quality issues.',
  {
    label: 'audit-all-docs',
    schema: {
      type: 'object',
      required: ['discrepancies'],
      properties: {
        discrepancies: {
          type: 'array',
          items: {
            type: 'object',
            required: ['docFile', 'issue', 'currentCodeFact'],
            properties: {
              docFile: { type: 'string' },
              issue: { type: 'string' },
              currentCodeFact: { type: 'string' },
            },
          },
        },
      },
    },
  },
)

const discrepancies = audit?.discrepancies ?? []

if (discrepancies.length === 0) {
  log('All docs are in sync with the codebase — nothing to update.')
  return { updated: [], status: 'already-in-sync' }
}

log(`Found ${discrepancies.length} discrepancy/discrepancies across docs.`)

// Group discrepancies by doc file
const byFile = discrepancies.reduce((acc, d) => {
  if (!acc[d.docFile]) acc[d.docFile] = []
  acc[d.docFile].push(d)
  return acc
}, {})

log(`Files to update: ${Object.keys(byFile).join(', ')}`)

// Phase 2: update each stale file in parallel
phase('Update')

const updates = await parallel(
  Object.entries(byFile).map(([docFile, issues]) => () =>
    agent(
      `Update the documentation file \`${docFile}\` to fix these verified discrepancies:\n\n` +
        issues.map((i) => `- ${i.issue}\n  Current code fact: ${i.currentCodeFact}`).join('\n') +
        '\n\nRules:\n' +
        '- Read the file first, then make only the minimal edits to fix these specific issues\n' +
        '- Do NOT rewrite sections unaffected by the discrepancies\n' +
        '- Do NOT add new information beyond what the discrepancy fix requires\n' +
        '- Preserve all existing formatting, headings, and structure\n' +
        '- For CLAUDE.md and AGENTS.md: keep the same concise, non-verbose style',
      {
        label: `update:${docFile}`,
        phase: 'Update',
      },
    ),
  ),
)

// Phase 3: verify no new gaps were introduced
phase('Verify')
await agent(
  'Quickly verify that the following files no longer contain the discrepancies that were just fixed. ' +
    'Read each updated file and confirm the specific issues are resolved. Report any that are still wrong.\n\n' +
    'Files that were updated:\n' +
    Object.keys(byFile)
      .map((f) => `- ${f}`)
      .join('\n') +
    '\n\nDiscrepancies that should be gone:\n' +
    discrepancies.map((d) => `- ${d.docFile}: ${d.issue}`).join('\n'),
  { label: 'verify-sync', agentType: 'code-reviewer' },
)

log(`Docs synced: ${updates.filter(Boolean).length} file(s) updated.`)
return { updated: Object.keys(byFile), discrepanciesFixed: discrepancies.length }
