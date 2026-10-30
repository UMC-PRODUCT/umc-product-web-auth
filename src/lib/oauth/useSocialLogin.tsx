import { useNavigate } from "@tanstack/react-router"
import { CheckCircleIcon } from "@umc-product/icons"
import { useToast } from "@umc-product/react"
import { useState } from "react"

import {
  loginByAppleCredential,
  loginByGoogleCredential,
} from "@/api/credential-auth"
import { loginBySsoApple, loginBySsoGoogle } from "@/api/sso"
import {
  denyAdminAccessAndClearSession,
  evaluateAdminAccess,
  isOAuthRegisterRequired,
  saveAdminGateAccessToken,
  shouldCheckAdminAccess,
} from "@/lib/admin-access"
import { readAuthorizeRequest } from "@/lib/authorize-request"
import { isApplePopupCancelled, signInWithApple } from "@/lib/oauth/appleSignIn"
import {
  resolveSsoSocialLogin,
  socialSuccessNavigateOptions,
} from "@/lib/oauth/completeSsoSocialLogin"
import {
  isGooglePopupCancelled,
  signInWithGoogle,
} from "@/lib/oauth/googleSignIn"
import { startKakaoSignIn } from "@/lib/oauth/kakaoSignIn"
import { type OAuthProvider } from "@/pages/-components/OAuthButton"

const REGISTER_REQUIRED_MESSAGE =
  "가입된 계정이 없어요. 회원가입 후 다시 시도해 주세요"
const MISSING_CONFIG_MESSAGE = "소셜 로그인 설정이 아직 준비되지 않았어요"
const FAILED_MESSAGE = "소셜 로그인에 실패했습니다. 다시 시도해 주세요"

export function useSocialLogin() {
  const navigate = useNavigate()
  const toast = useToast()
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(
    null,
  )
  const [adminDeniedOpen, setAdminDeniedOpen] = useState(false)

  const showError = (message: string) => {
    toast.show({
      message,
      color: "error",
      icon: <CheckCircleIcon />,
    })
  }

  const finishSuccess = async (next: "/authorize" | "/") => {
    await navigate(socialSuccessNavigateOptions(next))
  }

  const openAdminDenied = async () => {
    await denyAdminAccessAndClearSession()
    setAdminDeniedOpen(true)
  }

  const handleGoogle = async () => {
    setPendingProvider("google")
    try {
      const { accessToken } = await signInWithGoogle()
      const clientId = readAuthorizeRequest()?.client_id

      if (shouldCheckAdminAccess(clientId)) {
        const credential = await loginByGoogleCredential({ accessToken })
        if (isOAuthRegisterRequired(credential)) {
          showError(REGISTER_REQUIRED_MESSAGE)
          return
        }
        const decision = await evaluateAdminAccess(
          credential.accessToken,
          clientId,
        )
        if (decision.kind === "denied") {
          await openAdminDenied()
          return
        }
        if (decision.kind === "allowed") {
          saveAdminGateAccessToken(decision.accessToken)
        }
      }

      const result = await loginBySsoGoogle({ accessToken })
      const outcome = resolveSsoSocialLogin(result)
      if (outcome.kind === "register_required") {
        showError(REGISTER_REQUIRED_MESSAGE)
        return
      }
      await finishSuccess(outcome.next)
    } catch (error) {
      if (isGooglePopupCancelled(error)) return
      showError(errorMessage(error))
    } finally {
      setPendingProvider(null)
    }
  }

  const handleApple = async () => {
    setPendingProvider("apple")
    try {
      const clientId = readAuthorizeRequest()?.client_id

      if (shouldCheckAdminAccess(clientId)) {
        // Apple authorization code는 1회용이므로, 권한 확인용 로그인 후
        // SSO 쿠키 발급을 위해 Apple 로그인을 한 번 더 진행한다.
        const first = await signInWithApple()
        const credential = await loginByAppleCredential(first.authorizationCode)
        if (isOAuthRegisterRequired(credential)) {
          showError(REGISTER_REQUIRED_MESSAGE)
          return
        }
        const decision = await evaluateAdminAccess(
          credential.accessToken,
          clientId,
        )
        if (decision.kind === "denied") {
          await openAdminDenied()
          return
        }
        if (decision.kind === "allowed") {
          saveAdminGateAccessToken(decision.accessToken)
        }
        const second = await signInWithApple()
        const result = await loginBySsoApple(second.authorizationCode)
        const outcome = resolveSsoSocialLogin(result)
        if (outcome.kind === "register_required") {
          showError(REGISTER_REQUIRED_MESSAGE)
          return
        }
        await finishSuccess(outcome.next)
        return
      }

      const { authorizationCode } = await signInWithApple()
      const result = await loginBySsoApple(authorizationCode)
      const outcome = resolveSsoSocialLogin(result)
      if (outcome.kind === "register_required") {
        showError(REGISTER_REQUIRED_MESSAGE)
        return
      }
      await finishSuccess(outcome.next)
    } catch (error) {
      if (isApplePopupCancelled(error)) return
      showError(errorMessage(error))
    } finally {
      setPendingProvider(null)
    }
  }

  const handleKakao = async () => {
    setPendingProvider("kakao")
    try {
      await startKakaoSignIn()
    } catch (error) {
      showError(errorMessage(error))
      setPendingProvider(null)
    }
  }

  const start = (provider: OAuthProvider) => {
    if (pendingProvider) return
    if (provider === "google") void handleGoogle()
    else if (provider === "apple") void handleApple()
    else void handleKakao()
  }

  return {
    pendingProvider,
    start,
    adminDeniedOpen,
    setAdminDeniedOpen,
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error && /설정되지 않았습니다/.test(error.message)) {
    return MISSING_CONFIG_MESSAGE
  }
  return FAILED_MESSAGE
}
