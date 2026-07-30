---
name: security-context
description: Injects the current Electron security posture into context. Auto-loads when editing BrowserWindow config, preload, or IPC handlers so security constraints are always visible.
when_to_use: Whenever editing BrowserWindow options, webPreferences, IPC handlers, preload script, or shell.openExternal calls
paths:
  - src/main/index.ts
  - src/preload/index.ts
  - src/renderer/index.html
---

## Current security configuration snapshot

### BrowserWindow webPreferences

!`node -e "const fs=require('fs');const s=fs.readFileSync('src/main/index.ts','utf8');const m=s.match(/webPreferences:\s*\{([^}]+)\}/s);console.log(m?m[0]:'not found')" 2>/dev/null`

### window.api surface (contextBridge exposure)

!`node -e "const fs=require('fs');const s=fs.readFileSync('src/preload/index.ts','utf8');const m=s.match(/const api = \{([\s\S]+?)\n\}/);console.log(m?m[0].substring(0,800):'not found')" 2>/dev/null`

### CSP in index.html

!`node -e "const fs=require('fs');const s=fs.readFileSync('src/renderer/index.html','utf8');const m=s.match(/Content-Security-Policy[^>]+>/i);console.log(m?m[0]:'NO CSP META TAG FOUND')" 2>/dev/null`

---

## Electron security invariants (never change these)

| Setting            | Required value    | Why                                                                                      |
| ------------------ | ----------------- | ---------------------------------------------------------------------------------------- |
| `contextIsolation` | `true`            | Prevents renderer from accessing main-process Node.js scope                              |
| `nodeIntegration`  | `false`           | Prevents renderer JS from requiring Node modules directly                                |
| `webSecurity`      | `true` (default)  | Enforces same-origin policy                                                              |
| `sandbox`          | `false` (current) | Required by `better-sqlite3` native module — **do not expose Node APIs as compensation** |

## IPC input validation rules

Every IPC handler that receives data from the renderer **must** validate before acting:

- Allowlist expected argument types (`typeof arg === 'string'`, `Object.keys(arg).every(k => ALLOWED.has(k))`)
- Reject empty/null where not expected
- Never pass renderer-supplied strings directly to SQL (use parameterised queries only)
- Never pass renderer-supplied strings to `child_process`, `eval`, or `shell.openExternal` without scheme validation

## shell.openExternal safety

```ts
// Only allow safe schemes — validate before calling
const SAFE_SCHEMES = ['https:', 'mailto:']
const url = new URL(details.url)
if (SAFE_SCHEMES.includes(url.protocol)) {
  shell.openExternal(details.url)
}
```

## Missing CSP (current gap)

The app does not currently set a Content Security Policy. Recommended `<meta>` for `src/renderer/index.html`:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'none'"
/>
```

`'unsafe-inline'` for styles is required by Tailwind v4's runtime injection. `connect-src 'none'` is safe because all network calls go through the main process via IPC.
