import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  Button,
  Checkbox,
  GuidanceMessage,
  TextFieldBox,
} from "@umc-product/react"
import { type FormEvent, useState } from "react"

import { isAuthError, loginByEmail } from "@/api/authStub"
import { EMAIL_FORMAT_ERROR } from "@/lib/messages"
import { useServerErrorToast } from "@/lib/useServerErrorToast"
import { isValidEmail } from "@/lib/validation"

import { BrandLogo } from "./-components/BrandLogo"
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
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [hasEmailError, setHasEmailError] = useState(false)
  const [hasCredentialsError, setHasCredentialsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isFilled = email !== "" && password !== ""

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValidEmail(email)) {
      setHasEmailError(true)
      return
    }
    setIsSubmitting(true)
    try {
      await loginByEmail(email, password)
    } catch (error) {
      if (isAuthError(error, "INVALID_CREDENTIALS")) {
        setHasCredentialsError(true)
      } else {
        showServerError()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex w-full max-w-[360px] flex-col items-center gap-10"
    >
      <BrandLogo />
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
          <div className="mt-2 flex w-full flex-col items-center gap-3.5">
            <Button
              type="submit"
              variant={isFilled ? "fill" : "weak"}
              color="brand"
              size="md"
              className="w-full"
              isLoading={isSubmitting}
            >
              로그인
            </Button>
            <TextLinkPair
              neutralLabel="아이디/비밀번호 찾기"
              brandLabel="회원가입"
              onBrandClick={() => navigate({ to: "/signup" })}
            />
          </div>
        </div>
        <div className="flex w-full flex-col items-center gap-4">
          <OrDivider />
          <div className="flex justify-center gap-8">
            {LOGIN_PROVIDERS.map((provider) => (
              <OAuthIconButton key={provider} provider={provider} />
            ))}
          </div>
        </div>
      </div>
    </form>
  )
}
