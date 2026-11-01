import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { CheckCircleIcon } from "@umc-product/icons"
import { useToast } from "@umc-product/react"
import { useEffect, useRef } from "react"

import { loginByKakaoCredential } from "@/api/credential-auth"
import { loginBySsoKakao, saveOAuthVerificationToken } from "@/api/sso"
import {
  denyAdminAccessAndClearSession,
  evaluateAdminAccess,
  isOAuthRegisterRequired,
  markAdminAccessDenied,
  saveAdminGateAccessToken,
  shouldCheckAdminAccess,
} from "@/lib/admin-access"
import { readAuthorizeRequest } from "@/lib/authorize-request"
import {
  resolveSsoSocialLogin,
  socialSuccessNavigateOptions,
} from "@/lib/oauth/completeSsoSocialLogin"
import {
  consumeKakaoState,
  exchangeKakaoAuthorizationCode,
} from "@/lib/oauth/kakaoSignIn"
import { AuthSpinner } from "@/pages/-components/AuthSpinner"

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
      void navigate({ to: "/login", replace: true })
    }

    const params = new URLSearchParams(window.location.search)
    const error = params.get("error")
    if (error) {
      if (error === "access_denied") {
        void navigate({ to: "/login", replace: true })
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
        if (!tokens.idToken) {
          showError(FAILED_MESSAGE)
          return
        }

        const clientId = readAuthorizeRequest()?.client_id

        // 이메일·Google과 동일: admin audience면 UMC 토큰으로 운영진 여부를 먼저 확인
        if (shouldCheckAdminAccess(clientId)) {
          const credential = await loginByKakaoCredential({
            idToken: tokens.idToken,
            accessToken: tokens.accessToken,
          })
          if (isOAuthRegisterRequired(credential)) {
            if (credential.oAuthVerificationToken) {
              saveOAuthVerificationToken(credential.oAuthVerificationToken)
            }
            showError(REGISTER_REQUIRED_MESSAGE)
            return
          }
          const decision = await evaluateAdminAccess(
            credential.accessToken,
            clientId,
          )
          if (decision.kind === "denied") {
            await denyAdminAccessAndClearSession()
            markAdminAccessDenied()
            await navigate({ to: "/login", replace: true })
            return
          }
          if (decision.kind === "allowed") {
            saveAdminGateAccessToken(decision.accessToken, decision.memberId)
          }
        }

        // Auth App SSO 세션 (UMC_SSO_LOGIN 쿠키)
        const result = await loginBySsoKakao({ idToken: tokens.idToken })
        const outcome = resolveSsoSocialLogin(result)
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

  return <AuthSpinner label="카카오 로그인 중" />
}
