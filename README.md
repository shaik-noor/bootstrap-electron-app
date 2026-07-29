# Electron Bootstrap

A production-ready Electron skeleton extracted from the MyDesk app.  
Same design system, same conventions, zero feature-specific code.

## Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron 39 |
| Bundler | electron-vite + Vite 7 |
| UI | React 19 + TypeScript 5 |
| Styling | Tailwind v4 + shadcn/ui (radix-lyra) |
| Animation | Framer Motion 12 |
| State | Zustand 5 |
| Persistence | SQLite via better-sqlite3 + Drizzle ORM |
| Icons | Lucide React |

## What's included

- **Custom frameless title bar** with drag region, sidebar toggle, workspace
  switcher pill, theme toggle, and native Win/Mac caption-button spacer
- **Collapsible sidebar** (shadcn sidebar + overlay float mode) with
  workspace switcher popover
- **Dark/light theme** — persisted to SQLite, applied before first paint
  (no FOUC), synced to the Electron `titleBarOverlay`
- **Toast system** — imperative `toast.success/error/info()` API backed by
  a standalone Zustand store, rendered by `<Toaster />`
- **Confirm dialog** — async `confirmDialog(opts)` replaces `window.confirm()`
- **Boot screen** — branded animated splash while the app hydrates
- **Empty state component** — consistent `<EmptyState icon title description />`
- **Settings dialog** — extensible in-app settings panel
- **IPC 3-file contract** — `main/index.ts` → `preload/index.ts` → `preload/index.d.ts`
- **SQLite service** — `DatabaseService` with idempotent `init()` + migration pattern
- **Motion tokens** — `duration`, `ease`, `fadeRise`, `staggerContainer`
- **Two views wired** — `HomeView` (workspace quick-nav) + `DashboardView` (stats strip + feed)
- **Workspace registry** — `lib/workspaces.ts` is the single source of truth for
  workspace IDs, names, descriptions, icons, and tint colours

## Getting started

```bash
# 1. Copy this folder to your project location
cp -r bootstrap /path/to/your-new-app
cd your-new-app

# 2. Install dependencies
npm install

# 3. Run in dev mode (HMR)
npm run dev

# 4. Typecheck (split into node + web projects)
npm run typecheck

# 5. Build
npm run build
npm run build:win   # Windows installer
npm run build:mac   # macOS DMG
npm run build:linux # AppImage / snap
```

## Customisation checklist

### 1. Rename the app
- `package.json` → `name`, `productName`, `author`
- `electron-builder.yml` → `appId`, `productName`, `win.executableName`
- `src/renderer/index.html` → `<title>`
- `src/main/index.ts` → `electronApp.setAppUserModelId(...)`
- `src/renderer/src/components/BootScreen.tsx` → wordmark text
- Replace the `M` placeholder icon with a real `appIcon` import

### 2. Add workspaces
Edit `src/renderer/src/lib/workspaces.ts`:
```ts
export type WorkspaceId = 'dashboard' | 'notes'   // add your id

export const WORKSPACES: WorkspaceMeta[] = [
  // existing...
  {
    id: 'notes',
    name: 'Notes',
    description: 'Your case notes',
    group: 'workspace',
    icon: FileText,
    tint: TINT.emerald
  }
]
```
Then add:
- A view component under `src/renderer/src/views/`
- A case in `App.tsx` → `renderContent()`
- Optional sidebar content in `Sidebar.tsx` → `renderWorkspaceContent()`

### 3. Add IPC
Follow the **3-file contract**:
1. `src/main/index.ts` — `ipcMain.handle('namespace:method', ...)`
2. `src/preload/index.ts` — add the wrapper to the `api` object
3. `src/preload/index.d.ts` — mirror the method in `Window.api`

Use the helpers: `wrapData(fn)` → `{success,data}`, `wrapVoid(fn)` → `{success}`.

### 4. Add database tables
Edit `src/main/services/databaseService.ts`:
- Add `CREATE TABLE IF NOT EXISTS ...` in `createTables()`
- Add guarded `ALTER TABLE` migration steps in `checkAndMigrate()`
- Add `save*/load*` static methods

### 5. Add UI components
Run the shadcn CLI from inside the bootstrap folder:
```bash
npx shadcn add <component-name>
```
Components land in `src/renderer/src/components/ui/`.  
**Always use `var(--token)` not `hsl(var(--token))`** — the CSS vars are `oklch(...)`.

### 6. Add to the store
Edit `src/renderer/src/store/useAppStore.ts` — add state slices, actions, and
load functions. Call new `load*` actions from `App.tsx`'s boot `Promise.allSettled`.

## Design conventions

| Rule | Reason |
|------|--------|
| Minimum font: `text-2xs` (11px) | Prevents illegible metadata |
| Chart/CSS colours: `var(--token)` direct, never `hsl(var(--token))` | Tokens are `oklch(...)` |
| No `window.alert/confirm` | Use `toast.*` / `confirmDialog()` |
| No `border-0` on `bg-card` surfaces | White card needs its own border to lift off background |
| Dark sidebar hex `#191919` kept in sync | Main process `titleBarOverlay` + `backgroundColor` must match |
| Envelope convention: `{ success, data?, error? }` | Consistent fallible IPC |
