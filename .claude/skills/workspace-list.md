---
name: workspace-list
description: Injects the live workspace registry and routing map into context. Auto-loads when editing workspaces.ts, App.tsx, Sidebar.tsx, or any view file.
when_to_use: Whenever adding, renaming, or rerouting workspaces; or when building sidebar/navigation components
paths:
  - src/renderer/src/lib/workspaces.ts
  - src/renderer/src/App.tsx
  - src/renderer/src/components/Sidebar.tsx
  - src/renderer/src/views/**
---

## Live workspace registry

!`node -e "const fs=require('fs');try{const s=fs.readFileSync('src/renderer/src/lib/workspaces.ts','utf8');console.log(s)}catch(e){console.log('File not found — run from project root')}" 2>/dev/null`

## Live view routing (from App.tsx)

!`node -e "const fs=require('fs');try{const s=fs.readFileSync('src/renderer/src/App.tsx','utf8');const views=[...s.matchAll(/import\s+(\w+View)\s+from\s+['\"](.*?)['\"]|case\s+['\"]([\w-]+)['\"]|activeWorkspace\s*===?\s*['\"]([\w-]+)['\"]]/g)].map(m=>m[0].trim());console.log(views.join('\n'))}catch(e){console.log('run from project root')}" 2>/dev/null`

---

## Workspace conventions

Each workspace entry in `src/renderer/src/lib/workspaces.ts` has:
- `id` — camelCase string, matches routing key in `App.tsx`
- `name` — display name shown in sidebar
- `icon` — Lucide React icon component
- `tint` — per-workspace accent color (oklch value)

## Adding a workspace (3 files)

1. `src/renderer/src/lib/workspaces.ts` — add registry entry
2. `src/renderer/src/views/<Name>View.tsx` — create view component
3. `src/renderer/src/App.tsx` — import view and add routing case

Or use `/add-workspace <name>` to do all three automatically.

## View component pattern

Follow the pattern in `src/renderer/src/views/DashboardView.tsx`:
- Default export, no props required
- Uses Tailwind v4 tokens, Lucide icons, shadcn/ui primitives
- No direct IPC calls in the view — use `window.api.*` via a hook or store action
