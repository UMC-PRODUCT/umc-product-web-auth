import { apiRequest } from "./http"

export type ClientType = "ANDROID" | "IOS" | "MACOS" | "WEB"

export type LocalLogin = {
  memberId?: number
  accessToken?: string
  refreshToken?: string
}

export type OAuthLogin = {
  provider?: "GOOGLE" | "APPLE" | "KAKAO"
  success?: boolean
  code?: string
  oAuthVerificationToken?: string
  accessToken?: string
  refreshToken?: string
}

const WEB_CLIENT: ClientType = "WEB"

export function loginByEmailCredential(email: string, password: string) {
  return apiRequest<LocalLogin>("/api/v1/auth/login/email", {
    body: JSON.stringify({
      email,
      password,
      clientType: WEB_CLIENT,
    }),
    method: "POST",
  })
}

export function loginByGoogleCredential(token: {
  accessToken?: string
  idToken?: string
}) {
  return apiRequest<OAuthLogin>("/api/v1/auth/login/google", {
    body: JSON.stringify({
      accessToken: token.accessToken,
      idToken: token.idToken,
      clientType: WEB_CLIENT,
    }),
    method: "POST",
  })
}

/** 운영진 게이트용. SSO 쿠키는 /sso/kakao 를 쓴다. */
export function loginByKakaoCredential(token: {
  idToken: string
  accessToken?: string
}) {
  return apiRequest<OAuthLogin>("/api/v1/auth/login/kakao", {
    body: JSON.stringify({
      idToken: token.idToken,
      ...(token.accessToken ? { accessToken: token.accessToken } : {}),
      clientType: WEB_CLIENT,
    }),
    method: "POST",
  })
}

export function loginByAppleCredential(authorizationCode: string) {
  return apiRequest<OAuthLogin>("/api/v1/auth/login/apple", {
    body: JSON.stringify({
      authorizationCode,
      clientType: WEB_CLIENT,
    }),
    method: "POST",
  })
}
