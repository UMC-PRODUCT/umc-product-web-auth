const STORAGE_KEY = "umc.auth.authorizeRequest"

export const AUTHORIZE_PARAMS = [
  "client_id",
  "code_challenge",
  "code_challenge_method",
  "redirect_uri",
  "response_type",
  "state",
] as const

export type AuthorizeRequest = Record<(typeof AUTHORIZE_PARAMS)[number], string>

export function saveAuthorizeRequest(search: URLSearchParams) {
  const request = {} as AuthorizeRequest
  for (const key of AUTHORIZE_PARAMS) {
    const value = search.get(key)
    if (!value) {
      return false
    }
    request[key] = value
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(request))
  return true
}

export function readAuthorizeRequest(): AuthorizeRequest | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AuthorizeRequest>
    const request = {} as AuthorizeRequest
    for (const key of AUTHORIZE_PARAMS) {
      const value = parsed[key]
      if (!value) {
        return null
      }
      request[key] = value
    }
    return request
  } catch {
    return null
  }
}

export function authorizeUrl(apiBaseUrl: string, request: AuthorizeRequest) {
  const params = new URLSearchParams(request)
  const base = apiBaseUrl.replace(/\/+$/, "")
  return `${base}/api/v1/auth/sso/oauth/authorize?${params.toString()}`
}
