export type AuthEnv = {
  allowedReturnOrigins: readonly string[]
  apiBaseUrl: string
}

export type AuthRuntimeEnv = {
  allowedReturnOrigins?: string
  apiBaseUrl?: string
}

const PROD_AUTH_ORIGIN = "https://auth.university.neordinary.com"

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
        "https://admin.university.neordinary.com",
        "https://university.neordinary.com",
      ],
      apiBaseUrl: "https://api.university.neordinary.com",
    }
  }

  const apiBaseUrl = present(runtime.apiBaseUrl)
  const allowedReturnOrigins = splitOrigins(runtime.allowedReturnOrigins)
  // TODO: 개발 배포 인증 앱의 origin, API 호스트, 허용 return origin은 미확정이다.
  if (!apiBaseUrl || allowedReturnOrigins.length === 0) {
    throw new Error(
      "개발 인증 앱의 VITE_API_BASE_URL과 VITE_ALLOWED_RETURN_ORIGINS가 필요합니다. TODO: 개발 배포 주소는 미확정입니다.",
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
