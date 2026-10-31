import { apiRequest } from "./http"

export type SsoSession = {
  expiresAt?: string
  memberId?: number
}

export type SsoSocialLogin = SsoSession & {
  code?: string
  oAuthVerificationToken?: string
  provider?: string
}

const OAUTH_TOKEN_KEY = "umc.auth.oAuthVerificationToken"

export function fetchSsoSession() {
  return apiRequest<SsoSession>("/api/v1/auth/sso/me", { method: "GET" })
}

export function loginBySsoEmail(email: string, password: string) {
  return apiRequest<SsoSession>("/api/v1/auth/sso/email", {
    body: JSON.stringify({ email, password }),
    method: "POST",
  })
}

export function loginBySsoGoogle(token: {
  accessToken?: string
  idToken?: string
}) {
  return apiRequest<SsoSocialLogin>("/api/v1/auth/sso/google", {
    body: JSON.stringify(token),
    method: "POST",
  })
}

export function loginBySsoKakao(token: {
  accessToken?: string
  idToken?: string
}) {
  return apiRequest<SsoSocialLogin>("/api/v1/auth/sso/kakao", {
    body: JSON.stringify(token),
    method: "POST",
  })
}

export function loginBySsoApple(authorizationCode: string) {
  return apiRequest<SsoSocialLogin>("/api/v1/auth/sso/apple", {
    body: JSON.stringify({ authorizationCode }),
    method: "POST",
  })
}

export function logoutSso() {
  return apiRequest<unknown>("/api/v1/auth/sso/logout", { method: "POST" })
}

export function saveOAuthVerificationToken(token: string) {
  sessionStorage.setItem(OAUTH_TOKEN_KEY, token)
}

export function readOAuthVerificationToken() {
  return sessionStorage.getItem(OAUTH_TOKEN_KEY)
}
