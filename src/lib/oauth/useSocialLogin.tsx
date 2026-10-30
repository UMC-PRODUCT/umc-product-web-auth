import { useNavigate } from "@tanstack/react-router"
import { CheckCircleIcon } from "@umc-product/icons"
import { useToast } from "@umc-product/react"
import { useState } from "react"

import { loginBySsoApple, loginBySsoGoogle } from "@/api/sso"
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

  const handleGoogle = async () => {
    setPendingProvider("google")
    try {
      const { accessToken } = await signInWithGoogle()
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

  return { pendingProvider, start }
}

function errorMessage(error: unknown) {
  if (error instanceof Error && /설정되지 않았|환경변수/.test(error.message)) {
    return MISSING_CONFIG_MESSAGE
  }
  return FAILED_MESSAGE
}
