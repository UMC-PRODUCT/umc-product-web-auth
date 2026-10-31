import { getAuthEnv } from "@/lib/auth-env"

export class ApiError extends Error {
  readonly code?: string
  readonly status: number

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers,
  })
  return readResult<T>(response)
}

function apiUrl(path: string) {
  const base = getAuthEnv().apiBaseUrl.replace(/\/+$/, "")
  return `${base}${path}`
}

async function readResult<T>(response: Response): Promise<T> {
  const body = await readBody(response)
  const fields = errorFields(body)

  if (!response.ok) {
    throw new ApiError(
      fields.message ?? "요청에 실패했습니다.",
      response.status,
      fields.code,
    )
  }

  if (isEnvelope(body)) {
    if (body.success === false) {
      throw new ApiError(
        fields.message ?? "요청에 실패했습니다.",
        response.status,
        fields.code,
      )
    }
    return body.result as T
  }

  return body as T
}

async function readBody(response: Response) {
  const text = await response.text()
  if (text.trim() === "") {
    return null
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function isEnvelope(value: unknown): value is {
  code?: string
  message?: string
  result?: unknown
  success?: boolean
} {
  return (
    value !== null &&
    typeof value === "object" &&
    "success" in value &&
    "result" in value
  )
}

function errorFields(value: unknown) {
  if (value === null || typeof value !== "object") {
    return {}
  }
  const record = value as Record<string, unknown>
  return {
    code: typeof record.code === "string" ? record.code : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
  }
}
