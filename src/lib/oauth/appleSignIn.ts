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

export async function signInWithApple(): Promise<AppleSignInResult> {
  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID?.trim()
  const redirectURI = import.meta.env.VITE_APPLE_REDIRECT_URI?.trim()

  if (!clientId || !redirectURI) {
    throw new Error("Apple Sign In 환경변수가 설정되지 않았습니다.")
  }

  await loadAppleSdk()

  if (!window.AppleID?.auth) {
    throw new Error("Apple Sign In SDK가 로드되지 않았습니다.")
  }

  window.AppleID.auth.init({
    clientId,
    redirectURI,
    scope: "name email",
    usePopup: true,
  })

  const response = await window.AppleID.auth.signIn()
  return { authorizationCode: response.authorization.code }
}
