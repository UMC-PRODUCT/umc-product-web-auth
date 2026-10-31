import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { ApiError } from "@/api/http"
import { fetchSsoSession } from "@/api/sso"
import {
  clearAdminGateAccessToken,
  clearAdminReloginRequired,
  denyAdminAccessAndClearSession,
  evaluateAdminAccess,
  isAdminGateBoundToSsoMember,
  isAdminReloginRequired,
  logoutSsoAndClearAdminGate,
  readAdminGateAccessToken,
  shouldCheckAdminAccess,
} from "@/lib/admin-access"
import { getAuthEnv } from "@/lib/auth-env"
import {
  authorizeUrl,
  readAuthorizeRequest,
  saveAuthorizeRequest,
} from "@/lib/authorize-request"

import { AdminAccessDeniedDialog } from "./-components/AdminAccessDeniedDialog"
import { AuthSpinner } from "./-components/AuthSpinner"

export const Route = createFileRoute("/authorize")({
  component: AuthorizePage,
})

const checks = new Map<string, Promise<void>>()
const SESSION_CHECK_FAILED_MESSAGE = "로그인 상태를 확인하지 못했습니다."

function AuthorizePage() {
  const navigate = useNavigate()
  const [message, setMessage] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const [adminDeniedOpen, setAdminDeniedOpen] = useState(false)

  useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    if ([...search.keys()].length > 0 && !saveAuthorizeRequest(search)) {
      setIsChecking(false)
      setMessage("로그인 요청 정보가 없습니다.")
      return
    }
    const request = readAuthorizeRequest()
    if (!request) {
      setIsChecking(false)
      setMessage("로그인 요청 정보가 없습니다.")
      return
    }

    const key = JSON.stringify(request)
    const existing = checks.get(key)
    const task =
      existing ??
      (async () => {
        try {
          const session = await fetchSsoSession()
          const needsAdminCheck = shouldCheckAdminAccess(request.client_id)
          const gate = readAdminGateAccessToken()
          const reloginRequired = isAdminReloginRequired()
          const bound =
            gate.kind === "ok" &&
            isAdminGateBoundToSsoMember(gate.memberId, session.memberId)

          // TODO(debug): 배포 원인 확인 후 제거
          console.info("[authorize] session/gate", {
            clientId: request.client_id,
            needsAdminCheck,
            reloginRequired,
            sessionMemberId: session.memberId,
            sessionMemberIdType: typeof session.memberId,
            gate,
            bound,
            rawGate: sessionStorage.getItem("umc.auth.adminGateAccessToken"),
          })

          if (needsAdminCheck && reloginRequired) {
            console.warn("[authorize] branch: reloginRequired → logout")
            const cleared = await logoutSsoAndClearAdminGate()
            console.info("[authorize] logout result", cleared)
            if (!cleared.ok) {
              setIsChecking(false)
              setMessage(SESSION_CHECK_FAILED_MESSAGE)
              return
            }
            await navigate({ to: "/", replace: true })
            return
          }

          // 다른 서비스에서 이미 SSO 로그인한 경우에는 검사 토큰이 없다.
          // 이때는 SSO 세션을 유지한 채 code를 발급하고, 운영진 판별은 클라이언트 앱에 맡긴다.
          if (needsAdminCheck && gate.kind !== "none") {
            // 바인딩 불일치·구형 토큰: 로그아웃 성공 전에는 게이트/플래그를 유지한다.
            if (gate.kind === "invalid" || !bound) {
              console.warn(
                "[authorize] branch: gate invalid/unbound → logout",
                {
                  gateKind: gate.kind,
                  bound,
                },
              )
              const cleared = await logoutSsoAndClearAdminGate()
              console.info("[authorize] logout result", cleared)
              if (!cleared.ok) {
                setIsChecking(false)
                setMessage(SESSION_CHECK_FAILED_MESSAGE)
                return
              }
              await navigate({ to: "/", replace: true })
              return
            }

            try {
              const decision = await evaluateAdminAccess(
                gate.accessToken,
                request.client_id,
              )
              console.info("[authorize] evaluateAdminAccess", decision)
              if (decision.kind === "denied") {
                console.warn("[authorize] branch: admin denied → logout")
                const cleared = await denyAdminAccessAndClearSession()
                console.info("[authorize] logout result", cleared)
                setIsChecking(false)
                setAdminDeniedOpen(true)
                if (!cleared.ok) {
                  setMessage(SESSION_CHECK_FAILED_MESSAGE)
                }
                return
              }
            } catch (error) {
              // 멤버 조회 401이 바깥 catch로 가면 SSO 미로그인으로 오인되어 `/`로 간다.
              if (error instanceof ApiError && error.status === 401) {
                console.warn("[authorize] branch: evaluate 401 → logout", error)
                const cleared = await denyAdminAccessAndClearSession()
                console.info("[authorize] logout result", cleared)
                setIsChecking(false)
                setAdminDeniedOpen(true)
                if (!cleared.ok) {
                  setMessage(SESSION_CHECK_FAILED_MESSAGE)
                }
                return
              }
              // 일시 오류: 게이트 토큰을 유지해 재시도 시 검사가 생략되지 않게 한다.
              console.warn(
                "[authorize] branch: evaluate transient error",
                error,
              )
              setIsChecking(false)
              setMessage(SESSION_CHECK_FAILED_MESSAGE)
              return
            }
          }

          // 허용(또는 검사 불필요)이 확정된 뒤에만 게이트 토큰을 삭제한다.
          clearAdminGateAccessToken()
          clearAdminReloginRequired()

          const next = authorizeUrl(getAuthEnv().apiBaseUrl, request)
          console.info("[authorize] branch: proceed to api authorize", next)

          // assign 이면 /authorize 가 히스토리에 남아, 클라이언트에서
          // 뒤로가기 시 다시 이 화면으로 온다. replace 로 현재 칸을 덮는다.
          window.location.replace(next)
        } catch (error) {
          console.warn("[authorize] outer catch", error)
          if (error instanceof ApiError && error.status === 401) {
            await navigate({ to: "/", replace: true })
            return
          }
          setIsChecking(false)
          setMessage(SESSION_CHECK_FAILED_MESSAGE)
        } finally {
          checks.delete(key)
        }
      })()
    if (!existing) {
      checks.set(key, task)
    }
  }, [navigate])

  return (
    <>
      {isChecking ? <AuthSpinner label="로그인 확인 중" /> : null}
      {message ? <p>{message}</p> : null}
      <AdminAccessDeniedDialog
        open={adminDeniedOpen}
        onOpenChange={setAdminDeniedOpen}
      />
    </>
  )
}
