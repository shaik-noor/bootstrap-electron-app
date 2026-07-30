---
name: test-conventions
description: Injects the project's test setup, mocking patterns, and what-to-test rules into context. Auto-loads when editing or creating test files.
when_to_use: Whenever writing, editing, or debugging test files
paths:
  - src/**/__tests__/**
  - src/**/*.test.ts
  - src/**/*.test.tsx
  - src/**/*.spec.ts
  - e2e/**/*.spec.ts
  - vitest.config.ts
  - playwright.config.ts
---

## Test stack status

!`node -e "const p=require('./package.json');const deps={...p.dependencies,...p.devDependencies};const found=['vitest','@vitest/ui','@testing-library/react','@testing-library/user-event','@playwright/test','@electron/test','happy-dom'].filter(d=>deps[d]);const missing=['vitest','@testing-library/react','@playwright/test'].filter(d=>!deps[d]);console.log('Installed: '+(found.join(', ')||'none'));console.log('Missing: '+(missing.join(', ')||'none — run /setup-tests to scaffold'))" 2>/dev/null`

## Existing test files

!`find src e2e -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | sort || echo "No test files yet"`

---

## Electron mock — required at top of every main/preload test

```ts
vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn(), on: vi.fn() },
  ipcRenderer: { invoke: vi.fn(), sendSync: vi.fn() },
  app: {
    getVersion: vi.fn(() => '0.0.0'),
    getPath: vi.fn(() => require('os').tmpdir()),
    quit: vi.fn(),
    whenReady: vi.fn(async () => {})
  },
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
    prototype: { setTitleBarOverlay: vi.fn(), setBackgroundColor: vi.fn() }
  },
  nativeTheme: { shouldUseDarkColors: false },
  shell: { openExternal: vi.fn() },
  contextBridge: { exposeInMainWorld: vi.fn() }
}))
```

## window.api mock — required at top of every renderer test

```ts
// src/renderer/src/__tests__/setup.ts (imported via vitest setupFiles)
Object.assign(window, {
  api: {
    theme: {
      getInitialSync: vi.fn(() => 'light' as const),
      changed: vi.fn(async () => ({ success: true }))
    },
    settings: {
      load: vi.fn(async () => ({ success: true, data: {} })),
      save: vi.fn(async () => ({ success: true }))
    },
    app: {
      getVersion: vi.fn(async () => ({ success: true, data: '0.0.0' }))
    }
  }
})
```

## DatabaseService — use in-memory SQLite

```ts
import { tmpdir } from 'os'
vi.mock('electron', () => ({ app: { getPath: vi.fn(() => tmpdir()) } }))

beforeEach(async () => {
  await DatabaseService.init()
})
afterEach(() => {
  /* DatabaseService exposes no close() yet — add one when needed */
})
```

## IpcResult<T> assertions

```ts
// Always assert .success before accessing .data
const result = await handler()
expect(result.success).toBe(true)
if (result.success) expect(result.data).toEqual(expected)

// For error path
const bad = await handler(invalidInput)
expect(bad.success).toBe(false)
expect(bad.error).toMatch(/expected pattern/)
```

## What NOT to test

- Rendering output of third-party components (shadcn/ui, Radix, Framer Motion)
- That `ipcMain.handle` was called (Electron test infra concern, not app logic)
- CSS class presence (brittle, couples to implementation)
