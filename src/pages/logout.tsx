import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"

import { logoutSso } from "@/api/sso"
import { getAuthEnv, isAllowedReturnTo } from "@/lib/auth-env"

import { AuthSpinner } from "./-components/AuthSpinner"

type LogoutSearch = {
  return_to?: string
}

export const Route = createFileRoute("/logout")({
  component: LogoutPage,
  validateSearch: (search: Record<string, unknown>): LogoutSearch => {
    const returnTo = search.return_to
    return typeof returnTo === "string" ? { return_to: returnTo } : {}
  },
})

function LogoutPage() {
  const { return_to: returnTo } = Route.useSearch()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        await logoutSso()
      } catch {
        // 쿠키 삭제 요청이 실패해도 허용된 return_to 로만 이동한다.
      }
      if (cancelled) {
        return
      }
      const { allowedReturnOrigins } = getAuthEnv()
      if (returnTo && isAllowedReturnTo(returnTo, allowedReturnOrigins)) {
        window.location.assign(returnTo)
        return
      }
      await navigate({ to: "/login" })
    })()
    return () => {
      cancelled = true
    }
  }, [navigate, returnTo])

  return <AuthSpinner label="로그아웃 중" />
}
