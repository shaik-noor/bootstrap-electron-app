import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { AppSettings } from '../shared/types'

// ── Theme: apply before first paint (kills FOUC) ──────────────────────────────
try {
  const theme = ipcRenderer.sendSync('theme:getInitialSync') as 'light' | 'dark' | null
  if (theme === 'dark' || theme === 'light') {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
  }
} catch {
  // Safe to ignore — ThemeProvider will handle it on first render
}

// ── window.api surface ────────────────────────────────────────────────────────
const api = {
  theme: {
    getInitialSync: (): 'light' | 'dark' =>
      ipcRenderer.sendSync('theme:getInitialSync') as 'light' | 'dark',
    changed: (theme: 'light' | 'dark') => ipcRenderer.invoke('theme:changed', theme)
  },

  settings: {
    load: () => ipcRenderer.invoke('settings:load') as Promise<{ success: boolean; data?: AppSettings; error?: string }>,
    save: (partial: Partial<AppSettings>) => ipcRenderer.invoke('settings:save', partial) as Promise<{ success: boolean; error?: string }>
  },

  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion') as Promise<{ success: boolean; data?: string; error?: string }>
    // Add your own app methods here
  }

  // Add your own namespaces here, e.g.:
  // notes: { ... }
  // vms:   { ... }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (unsafe, dev-only fallback)
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
