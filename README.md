# Electron Bootstrap

A production-ready Electron skeleton with a full design system, IPC contract, SQLite persistence, and multi-agent Claude Code tooling baked in.

## Stack

| Layer         | Technology                           |
| ------------- | ------------------------------------ |
| Desktop shell | Electron 39                          |
| Bundler       | electron-vite + Vite 7               |
| UI            | React 19 + TypeScript 5              |
| Styling       | Tailwind v4 + shadcn/ui (radix-lyra) |
| Animation     | Framer Motion 12                     |
| State         | Zustand 5                            |
| Persistence   | SQLite via better-sqlite3            |
| Icons         | Lucide React                         |
| Linting       | Biome                                |

## What's included

- **Custom frameless title bar** with drag region, sidebar toggle, workspace switcher pill, theme toggle, and native Win/Mac caption-button spacer
- **Collapsible sidebar** with workspace switcher popover and overlay float mode when collapsed
- **Dark/light theme** — persisted to SQLite, applied before first paint (no FOUC), synced to the native `titleBarOverlay`
- **Toast system** — `toast.success/error/info/warning()` imperative API backed by a Zustand store
- **Confirm dialog** — async `confirmDialog(opts)` replaces `window.confirm()`
- **Boot screen** — animated splash while the app hydrates
- **Empty state component** — `<EmptyState icon title description />`
- **Settings dialog** — extensible in-app settings panel
- **IPC 3-file contract** — typed end-to-end: `main/index.ts` → `preload/index.ts` → `preload/index.d.ts`
- **IPC input validation** — `theme:changed` and `settings:save` reject invalid renderer input before touching the DB
- **SQLite service** — module-level `initDatabase / loadSettings / saveSettings` with idempotent init and migration stub
- **Motion tokens** — `duration`, `ease`, `fadeRise`, `staggerContainer` in `lib/motion.ts`
- **Two views wired** — `HomeView` (workspace quick-nav) + `DashboardView` (greeting, clock, stats, quick actions)
- **Workspace registry** — `lib/workspaces.ts` is the single source of truth for workspace IDs, names, icons, and tint colours
- **Claude Code agents & workflows** — `.claude/` ships purpose-built agents, slash-command workflows, and auto-running hooks

## Commands

```bash
npm run dev           # Start with HMR
npm run build         # Typecheck + build
npm run build:win     # Windows NSIS installer
npm run build:mac     # macOS DMG (arm64 + x64)
npm run build:linux   # AppImage + snap
npm run typecheck     # Type-check main + renderer
npm run lint          # Biome lint
npm run format        # Biome format --write
npm run check         # Biome lint + format together
```

## Customisation checklist

### 1. Rename the app

| File | What to change |
| --- | --- |
| `package.json` | `name`, `productName`, `author` |
| `electron-builder.yml` | `appId`, `productName`, `win.executableName` |
| `src/renderer/index.html` | `<title>` |
| `src/main/index.ts` | `setAppUserModelId(...)` |
| `src/renderer/src/components/BootScreen.tsx` | wordmark text + icon placeholder |
| `src/renderer/src/components/Sidebar.tsx` | "MyApp" header string |
| `src/renderer/src/views/HomeView.tsx` | "MyApp" heading |
| `src/renderer/src/components/SettingsDialog.tsx` | "MyApp" about text |

### 2. Add workspaces (3-file pattern)

1. **`src/renderer/src/lib/workspaces.ts`** — extend `WorkspaceId` union, add a `WORKSPACES` entry with a `tint` from `violet | emerald | amber | blue | indigo`
2. **`src/renderer/src/App.tsx`** — add a `case 'newid':` to `renderContent()`
3. **`src/renderer/src/views/NewIdView.tsx`** — create the view component

Optional: add contextual sidebar nav in `Sidebar.tsx` → `renderWorkspaceContent()` switch.

Or use the slash command: `/add-workspace <description>`

### 3. Add IPC channels (3-file pattern)

1. **`src/main/index.ts`** — `ipcMain.handle('namespace:method', ...)` wrapped with `wrapData` or `wrapVoid`
2. **`src/preload/index.ts`** — add the wrapper to the `api` object
3. **`src/preload/index.d.ts`** — mirror the method in `Window.api`

Renderer calls `window.api.namespace.method(...)` and checks `.success` before using `.data`.

Or use the slash command: `/add-ipc-channel <description>`

### 4. Add database tables

Edit `src/main/services/databaseService.ts`:

- Add `CREATE TABLE IF NOT EXISTS ...` in `createTables()`
- Add guarded `ALTER TABLE` steps in `checkAndMigrate()`
- Add `export function save*/load*` functions below

### 5. Add UI components

```bash
npx shadcn add <component-name>
```

Components land in `src/renderer/src/components/ui/`. Always use `var(--token)` — never `hsl(var(--token))` — the CSS vars are `oklch(...)`.

### 6. Extend the store

Edit `src/renderer/src/store/useAppStore.ts` — add state slices and load actions, then wire new `load*` calls into the `Promise.allSettled` in `App.tsx`'s boot effect.

## Design conventions

| Rule | Why |
| --- | --- |
| Minimum font `text-2xs` (11px) | Prevents illegible metadata text |
| `var(--token)` direct, never `hsl(var(--token))` | Tokens are `oklch(...)` values |
| No `window.alert` / `window.confirm` | Use `toast.*` / `confirmDialog()` |
| No `border-0` on `bg-card` surfaces | Card needs a border to lift off background |
| Dark sidebar hex `#191919` kept in sync | Must match `titleBarOverlay` + `backgroundColor` in main process |
| IPC envelope `{ success, data?, error? }` | Consistent fallible IPC across all channels |

## Known security baseline

- `sandbox: false` — required by `better-sqlite3`. Node APIs are never forwarded to the renderer.
- IPC handlers validate all renderer input before touching the database.

## Claude Code tooling

This project ships a full `.claude/` harness:

| Command | What it does |
| --- | --- |
| `/code-review` | Review changed files before committing |
| `/build-and-check` | Typecheck + build, auto-fix errors |
| `/security-audit` | Electron security audit |
| `/full-review` | Pre-release gate: code + security + a11y + perf |
| `/add-ipc-channel` | Scaffold a new IPC channel end-to-end |
| `/add-workspace` | Add a new sidebar workspace |
| `/setup-tests` | Bootstrap Vitest from scratch |
| `/write-tests <file>` | Write tests for a specific file |
| `/sync-docs` | Keep CLAUDE.md, AGENTS.md, and skills in sync |
