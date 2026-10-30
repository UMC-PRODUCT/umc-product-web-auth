/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALLOWED_RETURN_ORIGINS?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_DEV_API_PROXY_TARGET?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_KAKAO_APP_KEY?: string
  readonly VITE_KAKAO_REST_API_KEY?: string
  readonly VITE_APPLE_CLIENT_ID?: string
  readonly VITE_APPLE_REDIRECT_URI?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
