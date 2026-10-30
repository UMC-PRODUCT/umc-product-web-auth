import { loadGoogleGsi } from "./loadAuthSdk"

export type GoogleSignInResult = {
  accessToken: string
}

export function isGooglePopupCancelled(error: unknown) {
  if (typeof error !== "object" || error === null || !("type" in error)) {
    return false
  }
  const type = (error as { type: string }).type
  return type === "popup_closed" || type === "popup_failed_to_open"
}

export function signInWithGoogle(): Promise<GoogleSignInResult> {
  return new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()
    if (!clientId) {
      reject(new Error("VITE_GOOGLE_CLIENT_ID가 설정되지 않았습니다."))
      return
    }

    loadGoogleGsi()
      .then(() => {
        const oauth2 = window.google?.accounts.oauth2
        if (!oauth2) {
          reject(new Error("Google SDK가 로드되지 않았습니다."))
          return
        }
        const client = oauth2.initTokenClient({
          client_id: clientId,
          scope: "openid email profile",
          callback: (response) => {
            if (response.access_token) {
              resolve({ accessToken: response.access_token })
              return
            }
            reject(
              new Error(
                response.error_description ??
                  "Google access_token이 반환되지 않았습니다.",
              ),
            )
          },
          error_callback: (error) => {
            reject(error)
          },
        })
        client.requestAccessToken({ prompt: "" })
      })
      .catch(reject)
  })
}
