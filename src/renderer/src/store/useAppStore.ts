import { create } from 'zustand'
import type { WorkspaceId } from '../lib/workspaces'

export type CurrentView = WorkspaceId | 'home'

interface AppState {
  // ── Navigation ────────────────────────────────────────────────────────────
  currentView: CurrentView
  setView: (view: CurrentView) => void

  // ── Overlay sidebar (shown when sidebar is collapsed) ─────────────────────
  sidebarOverlayOpen: boolean
  setSidebarOverlayOpen: (open: boolean) => void

  // ── Settings dialog ───────────────────────────────────────────────────────
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void

  // ── App version ───────────────────────────────────────────────────────────
  appVersion: string
  loadAppVersion: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'home',
  setView: (view) => set({ currentView: view, sidebarOverlayOpen: false }),

  // Overlay sidebar
  sidebarOverlayOpen: false,
  setSidebarOverlayOpen: (open) => set({ sidebarOverlayOpen: open }),

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
