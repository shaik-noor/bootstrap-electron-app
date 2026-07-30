import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'
import type { AppSettings } from '../shared/types'

try {
  const theme = ipcRenderer.sendSync('theme:getInitialSync') as 'light' | 'dark' | null
  if (theme === 'dark' || theme === 'light') {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
  }
} catch {
  // ThemeProvider handles it on first render
}

const api = {
  theme: {
    getInitialSync: (): 'light' | 'dark' =>
      ipcRenderer.sendSync('theme:getInitialSync') as 'light' | 'dark',
    changed: (theme: 'light' | 'dark') => ipcRenderer.invoke('theme:changed', theme)
  },

  settings: {
    load: () =>
      ipcRenderer.invoke('settings:load') as Promise<{
        success: boolean
        data?: AppSettings
        error?: string
      }>,
    save: (partial: Partial<AppSettings>) =>
      ipcRenderer.invoke('settings:save', partial) as Promise<{ success: boolean; error?: string }>
  },

  app: {
    getVersion: () =>
      ipcRenderer.invoke('app:getVersion') as Promise<{
        success: boolean
        data?: string
        error?: string
      }>
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error -- dev-only fallback when contextIsolation is disabled
  window.electron = electronAPI
  // @ts-expect-error -- dev-only fallback when contextIsolation is disabled
  window.api = api
}
