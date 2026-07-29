# AGENTS.md

Multi-agent orchestration guide for this Electron app. Claude Code reads `.claude/agents/` for subagent definitions, `.claude/workflows/` for workflow scripts, and `.claude/skills/` for context-injecting skills. This file documents the conventions, when to use each, and how to extend them.

---

## Custom Agents (`.claude/agents/`)

Each file defines a subagent with scoped tools and a focused system prompt. Claude Code discovers them automatically; reference them by name in the `agentType` option of the Agent tool or in workflow scripts.

| Agent | File | Purpose |
|---|---|---|
| `code-reviewer` | `agents/code-reviewer.md` | Reviews files against IPC, styling, and Electron security rules |
| `ipc-builder` | `agents/ipc-builder.md` | Implements end-to-end IPC channels (main + preload + types) |
| `ui-component-builder` | `agents/ui-component-builder.md` | Builds renderer components with correct Tailwind v4 / shadcn conventions |
| `db-schema-builder` | `agents/db-schema-builder.md` | Adds tables/columns to `DatabaseService` using better-sqlite3 + Drizzle |
| `electron-packager` | `agents/electron-packager.md` | Handles build, typecheck, native modules, and installer config |
| `security-auditor` | `agents/security-auditor.md` | Audits Electron security: BrowserWindow config, IPC validation, preload surface, CSP, deps |
| `test-writer` | `agents/test-writer.md` | Writes Vitest unit tests and Playwright E2E tests following project mock patterns |
| `a11y-reviewer` | `agents/a11y-reviewer.md` | Reviews components for keyboard nav, ARIA, focus management, and contrast |
| `performance-reviewer` | `agents/performance-reviewer.md` | Finds unnecessary re-renders, Zustand selector issues, bundle bloat, Framer Motion misuse |

### Agent tool access

Agents are locked to the minimum tools they need:

- `code-reviewer` — **read-only** (`Read, Grep, Glob`)
- `security-auditor` — **read-only** (`Read, Grep, Glob`) — high effort, uses Opus
- `a11y-reviewer` — **read-only** (`Read, Grep, Glob`)
- `performance-reviewer` — **read-only** (`Read, Grep, Glob`)
- `ipc-builder` — **read + edit** (`Read, Edit, Grep, Glob`)
- `db-schema-builder` — **read + edit** (`Read, Edit, Grep, Glob`)
- `ui-component-builder` — **read + write** (`Read, Edit, Write, Grep, Glob`)
- `test-writer` — **read + write + bash** (`Read, Edit, Write, Grep, Glob, Bash`) — runs tests
- `electron-packager` — **read + bash + edit** (`Read, Bash, Edit, Glob, Grep`)

---

## Skills (`.claude/skills/`)

Skills inject live, command-generated context into the conversation automatically when you open matching files — no manual invocation needed for path-matched skills. They can also be invoked manually with `/skill-name`.

| Skill | File | Triggers on | What it injects |
|---|---|---|---|
| `ipc-status` | `skills/ipc-status.md` | `src/main/index.ts`, `src/preload/**` | Live list of all `ipcMain` handlers + preload namespaces + hard IPC rules |
| `design-tokens` | `skills/design-tokens.md` | `src/renderer/src/**/*.{tsx,css}` | Live CSS token dump + Tailwind v4 / oklch rules + component library info |
| `workspace-list` | `skills/workspace-list.md` | `workspaces.ts`, `App.tsx`, `views/**` | Live workspace registry + routing map + 3-file addition convention |
| `security-context` | `skills/security-context.md` | `src/main/index.ts`, `src/preload/**`, `index.html` | Live BrowserWindow security config + IPC validation rules + CSP gap |
| `test-conventions` | `skills/test-conventions.md` | `**/*.test.*`, `**/*.spec.*`, `vitest.config.ts` | Electron mock, window.api mock, DB mock patterns + what not to test |

The `!`` command`` ` blocks in skill files run at load time and inject fresh output — so the IPC inventory and token list are always current, not stale snapshots.

### Adding a skill

```markdown
---
name: my-skill
description: One sentence — what it injects and when to use it
when_to_use: When working on X
paths:
  - src/some/path.ts        # auto-load when this file is opened/edited
---

## Context heading

!`node -e "...extract live data from the codebase..."`

## Static rules that never change
- rule 1
- rule 2
```

---

## Workflows (`.claude/workflows/`)

Invoke with `/workflow-name` in Claude Code. Workflows orchestrate multiple agents deterministically using `phase()`, `parallel()`, `pipeline()`, and `agent()`.

### Available workflows

#### `/code-review`
Reviews all staged + unstaged changed files in parallel. One `code-reviewer` agent per file, findings aggregated by severity (critical / major / minor).

```
/code-review
```

#### `/add-ipc-channel`
Scaffolds a complete IPC channel end-to-end. Pass a spec as `args`:

```
/add-ipc-channel channel: "file:open", returns: "{ path: string }", description: "opens native file picker"
```

Phases: Plan (design signature) → Implement (main handler, preload wrapper, type declaration in sequence) → Verify (consistency check).

#### `/build-and-check`
Runs `npm run typecheck` then `electron-vite build`. If errors are found, attempts parallel fixes grouped by file.

```
/build-and-check
```

#### `/add-workspace`
Adds a new top-level workspace: creates the view component, registers it in `workspaces.ts`, and wires routing in `App.tsx`.

```
/add-workspace Analytics
# or with overrides:
/add-workspace { "name": "Analytics", "icon": "BarChart2", "tint": "oklch(0.6 0.15 270)" }
```

#### `/security-audit`
Four parallel audit dimensions (BrowserWindow config, IPC validation, preload surface, CSP/renderer) with adversarial verification of critical and high findings. Uses `security-auditor` (Opus model).

```
/security-audit
```

#### `/setup-tests`
One-time bootstrap: installs Vitest + Testing Library, creates `vitest.config.ts`, renderer setup file, adds `npm test` scripts, and seeds the first tests for `DatabaseService` and IPC handlers. Run once per project.

```
/setup-tests
```

#### `/write-tests`
Write tests for a specific file or feature. Pass the target as args.

```
/write-tests src/main/services/databaseService.ts
/write-tests the settings IPC handlers
```

#### `/full-review`
Pre-release quality gate. Five parallel review dimensions (code, security, a11y, performance, test coverage) → adversarial blocker verification → pass/fail verdict.

```
/full-review
```

#### `/sync-docs`
Audits all documentation files against the live codebase and fixes any concrete discrepancies in parallel. Run after any structural change.

```
/sync-docs
```

**What it checks:**
- IPC channel names and types (main → preload → index.d.ts consistency)
- Workspace registry entries vs. view files vs. routing
- CSS token names referenced in skill/agent files
- Package scripts and dependency versions in CLAUDE.md
- Agent/skill files referencing non-existent source paths

**What it does NOT change:** Style, wording quality, or content unrelated to the discrepancy.

---

## Workflow script conventions

Workflow scripts are plain JavaScript (no TypeScript). Key patterns used in this project:

```js
// Always start with the meta block (pure literal — no variables)
export const meta = {
  name: 'my-workflow',
  description: 'What it does',
  phases: [{ title: 'Phase 1', detail: 'what happens' }],
}

// Group work visually
phase('Phase 1')

// Structured output — agent() returns the validated object directly
const result = await agent('Find all TS files under src/', {
  label: 'find-files',
  schema: {
    type: 'object',
    required: ['files'],
    properties: { files: { type: 'array', items: { type: 'string' } } },
  },
})

// Fan out over a list — wall-clock = slowest single item
const reviews = await parallel(
  result.files.map(f => () => agent(`Review ${f}`, { label: f, phase: 'Review' }))
)

// Pipeline: item A can be in stage 2 while item B is still in stage 1
const fixed = await pipeline(result.files, 
  f => agent(`Find issues in ${f}`, { schema: ISSUES_SCHEMA }),
  (issues, originalFile) => agent(`Fix issues in ${originalFile}`, { isolation: 'worktree' })
)

// Use isolation: 'worktree' when agents edit files in parallel to avoid conflicts
await parallel(
  filesToRefactor.map(f => () =>
    agent(`Refactor ${f}`, { isolation: 'worktree', phase: 'Refactor' })
  )
)

// Log progress (visible in /workflows view)
log(`Processing ${result.files.length} files…`)
```

**Rules:**
- `meta` must be a pure literal — no computed values, variables, or template strings
- No TypeScript syntax — plain JS only
- `Date.now()`, `Math.random()`, and `new Date()` are not available (they break resume)
- `pipeline()` is the default for multi-stage work; `parallel()` only when you need ALL prior results before the next stage
- Always `.filter(Boolean)` on parallel results before iterating

---

## Adding a new agent

1. Create `.claude/agents/<name>.md` with YAML frontmatter:

```markdown
---
name: my-agent
description: One sentence: what it does and when to use it. This guides delegation.
tools: Read, Grep, Glob        # minimum needed
model: sonnet                  # or haiku for fast/cheap, opus for deep reasoning
effort: high                   # low | medium | high | xhigh | max
---

System prompt here. Be specific about this project's conventions.
```

2. Reference it in workflow scripts with `agentType: 'my-agent'`.
3. No restart needed — Claude Code watches `.claude/agents/` for changes.

---

## Adding a new workflow

1. Create `.claude/workflows/<name>.js`
2. Export a `meta` object with `name` (becomes `/name`) and `description`
3. The workflow is immediately available as `/name` in Claude Code

---

## Hooks (`.claude/hooks/`)

Hooks run automatically — the user never has to know they exist.

### `session-start.js` (SessionStart)

Fires once when Claude Code opens the project. Injects a system message containing:
- The full command menu so Claude can proactively suggest commands from the first turn
- Test infrastructure status (Vitest not installed / no test files / count of existing tests)
- CSP gap warning if `src/renderer/index.html` has no `Content-Security-Policy` meta tag
- Currently changed files (from `git diff --name-only HEAD`) with a suggestion to run `/code-review`

This means Claude always knows the available commands — the user never has to discover them by reading docs.

### `check-sync-needed.js` (PostToolUse on Edit|Write)

Fires after every file edit. Maps the specific changed file to a specific suggested action:

| File changed | Injected suggestion |
|---|---|
| `src/main/index.ts` | Sync preload + types, run `/write-tests`, run `/sync-docs` |
| `src/preload/index.ts` / `.d.ts` | Verify 3-file IPC contract, run `/code-review` |
| `databaseService.ts` | Run `/write-tests`, run `/sync-docs` |
| `src/shared/types.ts` | Run `/build-and-check` |
| `workspaces.ts` / `App.tsx` | Check 3-file workspace consistency |
| Any `views/` or `components/` file | Run `/write-tests`, run `/code-review` |
| `main.css` | Run `/build-and-check`, run `/sync-docs` |
| `package.json` | Run `/setup-tests` if test deps added; run `/sync-docs` |
| Any `.claude/**` file | Run `/sync-docs` |
| `electron.vite.config.ts` / `electron-builder.yml` | Run `/build-and-check` |

The hook never blocks or auto-runs anything — it only injects targeted advice.

---

## Key project constraints for agents

Any agent working in this codebase must respect:

- **IPC envelope**: all fallible IPC returns `{ success, data?, error? }` via `wrapData`/`wrapVoid`
- **Three-file IPC contract**: `src/main/index.ts` + `src/preload/index.ts` + `src/preload/index.d.ts` must all change together
- **Sidebar color sync**: `#191919` kept in sync across CSS `--sidebar` token, `createWindow()` overlay config, and `theme:changed` handler
- **No native dialogs**: `toast.*` instead of `window.alert`, `confirmDialog()` instead of `window.confirm`
- **Tailwind v4 oklch**: `var(--token)` only, never `hsl(var(--token))`
- **Prettier**: no semicolons, single quotes, 100-char width, no trailing commas
