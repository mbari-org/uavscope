/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TATOR_HOST: string
  readonly VITE_TATOR_TOKEN: string
  readonly VITE_PROJECT_ID: string
  readonly VITE_BOX_TYPE: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_MAX_RETRIES: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
