import type { ElectronAPI } from '@electron-toolkit/preload'
import type { AppSettings } from '../shared/types'

/** Generic IPC result envelope. */
interface IpcResult<T = undefined> {
  success: boolean
  data?: T
  error?: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      theme: {
        getInitialSync(): 'light' | 'dark'
        changed(theme: 'light' | 'dark'): Promise<IpcResult>
      }
      settings: {
        load(): Promise<IpcResult<AppSettings>>
        save(partial: Partial<AppSettings>): Promise<IpcResult>
      }
      app: {
        getVersion(): Promise<IpcResult<string>>
        // Add your own app methods here
      }
      // Add your own namespaces here to match preload/index.ts
    }
  }
}
