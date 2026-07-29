---
name: ipc-status
description: Injects a live snapshot of all registered IPC channels into context. Auto-loads when editing src/main/index.ts, src/preload/index.ts, or src/preload/index.d.ts. Use before adding or modifying IPC channels to see what already exists.
when_to_use: Whenever working on IPC channels, preload bridge, or anything that calls window.api
paths:
  - src/main/index.ts
  - src/preload/index.ts
  - src/preload/index.d.ts
---

## Live IPC channel inventory

### Registered ipcMain handlers
!`node -e "const fs=require('fs');const s=fs.readFileSync('src/main/index.ts','utf8');const h=[...s.matchAll(/ipcMain\.(handle|on)\(['\"]([\w:]+)['\"]]/g)].map(m=>({type:m[1],channel:m[2]}));console.log(JSON.stringify(h,null,2))" 2>/dev/null || echo "run from project root"`

### Exposed window.api namespaces
!`node -e "const fs=require('fs');const s=fs.readFileSync('src/preload/index.ts','utf8');const ns=[...s.matchAll(/const (\w+) = \{/g)].map(m=>m[1]).filter(n=>!['api'].includes(n));console.log('Namespaces: '+ns.join(', '))" 2>/dev/null || echo "run from project root"`

### Declared Window['api'] interface
!`node -e "const fs=require('fs');const s=fs.readFileSync('src/preload/index.d.ts','utf8');const methods=[...s.matchAll(/(\w+)\s*\(.*?\)\s*:/g)].map(m=>m[0].trim());console.log(methods.join('\n'))" 2>/dev/null || echo "run from project root"`

---

## IpcResult<T> type (from src/shared/types.ts)

```ts
type IpcResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
```
