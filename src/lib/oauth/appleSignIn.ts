import { loadAppleSdk } from "./loadAuthSdk"

export type AppleSignInResult = {
  authorizationCode: string
}

const APPLE_POPUP_CANCELLED_CODES = new Set([
  "popup_closed_by_user",
  "user_cancelled_authorize",
])

export function isApplePopupCancelled(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    APPLE_POPUP_CANCELLED_CODES.has((error as { error: string }).error)
  )
}

/**
 * Apple 콘솔 Return URL과 글자 단위로 맞춘다.
 * 등록 예: https://dev.auth.university.neordinary.com/oauth/apple/callback
 * usePopup이라 콜백 페이지는 없어도 된다.
 */
export function getAppleRedirectUri() {
  return `${window.location.origin}/oauth/apple/callback`
}

export async function signInWithApple(): Promise<AppleSignInResult> {
  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID?.trim()

  if (!clientId) {
    throw new Error("VITE_APPLE_CLIENT_ID가 설정되지 않았습니다.")
  }

  await loadAppleSdk()

  if (!window.AppleID?.auth) {
    throw new Error("Apple Sign In SDK가 로드되지 않았습니다.")
  }

  window.AppleID.auth.init({
    clientId,
    redirectURI: getAppleRedirectUri(),
    scope: "name email",
    usePopup: true,
  })

  const response = await window.AppleID.auth.signIn()
  return { authorizationCode: response.authorization.code }
}
