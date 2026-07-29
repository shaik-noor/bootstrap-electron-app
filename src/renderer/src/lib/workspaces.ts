import { LayoutDashboard, type LucideIcon } from 'lucide-react'

/**
 * Workspace registry — single source of truth for the sidebar switcher,
 * title bar, and any nav surface. Add your workspaces here.
 *
 * colour tokens must be full literal strings (no concatenation) so Tailwind
 * keeps them in the generated CSS.
 */

export interface WorkspaceTint {
  tile: string
  tileHover: string
  chip: string
}

const TINT = {
  violet: {
    tile: 'bg-violet-500/10 text-violet-500',
    tileHover: 'group-hover:bg-violet-500/20',
    chip: 'bg-violet-500/10 border-violet-500/20 text-violet-500'
  },
  emerald: {
    tile: 'bg-emerald-500/10 text-emerald-500',
    tileHover: 'group-hover:bg-emerald-500/20',
    chip: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
  },
  amber: {
    tile: 'bg-amber-500/10 text-amber-500',
    tileHover: 'group-hover:bg-amber-500/20',
    chip: 'bg-amber-500/10 border-amber-500/20 text-amber-500'
  },
  blue: {
    tile: 'bg-blue-500/10 text-blue-500',
    tileHover: 'group-hover:bg-blue-500/20',
    chip: 'bg-blue-500/10 border-blue-500/20 text-blue-500'
  },
  indigo: {
    tile: 'bg-indigo-500/10 text-indigo-500',
    tileHover: 'group-hover:bg-indigo-500/20',
    chip: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'
  }
} satisfies Record<string, WorkspaceTint>

export type WorkspaceId = 'dashboard' // Add more workspace IDs here, e.g. | 'settings' | 'data'

export interface WorkspaceMeta {
  id: WorkspaceId
  name: string
  description: string
  group: string
  icon: LucideIcon
  tint: WorkspaceTint
}

/**
 * Add an entry here for each new workspace.
 * The first entry is the default after boot.
 */
export const WORKSPACES: WorkspaceMeta[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Overview & quick actions',
    group: 'workspace',
    icon: LayoutDashboard,
    tint: TINT.violet
  }
  // Add more workspaces here:
  // { id: 'notes', name: 'Notes', description: '...', group: 'workspace', icon: FileText, tint: TINT.emerald }
]

export const WORKSPACE_GROUPS: { id: string; label: string }[] = [
  { id: 'workspace', label: 'Workspace' }
  // Add more groups here, e.g.: { id: 'insights', label: 'Insights' }
]

export function getWorkspaceMeta(id: WorkspaceId): WorkspaceMeta | undefined {
  return WORKSPACES.find((w) => w.id === id)
}

export function workspaceName(id: WorkspaceId | 'home'): string {
  if (id === 'home') return 'Home'
  return getWorkspaceMeta(id)?.name ?? 'MyApp'
}
