# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start electron-vite dev server with HMR
npm run build        # typecheck + electron-vite build (required before packaging)
npm run build:win    # Full Windows NSIS installer
npm run build:mac    # Full macOS DMG (arm64 + x64)
npm run build:linux  # Full Linux AppImage + snap
npm run typecheck    # Run both node and web TS checks
npm run lint         # ESLint with cache
npm run format       # Prettier write
```

There are no tests in this project.

After any `npm install`, native modules (better-sqlite3) are rebuilt automatically via the `postinstall` hook.

## Architecture

Standard three-process Electron split:

- **`src/main/`** — Node.js main process. Creates a single frameless `BrowserWindow`, bootstraps `DatabaseService` (SQLite via better-sqlite3), registers all `ipcMain` handlers. `wrapData<T>(fn)` and `wrapVoid(fn)` helpers are defined here.
- **`src/preload/`** — Bridge script. Exposes `window.api` (typed app surface) and `window.electron` (from `@electron-toolkit/preload`) via `contextBridge`. Also applies the persisted theme to `document.documentElement` synchronously before React runs (FOUC prevention layer 1; `ThemeProvider` is layer 2).
- **`src/renderer/`** — React 19 SPA, bundled by Vite + Tailwind v4. Path aliases: both `@` and `@renderer` resolve to `src/renderer/src`.
- **`src/shared/`** — Types shared across all three processes (`AppSettings`, `IpcResult<T>`).

Two TypeScript projects exist with separate configs: `tsconfig.node.json` (main + preload + shared) and `tsconfig.web.json` (renderer + shared + preload types).

## IPC Contract (3-file pattern)

Adding a new IPC channel requires edits to exactly three files:

1. **`src/main/index.ts`** — register with `ipcMain.handle()` (async) or `ipcMain.on()` (sync). Wrap the handler with `wrapData<T>(fn)` for typed returns or `wrapVoid(fn)` for void operations. Both produce the `IpcResult<T>` envelope `{ success, data?, error? }`.

2. **`src/preload/index.ts`** — add a typed wrapper function that calls `ipcRenderer.invoke()` (or `sendSync` for sync channels), grouped into a namespace object. Add the function to the `api` object passed to `exposeInMainWorld`.

3. **`src/preload/index.d.ts`** — extend the `Window['api']` interface with the new function signature.

Renderer code calls `window.api.<namespace>.<method>(...)` and checks `.success` before using `.data`.

Current channels: `theme.getInitialSync` (sync), `theme.changed`, `settings.load`, `settings.save`, `app.getVersion`.

## Workspace Registry (3-file pattern)

Adding a workspace requires edits to exactly three files:

1. **`src/renderer/src/lib/workspaces.ts`** — extend `WorkspaceId` union (`| 'newid'`), add a `WorkspaceMeta` entry to `WORKSPACES` (pick a `tint` from the predefined set: `violet`, `emerald`, `amber`, `blue`, `indigo`).
2. **`src/renderer/src/App.tsx`** — add a `case 'newid':` to the `renderContent()` switch.
3. **`src/renderer/src/views/NewIdView.tsx`** — create the view component.

## Database

`DatabaseService` in `src/main/services/databaseService.ts` is a static class wrapping better-sqlite3. Drizzle ORM is installed but not yet wired to any table definitions — schema additions go in `databaseService.ts`.

## Styling Conventions

- Tailwind v4 via `@tailwindcss/vite`. Design tokens are defined in `src/renderer/src/assets/main.css` as `oklch(...)` values.
- Use `var(--token)` directly — never `hsl(var(--token))`.
- Minimum font size is `text-2xs` (11px).
- Do not use `border-0` on `bg-card` surfaces.
- The dark sidebar background `#191919` must stay in sync across: the CSS `--sidebar` token, the `createWindow()` `titleBarOverlay` config in main, and the `theme:changed` IPC handler.

## UI Patterns

- **Toasts**: use `toast.success/error/info/warning()` from `src/renderer/src/lib/toast.ts`. Never use `window.alert`.
- **Confirm dialogs**: use `confirmDialog()` from `src/renderer/src/lib/confirm.ts`. Never use `window.confirm`.
- **Icons**: Lucide React.
- **UI primitives**: shadcn/ui components in `src/renderer/src/components/ui/` (style: radix-lyra, base color: zinc).
- **State**: Zustand store in `src/renderer/src/store/useAppStore.ts`. Auxiliary stores: `useConfirmStore` and `useToastStore` (in their respective `lib/` files).
- **Animations**: use the tokens in `src/renderer/src/lib/motion.ts` (`duration`, `ease`, `fadeRise`, `staggerContainer`) — do not hardcode Framer Motion values.
- **Drag regions**: use `.drag-region` / `.no-drag` utility classes from `main.css` on TitleBar elements.

## Prettier Config

No semicolons, single quotes, 100-char print width, no trailing commas, 2-space indent.

---

## Multi-Agent Orchestration

This project ships purpose-built agents and workflows in `.claude/`. See [AGENTS.md](AGENTS.md) for the full reference.

### Custom agents (`.claude/agents/`)

| Invoke as              | Purpose                                                            | Tools               |
| ---------------------- | ------------------------------------------------------------------ | ------------------- |
| `code-reviewer`        | IPC contract, styling, Electron security conventions               | read-only           |
| `ipc-builder`          | Full IPC channel (main + preload + types)                          | read + edit         |
| `ui-component-builder` | Renderer components, Tailwind v4, shadcn                           | read + write        |
| `db-schema-builder`    | Tables/columns in `DatabaseService`                                | read + edit         |
| `electron-packager`    | Build, typecheck, native modules, installer                        | read + bash + edit  |
| `security-auditor`     | Electron security audit — BrowserWindow, IPC, CSP, preload surface | read-only           |
| `test-writer`          | Vitest unit tests and Playwright E2E tests                         | read + write + bash |
| `a11y-reviewer`        | Keyboard nav, ARIA, focus management, contrast                     | read-only           |
| `performance-reviewer` | Re-renders, Zustand selectors, bundle imports, Framer Motion       | read-only           |

### Skills (`.claude/skills/`) — auto-loaded by file path

| Skill              | Triggers on                                         | Injects                                     |
| ------------------ | --------------------------------------------------- | ------------------------------------------- |
| `ipc-status`       | `src/main/index.ts`, `src/preload/**`               | Live IPC channel inventory + rules          |
| `design-tokens`    | `src/renderer/**/*.{tsx,css}`                       | Live token snapshot + Tailwind v4 rules     |
| `workspace-list`   | `workspaces.ts`, `App.tsx`, `views/**`              | Live workspace registry + routing map       |
| `security-context` | `src/main/index.ts`, `src/preload/**`, `index.html` | Live security config + invariants           |
| `test-conventions` | `**/*.test.*`, `**/*.spec.*`, `vitest.config.ts`    | Mock patterns, what to test, test structure |

### Workflows (`.claude/workflows/`)

| Command            | What it does                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `/code-review`     | Parallel review of all changed files                                        |
| `/add-ipc-channel` | End-to-end IPC channel scaffolding with a spec as args                      |
| `/build-and-check` | Run typecheck + build, then attempt parallel fixes                          |
| `/add-workspace`   | Create a new sidebar workspace (view + registry + router)                   |
| `/security-audit`  | 4-dimension parallel security audit with adversarial verification           |
| `/setup-tests`     | Scaffold Vitest + Testing Library from scratch (run once)                   |
| `/write-tests`     | Write tests for a specific file or feature (pass path as args)              |
| `/full-review`     | Pre-release gate: code + security + a11y + perf + test coverage in parallel |
| `/sync-docs`       | Sync CLAUDE.md, AGENTS.md, and all `.claude/` files to match current code   |

### Hooks (`.claude/hooks/`)

Two hooks run automatically — no user action needed:

**`SessionStart` → `session-start.js`**
Fires when Claude Code opens this project. Injects into context:

- Full command menu with one-line descriptions
- Test infrastructure status (not installed / no tests / N test files)
- CSP gap warning if `src/renderer/index.html` has no Content-Security-Policy
- Currently changed files with a prompt to run `/code-review`

**`PostToolUse` on `Edit|Write` → `check-sync-needed.js`**
Fires after every file edit. Maps the changed file to a targeted action:

| File changed                                        | Suggested action                                     |
| --------------------------------------------------- | ---------------------------------------------------- |
| `src/main/index.ts`                                 | Update preload + types, `/write-tests`, `/sync-docs` |
| `src/preload/index.ts` or `.d.ts`                   | Verify 3-file IPC contract, `/code-review`           |
| `databaseService.ts`                                | `/write-tests`, `/sync-docs`                         |
| `src/shared/types.ts`                               | `/build-and-check`                                   |
| `workspaces.ts` or `App.tsx`                        | Check 3-file workspace consistency                   |
| Any `views/` or `components/` file                  | `/write-tests`, `/code-review`                       |
| `main.css`                                          | `/build-and-check`, `/sync-docs`                     |
| `package.json`                                      | `/setup-tests` if test deps added, `/sync-docs`      |
| `.claude/**` files                                  | `/sync-docs`                                         |
| `electron.vite.config.ts` or `electron-builder.yml` | `/build-and-check`                                   |

## Known security gaps (current baseline)

- `sandbox: false` — required by `better-sqlite3`. Never expose Node APIs to renderer as compensation.
- IPC handlers (`settings:save`, `theme:changed`) accept renderer input without schema validation — add type/range guards before exposing user-facing inputs.
