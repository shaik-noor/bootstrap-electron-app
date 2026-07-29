import { app, shell, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { DatabaseService } from './services/databaseService'
import type { AppSettings } from '../shared/types'

// ── Sync theme cache ──────────────────────────────────────────────────────────
// Read once at startup into a sync-accessible variable so the preload's
// theme:getInitialSync can return it without awaiting the DB.
let cachedInitialTheme: 'light' | 'dark' = 'light'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Wrap a fallible handler returning { success, data }. */
function wrapData<T>(fn: () => T): { success: true; data: T } | { success: false; error: string } {
  try {
    return { success: true, data: fn() }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

/** Wrap a fallible void handler returning { success }. */
function wrapVoid(fn: () => void): { success: boolean; error?: string } {
  try {
    fn()
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow(): void {
  const isDark = cachedInitialTheme === 'dark'

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    // Frameless custom chrome — matches the TitleBar component
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

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ── IPC Handlers ─────────────────────────────────────────────────────────────

function registerIpcHandlers(): void {
  // ── Theme (sync + async) ─────────────────────────────────────────────────
  // Sync read used by the preload to apply the theme before first paint (no FOUC).
  ipcMain.on('theme:getInitialSync', (event) => {
    event.returnValue = cachedInitialTheme
  })

  ipcMain.handle('theme:changed', (_event, theme: 'light' | 'dark') => {
    return wrapVoid(() => {
      cachedInitialTheme = theme
      DatabaseService.saveSettings({ theme })

      // Update the native title-bar overlay to match the new theme
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

  // ── Settings ────────────────────────────────────────────────────────────
  ipcMain.handle('settings:load', () => {
    return wrapData(() => DatabaseService.loadSettings())
  })

  ipcMain.handle('settings:save', (_event, partial: Partial<AppSettings>) => {
    return wrapVoid(() => DatabaseService.saveSettings(partial))
  })

  // ── App actions ──────────────────────────────────────────────────────────
  ipcMain.handle('app:getVersion', () => {
    return wrapData(() => app.getVersion())
  })

  // Add your own IPC handlers here following the 3-file contract:
  //   1. ipcMain.handle('namespace:method', ...) here
  //   2. wrapper in src/preload/index.ts
  //   3. type in src/preload/index.d.ts
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.yourname.myapp')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Init DB first — always before createWindow so handlers can use the DB.
  try {
    await DatabaseService.init()
  } catch (e) {
    console.error('Failed to initialise database:', e)
    app.quit()
    return
  }

  // Load persisted theme into the sync cache before the window opens.
  const settings = DatabaseService.loadSettings()
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
