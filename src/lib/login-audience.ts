export type LoginAudience = "default" | "activity" | "admin"

export type LoginAudienceEnv = {
  activityClientIds?: string
  adminClientIds?: string
  /** UI 분기 강제. client_id 보다 우선. activity | admin | default */
  uiTest?: string
}

const AUDIENCES = new Set<LoginAudience>(["default", "activity", "admin"])

/**
 * 서버 app.sso.clients 에 등록된 운영진 웹 client_id. env가 빠진 빌드에서도
 * 운영진 게이트가 꺼지지 않도록 코드에 고정한다. env는 여기에 더하기만 한다.
 */
const BUILT_IN_ADMIN_CLIENT_IDS: readonly string[] = ["backoffice"]

export function isAdminClientId(
  clientId?: string | null,
  env: LoginAudienceEnv = readLoginAudienceEnv(),
) {
  if (!clientId) {
    return false
  }
  return (
    BUILT_IN_ADMIN_CLIENT_IDS.includes(clientId) ||
    splitIds(env.adminClientIds).has(clientId)
  )
}

export function resolveLoginAudience(
  clientId?: string | null,
  env: LoginAudienceEnv = readLoginAudienceEnv(),
): LoginAudience {
  const forced = parseAudience(env.uiTest)
  if (forced) {
    return forced
  }

  if (!clientId) {
    return "default"
  }

  if (splitIds(env.activityClientIds).has(clientId)) {
    return "activity"
  }
  if (isAdminClientId(clientId, env)) {
    return "admin"
  }
  return "default"
}

export function readLoginAudienceEnv(): LoginAudienceEnv {
  return {
    activityClientIds: import.meta.env.VITE_LOGIN_CLIENT_IDS_ACTIVITY,
    adminClientIds: import.meta.env.VITE_LOGIN_CLIENT_IDS_ADMIN,
    uiTest: import.meta.env.VITE_LOGIN_UI_TEST,
  }
}

function parseAudience(value: string | undefined): LoginAudience | null {
  const trimmed = value?.trim().toLowerCase()
  if (!trimmed) {
    return null
  }
  return AUDIENCES.has(trimmed as LoginAudience)
    ? (trimmed as LoginAudience)
    : null
}

function splitIds(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id !== ""),
  )
}
