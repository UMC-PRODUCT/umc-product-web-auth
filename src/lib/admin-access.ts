import { fetchMemberMeV2, type MemberSummaryV2 } from "@/api/member"
import { logoutSso } from "@/api/sso"
import { readAuthorizeRequest } from "@/lib/authorize-request"
import {
  type LoginAudienceEnv,
  resolveLoginAudience,
} from "@/lib/login-audience"

const ADMIN_GATE_TOKEN_KEY = "umc.auth.adminGateAccessToken"
const ADMIN_DENIED_FLAG_KEY = "umc.auth.adminAccessDenied"
const ADMIN_RELOGIN_REQUIRED_KEY = "umc.auth.adminReloginRequired"

export type ClearAdminSessionResult = { ok: true } | { ok: false }

export type AdminAccessDecision =
  | { kind: "allowed"; accessToken: string; memberId: number }
  | { kind: "denied" }
  | { kind: "skipped" }

export type AdminGatePayload = {
  accessToken: string
  memberId: number
}

export type AdminGateReadResult =
  | { kind: "none" }
  | { kind: "invalid" }
  | ({ kind: "ok" } & AdminGatePayload)

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
  const memberId = normalizeMemberId(member.id)
  if (!canAccessAdminOps(member) || memberId == null) {
    return { kind: "denied" }
  }
  return { kind: "allowed", accessToken, memberId }
}

export function saveAdminGateAccessToken(
  accessToken: string,
  memberId: number,
) {
  const payload: AdminGatePayload = { accessToken, memberId }
  sessionStorage.setItem(ADMIN_GATE_TOKEN_KEY, JSON.stringify(payload))
  clearAdminReloginRequired()
}

/** 게이트 토큰 + 바인딩된 SSO 회원 id. 구형(토큰만) 값은 invalid. */
export function readAdminGateAccessToken(): AdminGateReadResult {
  const raw = sessionStorage.getItem(ADMIN_GATE_TOKEN_KEY)
  if (!raw) {
    return { kind: "none" }
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as AdminGatePayload).accessToken === "string" &&
      typeof (parsed as AdminGatePayload).memberId === "number"
    ) {
      const { accessToken, memberId } = parsed as AdminGatePayload
      return { kind: "ok", accessToken, memberId }
    }
  } catch {
    // 이전 형식(토큰 문자열만)은 회원 바인딩이 없어 재사용하지 않는다.
  }
  return { kind: "invalid" }
}

/** SSO/회원 API가 memberId를 문자열로 주는 경우가 있어 number로 맞춘다. */
export function normalizeMemberId(
  value: number | string | null | undefined,
): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function isAdminGateBoundToSsoMember(
  gateMemberId: number,
  sessionMemberId: number | string | null | undefined,
) {
  const sessionId = normalizeMemberId(sessionMemberId)
  return sessionId != null && sessionId === gateMemberId
}

export function clearAdminGateAccessToken() {
  sessionStorage.removeItem(ADMIN_GATE_TOKEN_KEY)
}

export function markAdminReloginRequired() {
  sessionStorage.setItem(ADMIN_RELOGIN_REQUIRED_KEY, "1")
}

export function clearAdminReloginRequired() {
  sessionStorage.removeItem(ADMIN_RELOGIN_REQUIRED_KEY)
}

export function isAdminReloginRequired() {
  return sessionStorage.getItem(ADMIN_RELOGIN_REQUIRED_KEY) === "1"
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

/**
 * SSO 로그아웃 성공이 확인된 뒤에만 게이트·재로그인 플래그를 지운다.
 * 실패 시 게이트(또는 invalid 값)와 재로그인 필수 상태를 유지해
 * /authorize 재진입 시 검사 생략을 막는다.
 */
export async function logoutSsoAndClearAdminGate(): Promise<ClearAdminSessionResult> {
  markAdminReloginRequired()
  try {
    await logoutSso()
  } catch {
    return { ok: false }
  }
  clearAdminGateAccessToken()
  clearAdminReloginRequired()
  return { ok: true }
}

/** 운영진 거절 UI용. logout 실패 시에도 Dialog는 호출부에서 보여줄 수 있다. */
export async function denyAdminAccessAndClearSession(): Promise<ClearAdminSessionResult> {
  return logoutSsoAndClearAdminGate()
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
