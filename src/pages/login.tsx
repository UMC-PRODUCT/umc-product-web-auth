import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  Button,
  Checkbox,
  GuidanceMessage,
  TextFieldBox,
} from "@umc-product/react"
import { type FormEvent, useEffect, useState } from "react"

import { loginByEmailCredential } from "@/api/credential-auth"
import { ApiError } from "@/api/http"
import { loginBySsoEmail } from "@/api/sso"
import {
  consumeAdminAccessDeniedFlag,
  denyAdminAccessAndClearSession,
  evaluateAdminAccess,
  saveAdminGateAccessToken,
  shouldCheckAdminAccess,
} from "@/lib/admin-access"
import { readAuthorizeRequest } from "@/lib/authorize-request"
import { resolveLoginAudience } from "@/lib/login-audience"
import { EMAIL_FORMAT_ERROR } from "@/lib/messages"
import { useSocialLogin } from "@/lib/oauth/useSocialLogin"
import { useServerErrorToast } from "@/lib/useServerErrorToast"
import { isValidEmail } from "@/lib/validation"

import { AdminAccessDeniedDialog } from "./-components/AdminAccessDeniedDialog"
import { BrandLogo } from "./-components/BrandLogo"
import { Copyright } from "./-components/Copyright"
import { OAuthIconButton, type OAuthProvider } from "./-components/OAuthButton"
import { OrDivider } from "./-components/OrDivider"
import { TextLinkPair } from "./-components/TextLinkPair"

export const Route = createFileRoute("/login")({
  component: LoginPage,
})

const LOGIN_PROVIDERS: OAuthProvider[] = ["kakao", "apple", "google"]
const INVALID_CREDENTIALS_MESSAGE = "아이디 또는 비밀번호가 올바르지 않아요"

function LoginPage() {
  const navigate = useNavigate()
  const showServerError = useServerErrorToast()
  const { pendingProvider, start, adminDeniedOpen, setAdminDeniedOpen } =
    useSocialLogin()
  const audience = resolveLoginAudience(readAuthorizeRequest()?.client_id)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [hasEmailError, setHasEmailError] = useState(false)
  const [hasCredentialsError, setHasCredentialsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isFilled = email !== "" && password !== ""

  useEffect(() => {
    if (consumeAdminAccessDeniedFlag()) {
      setAdminDeniedOpen(true)
    }
  }, [setAdminDeniedOpen])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValidEmail(email)) {
      setHasEmailError(true)
      return
    }
    setIsSubmitting(true)
    try {
      const clientId = readAuthorizeRequest()?.client_id

      if (shouldCheckAdminAccess(clientId)) {
        const credential = await loginByEmailCredential(email, password)
        const decision = await evaluateAdminAccess(
          credential.accessToken,
          clientId,
        )
        if (decision.kind === "denied") {
          await denyAdminAccessAndClearSession()
          setAdminDeniedOpen(true)
          return
        }
        if (decision.kind === "allowed") {
          saveAdminGateAccessToken(decision.accessToken)
        }
      }

      await loginBySsoEmail(email, password)
      if (readAuthorizeRequest()) {
        await navigate({ to: "/authorize", replace: true })
      } else {
        await navigate({ to: "/", replace: true })
      }
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.code === "AUTHENTICATION-0022")
      ) {
        setHasCredentialsError(true)
      } else {
        showServerError()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex w-full max-w-[360px] flex-col items-center gap-8">
      <form
        noValidate
        onSubmit={handleSubmit}
        className="flex w-full flex-col items-center gap-8 md:gap-10"
      >
        <BrandLogo audience={audience} surface="form" />
        <div className="flex w-full flex-col items-center gap-6">
          <div className="flex w-full flex-col items-center">
            <div className="flex w-full flex-col gap-3">
              <TextFieldBox
                type="email"
                aria-label="이메일"
                placeholder="이메일"
                autoComplete="username"
                clearable={false}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setHasEmailError(false)
                  setHasCredentialsError(false)
                }}
                invalid={hasEmailError}
                errorMessage={hasEmailError ? EMAIL_FORMAT_ERROR : undefined}
              />
              <TextFieldBox
                type="password"
                aria-label="비밀번호"
                placeholder="비밀번호"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setHasCredentialsError(false)
                }}
              />
              <Checkbox name="keepLoggedIn" color="brand" labelPlacement="end">
                로그인 유지
              </Checkbox>
            </div>
            <div className="mt-[11px] flex min-h-[23px] w-full items-center">
              {hasCredentialsError && (
                <GuidanceMessage color="error" role="alert">
                  {INVALID_CREDENTIALS_MESSAGE}
                </GuidanceMessage>
              )}
            </div>
            <div className="mt-2 flex w-full flex-col items-center gap-4">
              <Button
                type="submit"
                variant={isFilled ? "fill" : "weak"}
                color="brand"
                size="md"
                className="w-full"
                isLoading={isSubmitting || pendingProvider !== null}
              >
                로그인
              </Button>
              <TextLinkPair
                neutralLabel="계정 찾기"
                onNeutralClick={() =>
                  navigate({
                    to: "/account-recovery",
                    search: { tab: "email" },
                  })
                }
                brandLabel="회원가입"
                onBrandClick={() => navigate({ to: "/signup" })}
              />
            </div>
          </div>
          <div className="flex w-full flex-col items-center gap-4">
            <OrDivider />
            <div className="flex justify-center gap-8">
              {LOGIN_PROVIDERS.map((provider) => (
                <OAuthIconButton
                  key={provider}
                  provider={provider}
                  onClick={() => start(provider)}
                />
              ))}
            </div>
          </div>
        </div>
      </form>
      <Copyright />
      <AdminAccessDeniedDialog
        open={adminDeniedOpen}
        onOpenChange={setAdminDeniedOpen}
      />
    </div>
  )
}
