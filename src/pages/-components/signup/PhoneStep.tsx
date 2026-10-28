import {
  Button,
  TextFieldBox,
  TextInfoButton,
  VerificationCodeField,
} from "@umc-product/react"
import { type FormEvent, useState } from "react"

import { isAuthError, requestPhoneCode, verifyCode } from "@/api/authStub"
import { useCodeVerification } from "@/lib/useCodeVerification"
import { useServerErrorToast } from "@/lib/useServerErrorToast"
import { formatPhone, isValidPhone, toPhoneDigits } from "@/lib/validation"

import { SmsCodeHelpDialog } from "../SmsCodeHelpDialog"

const PHONE_TAKEN_ERROR = "이미 가입된 계정의 전화번호예요"
const SEND_FAILED_ERROR =
  "인증번호를 보내지 못했어요. 잠시 후 다시 시도해 주세요."

type PhoneStepProps = {
  onVerified: () => void
}

export function PhoneStep({ onVerified }: PhoneStepProps) {
  const showServerError = useServerErrorToast()
  const [phoneDigits, setPhoneDigits] = useState("")
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const verification = useCodeVerification(phoneDigits)

  const canSend =
    isValidPhone(phoneDigits) &&
    phoneError !== PHONE_TAKEN_ERROR &&
    verification.needsNewCode

  const sendCode = async () => {
    setPhoneError(null)
    try {
      await verification.send(phoneDigits, requestPhoneCode)
    } catch (error) {
      if (isAuthError(error, "PHONE_TAKEN")) {
        setPhoneError(PHONE_TAKEN_ERROR)
      } else if (isAuthError(error, "SEND_FAILED")) {
        setPhoneError(SEND_FAILED_ERROR)
      } else {
        showServerError()
      }
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await verification.verify(verifyCode)
      onVerified()
    } catch (error) {
      if (!isAuthError(error, "CODE_MISMATCH")) showServerError()
    }
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
            label="전화번호"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="010-0000-0000"
            clearable={false}
            value={formatPhone(phoneDigits)}
            onChange={(event) => {
              setPhoneDigits(toPhoneDigits(event.target.value))
              setPhoneError(null)
            }}
            invalid={phoneError !== null}
            errorMessage={phoneError}
            className="flex-1"
          />
          <Button
            type="button"
            variant="weak"
            color={canSend ? "brand" : "neutral"}
            size="md"
            disabled={!canSend}
            isLoading={verification.pendingAction === "send"}
            onClick={sendCode}
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
                인증 문자가 안왔나요?
              </TextInfoButton>
            )
          }
        />
      </div>
      <Button
        type="submit"
        variant={verification.canVerify ? "fill" : "weak"}
        color="brand"
        size="md"
        className="w-full"
        disabled={!verification.canVerify}
        isLoading={verification.pendingAction === "verify"}
      >
        다음
      </Button>
      <SmsCodeHelpDialog open={isHelpOpen} onOpenChange={setIsHelpOpen} />
    </form>
  )
}
