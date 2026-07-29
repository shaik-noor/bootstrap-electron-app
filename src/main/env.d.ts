/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MAIN_VITE_UPDATE_SERVER_HOST?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
