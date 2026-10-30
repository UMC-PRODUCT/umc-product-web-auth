import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { ApiError } from "@/api/http"
import { fetchSsoSession } from "@/api/sso"
import { getAuthEnv } from "@/lib/auth-env"
import {
  authorizeUrl,
  readAuthorizeRequest,
  saveAuthorizeRequest,
} from "@/lib/authorize-request"

export const Route = createFileRoute("/authorize")({
  component: AuthorizePage,
})

const checks = new Map<string, Promise<void>>()

function AuthorizePage() {
  const navigate = useNavigate()
  const [message, setMessage] = useState("로그인 확인 중")

  useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    if ([...search.keys()].length > 0 && !saveAuthorizeRequest(search)) {
      setMessage("로그인 요청 정보가 없습니다.")
      return
    }
    const request = readAuthorizeRequest()
    if (!request) {
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
          window.location.assign(authorizeUrl(getAuthEnv().apiBaseUrl, request))
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            await navigate({ to: "/login" })
            return
          }
          setMessage("로그인 상태를 확인하지 못했습니다.")
        } finally {
          checks.delete(key)
        }
      })()
    if (!existing) {
      checks.set(key, task)
    }
  }, [navigate])

  return <p>{message}</p>
}
