---
name: design-tokens
description: Injects all CSS design tokens and Tailwind v4 conventions into context. Auto-loads when editing any CSS, Tailwind class, or renderer component file.
when_to_use: Whenever writing Tailwind classes, CSS custom properties, or any renderer styling
paths:
  - src/renderer/src/assets/main.css
  - src/renderer/src/**/*.tsx
  - src/renderer/src/**/*.css
---

## Live design token snapshot

!`node -e "const fs=require('fs');const s=fs.readFileSync('src/renderer/src/assets/main.css','utf8');const tokens=[...s.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(m=>m[1]+': '+m[2].trim());console.log(tokens.join('\n'))" 2>/dev/null || echo "run from project root"`

---

## Tailwind v4 rules (hard)

- Tokens are `oklch(...)` values — use `var(--token)` directly in utilities
- **Never** `hsl(var(--token))` or hardcoded hex/rgb for theme colors
- Minimum font size: `text-2xs` (11px)
- No `border-0` on `bg-card` surfaces
- Dark sidebar background `#191919` — keep in sync across:
  - CSS `--sidebar` token in `main.css`
  - `titleBarOverlay` in `src/main/index.ts` `createWindow()`
  - `theme:changed` handler background color in `src/main/index.ts`

## Class composition

```ts
// Always use cn() for conditional classes (clsx + tailwind-merge)
import { cn } from '@/lib/utils'
className={cn('base-classes', condition && 'conditional-class', className)}
```

