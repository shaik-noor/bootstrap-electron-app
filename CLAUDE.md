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

- **`src/main/`** — Node.js main process. Creates a single frameless `BrowserWindow`, bootstraps `DatabaseService` (SQLite via better-sqlite3), registers all `ipcMain` handlers.
- **`src/preload/`** — Bridge script. Exposes a typed `window.api` object to the renderer via `contextBridge`. Also applies the persisted theme to `document.documentElement` synchronously before any React code runs (FOUC prevention layer 2).
- **`src/renderer/`** — React 19 SPA, bundled by Vite + Tailwind v4. `ThemeProvider` wraps the entire app.
- **`src/shared/`** — Types shared across all three processes (`AppSettings`, `IpcResult<T>`).

Two TypeScript projects exist with separate configs: `tsconfig.node.json` (main + preload + shared) and `tsconfig.web.json` (renderer + shared + preload types).

## IPC Contract (3-file pattern)

Adding a new IPC channel requires edits to exactly three files:

1. **`src/main/index.ts`** — register with `ipcMain.handle()` (async) or `ipcMain.on()` (sync). Wrap the handler with `wrapData<T>(fn)` for typed returns or `wrapVoid(fn)` for void operations. Both produce the `IpcResult<T>` envelope `{ success, data?, error? }`.

2. **`src/preload/index.ts`** — add a typed wrapper function that calls `ipcRenderer.invoke()` (or `sendSync` for sync channels), grouped into a namespace object. Add the function to the `api` object passed to `exposeInMainWorld`.

3. **`src/preload/index.d.ts`** — extend the `Window['api']` interface with the new function signature.

Renderer code calls `window.api.<namespace>.<method>(...)` and checks `.success` before using `.data`.

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
- **State**: Zustand store in `src/renderer/src/store/useAppStore.ts`.

## Prettier Config

No semicolons, single quotes, 100-char print width, no trailing commas, 2-space indent.
