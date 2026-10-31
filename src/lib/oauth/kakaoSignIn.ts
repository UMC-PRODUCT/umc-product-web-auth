import { loadKakaoSdk } from "./loadAuthSdk"

const KAKAO_REDIRECT_PATH = "/oauth/kakao/callback"
const KAKAO_STATE_KEY = "umc.auth.kakaoOAuthState"

export function getKakaoRedirectUri() {
  return `${window.location.origin}${KAKAO_REDIRECT_PATH}`
}

export function consumeKakaoState(received: string | null) {
  const saved = sessionStorage.getItem(KAKAO_STATE_KEY)
  sessionStorage.removeItem(KAKAO_STATE_KEY)
  return Boolean(saved) && saved === received
}

function generateSecureState() {
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  )
}

export async function startKakaoSignIn() {
  const appKey = import.meta.env.VITE_KAKAO_APP_KEY?.trim()
  if (!appKey) {
    throw new Error("VITE_KAKAO_APP_KEY가 설정되지 않았습니다.")
  }

  await loadKakaoSdk()

  if (!window.Kakao) {
    throw new Error("Kakao SDK가 로드되지 않았습니다.")
  }
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(appKey)
  }

  const state = generateSecureState()
  sessionStorage.setItem(KAKAO_STATE_KEY, state)
  window.Kakao.Auth.authorize({
    redirectUri: getKakaoRedirectUri(),
    state,
  })
}

type KakaoTokenResponse = {
  access_token?: string
  id_token?: string
  error?: string
  error_description?: string
}

export async function exchangeKakaoAuthorizationCode(code: string) {
  const clientId =
    import.meta.env.VITE_KAKAO_REST_API_KEY?.trim() ||
    import.meta.env.VITE_KAKAO_APP_KEY?.trim()
  if (!clientId) {
    throw new Error("카카오 토큰 교환용 앱 키가 설정되지 않았습니다.")
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: getKakaoRedirectUri(),
    code,
  })

  const response = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  const payload = (await response.json()) as KakaoTokenResponse
  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ??
        payload.error ??
        "카카오 토큰 교환에 실패했습니다.",
    )
  }

  return {
    accessToken: payload.access_token,
    idToken: payload.id_token,
  }
}
