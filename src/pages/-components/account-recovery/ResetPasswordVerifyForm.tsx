import {
  Button,
  TextFieldBox,
  TextInfoButton,
  VerificationCodeField,
} from "@umc-product/react"
import { type FormEvent, useState } from "react"

import { isAuthError, requestRecoveryCode, verifyCode } from "@/api/authStub"
import { EMAIL_FORMAT_ERROR } from "@/lib/messages"
import { useCodeVerification } from "@/lib/useCodeVerification"
import { useServerErrorToast } from "@/lib/useServerErrorToast"
import { isValidEmail } from "@/lib/validation"

import { EmailCodeHelpDialog } from "../EmailCodeHelpDialog"
import { RecoveryFormActions } from "./RecoveryFormActions"

export type RecoveryUser = {
  name: string
  email: string
}

type ResetPasswordVerifyFormProps = {
  defaultUser: RecoveryUser
  onVerified: (user: RecoveryUser) => void
}

export function ResetPasswordVerifyForm({
  defaultUser,
  onVerified,
}: ResetPasswordVerifyFormProps) {
  const showServerError = useServerErrorToast()
  const [name, setName] = useState(defaultUser.name)
  const [email, setEmail] = useState(defaultUser.email)
  const [hasEmailError, setHasEmailError] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const verification = useCodeVerification(email)

  const isEmailValid = isValidEmail(email)
  const canSend = isEmailValid && verification.needsNewCode
  const canGoNext = name.trim() !== "" && verification.canVerify

  const sendCode = async (targetEmail: string) => {
    try {
      await verification.send(targetEmail, requestRecoveryCode)
    } catch {
      showServerError()
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await verification.verify(verifyCode)
      onVerified({ name, email })
    } catch (error) {
      if (!isAuthError(error, "CODE_MISMATCH")) showServerError()
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3"
    >
      <div className="flex w-full flex-col gap-5">
        <TextFieldBox
          label="이름"
          placeholder="김유엠"
          autoComplete="name"
          clearable={false}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="flex items-start gap-1.5">
          <TextFieldBox
            label="이메일"
            type="email"
            autoComplete="email"
            placeholder="이메일을 적어주세요"
            clearable={false}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setHasEmailError(false)
            }}
            onBlur={() => setHasEmailError(email !== "" && !isEmailValid)}
            invalid={hasEmailError}
            errorMessage={hasEmailError ? EMAIL_FORMAT_ERROR : undefined}
            className="flex-1"
          />
          <Button
            type="button"
            variant="weak"
            color={canSend ? "brand" : "neutral"}
            size="md"
            disabled={!canSend}
            isLoading={verification.pendingAction === "send"}
            onClick={() => sendCode(email)}
            className="mt-[27px] shrink-0"
          >
            인증하기
          </Button>
        </div>
        <VerificationCodeField
          label="인증 번호"
          placeholder="숫자 6자리"
          clearable={false}
          value={verification.code}
          onChange={(event) => verification.changeCode(event.target.value)}
          timer={verification.timer}
          invalid={verification.codeError !== null}
          errorMessage={verification.codeError}
          info={
            verification.sentTarget !== null && (
              <TextInfoButton onClick={() => setIsHelpOpen(true)}>
                인증 메일이 안 왔나요?
              </TextInfoButton>
            )
          }
          className="min-h-[122px]"
        />
      </div>
      <RecoveryFormActions
        submitLabel="다음"
        canSubmit={canGoNext}
        isSubmitting={verification.pendingAction === "verify"}
      />
      <EmailCodeHelpDialog
        open={isHelpOpen}
        onOpenChange={setIsHelpOpen}
        onResend={() => sendCode(verification.sentTarget ?? email)}
      />
    </form>
  )
}
