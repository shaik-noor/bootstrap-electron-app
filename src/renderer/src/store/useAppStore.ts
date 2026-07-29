import { create } from 'zustand'
import type { WorkspaceId } from '../lib/workspaces'

export type CurrentView = WorkspaceId | 'home'

interface AppState {
  // ── Navigation ────────────────────────────────────────────────────────────
  currentView: CurrentView
  setView: (view: CurrentView) => void

  // ── Settings dialog ───────────────────────────────────────────────────────
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void

  // ── App version ───────────────────────────────────────────────────────────
  appVersion: string
  loadAppVersion: () => Promise<void>

  // ── Add your own state slices below ───────────────────────────────────────
  // e.g.:
  // items: Item[]
  // loadItems: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'home',
  setView: (view) => set({ currentView: view }),

  // Settings
  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  // App version
  appVersion: '',
  loadAppVersion: async () => {
    const res = await window.api.app.getVersion()
    if (res.success && res.data) set({ appVersion: res.data })
  }
}))
