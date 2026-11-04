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

/** Apple 콘솔 Return URL에 등록된 현재 origin과 맞춘다. (예: http://localhost:5174/) */
export function getAppleRedirectUri() {
  return `${window.location.origin}/`
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
