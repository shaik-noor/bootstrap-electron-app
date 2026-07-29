/** App-wide settings blob stored under the 'app_settings' DB key. */
export interface AppSettings {
  theme?: 'light' | 'dark'
  // Add your own settings fields here
}

/** Generic IPC envelope for fallible operations. */
export interface IpcResult<T = undefined> {
  success: boolean
  data?: T
  error?: string
}
