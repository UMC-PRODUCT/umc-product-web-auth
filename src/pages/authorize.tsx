import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { ApiError } from "@/api/http"
import { fetchSsoSession } from "@/api/sso"
import {
  clearAdminGateAccessToken,
  denyAdminAccessAndClearSession,
  evaluateAdminAccess,
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
          await fetchSsoSession()

          const gateToken = readAdminGateAccessToken()
          // 다른 서비스에서 이미 SSO 로그인한 경우에는 검사 토큰이 없다.
          // 이때는 SSO 세션을 유지한 채 code를 발급하고, 운영진 판별은 클라이언트 앱에 맡긴다.
          if (gateToken && shouldCheckAdminAccess(request.client_id)) {
            const decision = await evaluateAdminAccess(
              gateToken,
              request.client_id,
            )
            clearAdminGateAccessToken()
            if (decision.kind === "denied") {
              await denyAdminAccessAndClearSession()
              setIsChecking(false)
              setAdminDeniedOpen(true)
              return
            }
          }

          // assign 이면 /authorize 가 히스토리에 남아, 클라이언트에서
          // 뒤로가기 시 다시 이 화면으로 온다. replace 로 현재 칸을 덮는다.
          window.location.replace(
            authorizeUrl(getAuthEnv().apiBaseUrl, request),
          )
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            await navigate({ to: "/", replace: true })
            return
          }
          setIsChecking(false)
          setMessage("로그인 상태를 확인하지 못했습니다.")
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
