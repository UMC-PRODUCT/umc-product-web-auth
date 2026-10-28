import {
  Button,
  TextFieldBox,
  TextInfoButton,
  VerificationCodeField,
} from "@umc-product/react"
import { type FormEvent, useState } from "react"

import {
  type FoundAccount,
  findEmail,
  isAuthError,
  requestRecoveryCode,
} from "@/api/authStub"
import { useCodeVerification } from "@/lib/useCodeVerification"
import { useServerErrorToast } from "@/lib/useServerErrorToast"
import { formatPhone, isValidPhone, toPhoneDigits } from "@/lib/validation"

import { SmsCodeHelpDialog } from "../SmsCodeHelpDialog"
import { AccountNotFoundDialog } from "./AccountNotFoundDialog"
import { RecoveryFormActions } from "./RecoveryFormActions"

type FindEmailFormProps = {
  onFound: (account: FoundAccount) => void
}

export function FindEmailForm({ onFound }: FindEmailFormProps) {
  const showServerError = useServerErrorToast()
  const [name, setName] = useState("")
  const [phoneDigits, setPhoneDigits] = useState("")
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isNotFoundOpen, setIsNotFoundOpen] = useState(false)
  const verification = useCodeVerification(phoneDigits)

  const canSend = isValidPhone(phoneDigits) && verification.needsNewCode
  const canFind = name.trim() !== "" && verification.canVerify

  const sendCode = async () => {
    try {
      await verification.send(phoneDigits, requestRecoveryCode)
    } catch {
      showServerError()
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const account = await verification.verify((code) =>
        findEmail({ name, phoneDigits, code }),
      )
      onFound(account)
    } catch (error) {
      if (isAuthError(error, "ACCOUNT_NOT_FOUND")) {
        setIsNotFoundOpen(true)
      } else if (!isAuthError(error, "CODE_MISMATCH")) {
        showServerError()
      }
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
        <div className="flex items-end gap-1.5">
          <TextFieldBox
            label="전화번호"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="010-0000-0000"
            clearable={false}
            value={formatPhone(phoneDigits)}
            onChange={(event) =>
              setPhoneDigits(toPhoneDigits(event.target.value))
            }
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
            className="shrink-0"
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
          className="min-h-[122px]"
        />
      </div>
      <RecoveryFormActions
        submitLabel="이메일 찾기"
        canSubmit={canFind}
        isSubmitting={verification.pendingAction === "verify"}
      />
      <SmsCodeHelpDialog open={isHelpOpen} onOpenChange={setIsHelpOpen} />
      <AccountNotFoundDialog
        open={isNotFoundOpen}
        onClose={() => setIsNotFoundOpen(false)}
      />
    </form>
  )
}
