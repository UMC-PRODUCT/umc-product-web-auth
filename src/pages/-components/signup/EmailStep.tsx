import {
  Button,
  TextFieldBox,
  TextInfoButton,
  VerificationCodeField,
} from "@umc-product/react"
import { type FormEvent, useState } from "react"

import { isAuthError, requestEmailCode, verifyCode } from "@/api/authStub"
import { EMAIL_FORMAT_ERROR } from "@/lib/messages"
import { useCodeVerification } from "@/lib/useCodeVerification"
import { useServerErrorToast } from "@/lib/useServerErrorToast"
import { isValidEmail } from "@/lib/validation"

import { EmailCodeHelpDialog } from "../EmailCodeHelpDialog"

const EMAIL_TAKEN_ERROR = "이미 가입된 계정이 있어요"

type EmailStepProps = {
  defaultEmail: string
  onVerified: (email: string) => void
}

export function EmailStep({ defaultEmail, onVerified }: EmailStepProps) {
  const showServerError = useServerErrorToast()
  const [email, setEmail] = useState(defaultEmail)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const verification = useCodeVerification(email)

  const isSent = verification.sentTarget !== null
  const isEmailValid = isValidEmail(email)
  const canResend = isEmailValid && verification.needsNewCode
  const canSubmit = isSent ? verification.canVerify : email !== ""

  const sendCode = async (targetEmail: string) => {
    try {
      await verification.send(targetEmail, requestEmailCode)
    } catch (error) {
      if (isAuthError(error, "EMAIL_TAKEN")) {
        setEmailError(EMAIL_TAKEN_ERROR)
      } else {
        showServerError()
      }
    }
  }

  const verify = async () => {
    try {
      await verification.verify(verifyCode)
      onVerified(email)
    } catch (error) {
      if (!isAuthError(error, "CODE_MISMATCH")) showServerError()
    }
  }

  const validateEmail = () => {
    if (email !== "" && !isEmailValid) setEmailError(EMAIL_FORMAT_ERROR)
    return isEmailValid
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSent) {
      verify()
      return
    }
    if (validateEmail()) sendCode(email)
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-10"
    >
      <div className="flex w-full flex-col gap-4">
        <div className="flex min-h-[99px] items-start gap-1.5">
          <TextFieldBox
            label="이메일"
            placeholder="이메일을 적어주세요"
            clearable={!isSent}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setEmailError(null)
            }}
            onBlur={validateEmail}
            invalid={emailError !== null}
            errorMessage={emailError}
            className="flex-1"
          />
          {isSent && (
            <Button
              type="button"
              variant="weak"
              color={canResend ? "brand" : "neutral"}
              size="md"
              disabled={!canResend}
              isLoading={verification.pendingAction === "send"}
              onClick={() => sendCode(email)}
              className="mt-[27px] shrink-0"
            >
              인증하기
            </Button>
          )}
        </div>
        {isSent && (
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
              <TextInfoButton onClick={() => setIsHelpOpen(true)}>
                인증 메일이 안 왔나요?
              </TextInfoButton>
            }
          />
        )}
      </div>
      <Button
        type="submit"
        variant={canSubmit ? "fill" : "weak"}
        color="brand"
        size="md"
        className="w-full"
        disabled={!canSubmit}
        isLoading={
          verification.pendingAction === "verify" ||
          (!isSent && verification.pendingAction === "send")
        }
      >
        다음
      </Button>
      <EmailCodeHelpDialog
        open={isHelpOpen}
        onOpenChange={setIsHelpOpen}
        onResend={() => sendCode(verification.sentTarget ?? email)}
      />
    </form>
  )
}
