export interface AppSettings {
  theme?: 'light' | 'dark'
}

export interface IpcResult<T = undefined> {
  success: boolean
  data?: T
  error?: string
}
