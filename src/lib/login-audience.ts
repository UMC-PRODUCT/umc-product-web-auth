export type LoginAudience = "default" | "activity" | "admin"

export type LoginAudienceEnv = {
  activityClientIds?: string
  adminClientIds?: string
  /** UI 분기 강제. client_id 보다 우선. activity | admin | default */
  uiTest?: string
}

const AUDIENCES = new Set<LoginAudience>(["default", "activity", "admin"])

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
  if (splitIds(env.adminClientIds).has(clientId)) {
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
