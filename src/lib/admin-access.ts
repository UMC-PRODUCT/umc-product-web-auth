import { fetchMemberMeV2, type MemberSummaryV2 } from "@/api/member"
import { logoutSso } from "@/api/sso"
import { readAuthorizeRequest } from "@/lib/authorize-request"
import {
  type LoginAudienceEnv,
  resolveLoginAudience,
} from "@/lib/login-audience"

const ADMIN_GATE_TOKEN_KEY = "umc.auth.adminGateAccessToken"
const ADMIN_DENIED_FLAG_KEY = "umc.auth.adminAccessDenied"

export type AdminAccessDecision =
  | { kind: "allowed"; accessToken: string }
  | { kind: "denied" }
  | { kind: "skipped" }

export function shouldCheckAdminAccess(
  clientId?: string | null,
  env?: LoginAudienceEnv,
) {
  return resolveLoginAudience(clientId, env) === "admin"
}

export function canAccessAdminOps(member: MemberSummaryV2) {
  if (member.isSuperAdmin) {
    return true
  }
  return Boolean(member.currentGisuMemberInfo?.isAdmin)
}

/** admin audience일 때만 /v2/member/me 로 운영진 여부를 확인한다. */
export async function evaluateAdminAccess(
  accessToken: string | undefined | null,
  clientId: string | null | undefined = readAuthorizeRequest()?.client_id,
): Promise<AdminAccessDecision> {
  if (!shouldCheckAdminAccess(clientId)) {
    return { kind: "skipped" }
  }
  if (!accessToken) {
    return { kind: "denied" }
  }

  const member = await fetchMemberMeV2(accessToken)
  if (!canAccessAdminOps(member)) {
    return { kind: "denied" }
  }
  return { kind: "allowed", accessToken }
}

export function saveAdminGateAccessToken(accessToken: string) {
  sessionStorage.setItem(ADMIN_GATE_TOKEN_KEY, accessToken)
}

export function readAdminGateAccessToken() {
  return sessionStorage.getItem(ADMIN_GATE_TOKEN_KEY)
}

export function clearAdminGateAccessToken() {
  sessionStorage.removeItem(ADMIN_GATE_TOKEN_KEY)
}

export function markAdminAccessDenied() {
  sessionStorage.setItem(ADMIN_DENIED_FLAG_KEY, "1")
}

export function consumeAdminAccessDeniedFlag() {
  const value = sessionStorage.getItem(ADMIN_DENIED_FLAG_KEY)
  sessionStorage.removeItem(ADMIN_DENIED_FLAG_KEY)
  return value === "1"
}

/** 설정되어 있으면 홈 URL, 없으면 null (Dialog는 「확인」으로 닫기). */
export function getUmcHomeUrl() {
  const fromEnv = import.meta.env.VITE_UMC_HOME_URL?.trim()
  return fromEnv ? fromEnv : null
}

export async function denyAdminAccessAndClearSession() {
  clearAdminGateAccessToken()
  try {
    await logoutSso()
  } catch {
    // 쿠키가 없어도 거절 UI는 보여야 한다.
  }
}

export function isOAuthRegisterRequired(result: {
  accessToken?: string
  code?: string
  oAuthVerificationToken?: string
  success?: boolean
}) {
  if (result.oAuthVerificationToken) {
    return (
      result.code === "REGISTER_REQUIRED" ||
      result.success === false ||
      !result.accessToken
    )
  }
  return false
}
