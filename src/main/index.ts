import { join } from 'node:path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, nativeTheme, shell } from 'electron'
import type { AppSettings } from '../shared/types'
import { initDatabase, loadSettings, saveSettings } from './services/databaseService'

let cachedInitialTheme: 'light' | 'dark' = 'light'

function wrapData<T>(fn: () => T): { success: true; data: T } | { success: false; error: string } {
  try {
    return { success: true, data: fn() }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

function wrapVoid(fn: () => void): { success: boolean; error?: string } {
  try {
    fn()
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

function createWindow(): void {
  const isDark = cachedInitialTheme === 'dark'

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: isDark ? '#191919' : '#f8f7f2',
      symbolColor: isDark ? '#e8e8e8' : '#3a3a3a',
      height: 40
    },
    backgroundColor: isDark ? '#191919' : '#f8f7f2',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpcHandlers(): void {
  ipcMain.on('theme:getInitialSync', (event) => {
    event.returnValue = cachedInitialTheme
  })

  ipcMain.handle('theme:changed', (_event, theme: unknown) => {
    if (theme !== 'light' && theme !== 'dark') {
      return { success: false, error: 'Invalid theme value' }
    }
    return wrapVoid(() => {
      cachedInitialTheme = theme
      saveSettings({ theme })
      const win = BrowserWindow.getAllWindows()[0]
      if (!win) return
      const isDark = theme === 'dark'
      win.setTitleBarOverlay({
        color: isDark ? '#191919' : '#f8f7f2',
        symbolColor: isDark ? '#e8e8e8' : '#3a3a3a',
        height: 40
      })
      win.setBackgroundColor(isDark ? '#191919' : '#f8f7f2')
    })
  })

  ipcMain.handle('settings:load', () => {
    return wrapData(() => loadSettings())
  })

  ipcMain.handle('settings:save', (_event, partial: unknown) => {
    if (!partial || typeof partial !== 'object' || Array.isArray(partial)) {
      return { success: false, error: 'Invalid settings payload' }
    }
    const safe: Partial<AppSettings> = {}
    const p = partial as Record<string, unknown>
    if (p.theme === 'light' || p.theme === 'dark') safe.theme = p.theme
    return wrapVoid(() => saveSettings(safe))
  })

  ipcMain.handle('app:getVersion', () => {
    return wrapData(() => app.getVersion())
  })
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.yourname.myapp')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  try {
    await initDatabase()
  } catch (e) {
    console.error('Failed to initialise database:', e)
    app.quit()
    return
  }

  const settings = loadSettings()
  if (settings.theme === 'light' || settings.theme === 'dark') {
    cachedInitialTheme = settings.theme
  } else {
    cachedInitialTheme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  }

  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
