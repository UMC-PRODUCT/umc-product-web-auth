/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALLOWED_RETURN_ORIGINS?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_DEV_API_PROXY_TARGET?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_KAKAO_APP_KEY?: string
  readonly VITE_KAKAO_REST_API_KEY?: string
  readonly VITE_APPLE_CLIENT_ID?: string
  /** 쉼표로 구분. Activity 로그인 허브 브랜딩에 매핑되는 OAuth client_id */
  readonly VITE_LOGIN_CLIENT_IDS_ACTIVITY?: string
  /** 쉼표로 구분. Admin(운영진) 로그인 허브 브랜딩에 매핑되는 OAuth client_id */
  readonly VITE_LOGIN_CLIENT_IDS_ADMIN?: string
  /** UI 분기 강제 (로컬 테스트). activity | admin | default. 설정 시 client_id 보다 우선 */
  readonly VITE_LOGIN_UI_TEST?: string
  /** 운영진 권한 없음 Dialog CTA. 있으면 「UMC 홈으로」이동, 없으면 「확인」으로 닫기 */
  readonly VITE_UMC_HOME_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
