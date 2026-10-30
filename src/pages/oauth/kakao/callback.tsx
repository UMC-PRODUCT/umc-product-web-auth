import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { CheckCircleIcon } from "@umc-product/icons"
import { useToast } from "@umc-product/react"
import { useEffect, useRef } from "react"

import {
  completeKakaoSsoLogin,
  socialSuccessNavigateOptions,
} from "@/lib/oauth/completeSsoSocialLogin"
import {
  consumeKakaoState,
  exchangeKakaoAuthorizationCode,
} from "@/lib/oauth/kakaoSignIn"

export const Route = createFileRoute("/oauth/kakao/callback")({
  component: KakaoCallbackPage,
})

const REGISTER_REQUIRED_MESSAGE =
  "가입된 계정이 없어요. 회원가입 후 다시 시도해 주세요"
const FAILED_MESSAGE = "카카오 로그인에 실패했습니다. 다시 시도해 주세요"

function KakaoCallbackPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true

    const showError = (message: string) => {
      toast.show({
        message,
        color: "error",
        icon: <CheckCircleIcon />,
      })
      void navigate({ to: "/login" })
    }

    const params = new URLSearchParams(window.location.search)
    const error = params.get("error")
    if (error) {
      if (error === "access_denied") {
        void navigate({ to: "/login" })
        return
      }
      showError(FAILED_MESSAGE)
      return
    }

    const code = params.get("code")
    const state = params.get("state")
    if (!code || !consumeKakaoState(state)) {
      showError(FAILED_MESSAGE)
      return
    }

    void (async () => {
      try {
        const tokens = await exchangeKakaoAuthorizationCode(code)
        const outcome = await completeKakaoSsoLogin(tokens)
        if (outcome.kind === "register_required") {
          showError(REGISTER_REQUIRED_MESSAGE)
          return
        }
        await navigate(socialSuccessNavigateOptions(outcome.next))
      } catch {
        showError(FAILED_MESSAGE)
      }
    })()
  }, [navigate, toast])

  return <p>카카오 로그인 중</p>
}
