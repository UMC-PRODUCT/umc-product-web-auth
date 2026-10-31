export type AuthEnv = {
  allowedReturnOrigins: readonly string[]
  apiBaseUrl: string
}

export type AuthRuntimeEnv = {
  allowedReturnOrigins?: string
  apiBaseUrl?: string
}

const PROD_AUTH_ORIGIN = "https://auth.university.neordinary.com"
/** operations의 SSO stage 표(dev)와 같은 주소여야 한다. */
const DEV_AUTH_ORIGIN = "https://dev.auth.university.neordinary.com"

export function resolveAuthEnv(
  origin: string,
  runtime: AuthRuntimeEnv = {},
): AuthEnv {
  if (origin.startsWith("http://localhost:")) {
    return {
      allowedReturnOrigins: ["http://localhost:5173"],
      apiBaseUrl: "",
    }
  }

  if (origin === PROD_AUTH_ORIGIN) {
    return {
      allowedReturnOrigins: [
        "https://university.neordinary.com",
        "https://activity.university.neordinary.com",
        "https://admin.university.neordinary.com",
      ],
      apiBaseUrl: "https://api.university.neordinary.com",
    }
  }

  if (origin === DEV_AUTH_ORIGIN) {
    return {
      allowedReturnOrigins: [
        "https://dev.university.neordinary.com",
        "https://dev.activity.university.neordinary.com",
        "https://dev.admin.university.neordinary.com",
      ],
      apiBaseUrl: "https://api-dev.university.neordinary.com",
    }
  }

  // 표에 없는 배포(미리보기 등)는 env로만 설정한다.
  const apiBaseUrl = present(runtime.apiBaseUrl)
  const allowedReturnOrigins = splitOrigins(runtime.allowedReturnOrigins)
  if (!apiBaseUrl || allowedReturnOrigins.length === 0) {
    throw new Error(
      `${origin} 인증 앱에는 VITE_API_BASE_URL과 VITE_ALLOWED_RETURN_ORIGINS가 필요합니다.`,
    )
  }

  return { allowedReturnOrigins, apiBaseUrl }
}

export function readAuthRuntimeEnv(): AuthRuntimeEnv {
  return {
    allowedReturnOrigins: import.meta.env.VITE_ALLOWED_RETURN_ORIGINS,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  }
}

export function getAuthEnv() {
  return resolveAuthEnv(window.location.origin, readAuthRuntimeEnv())
}

export function isAllowedReturnTo(
  returnTo: string,
  allowedReturnOrigins: readonly string[],
) {
  try {
    return allowedReturnOrigins.includes(new URL(returnTo).origin)
  } catch {
    return false
  }
}

function present(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function splitOrigins(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin !== "")
}
