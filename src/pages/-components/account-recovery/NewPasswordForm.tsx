import { useNavigate } from "@tanstack/react-router"
import { CheckPictogram } from "@umc-product/icons"
import { Dialog, TextFieldBox } from "@umc-product/react"
import { type FormEvent, useState } from "react"

import { isAuthError, resetPassword } from "@/api/authStub"
import { PASSWORD_RULE, PASSWORD_SYMBOL_RULE } from "@/lib/messages"
import { useServerErrorToast } from "@/lib/useServerErrorToast"
import { findPasswordIssue } from "@/lib/validation"

import { AccountNotFoundDialog } from "./AccountNotFoundDialog"
import { RecoveryFormActions } from "./RecoveryFormActions"
import { type RecoveryUser } from "./ResetPasswordVerifyForm"

const PASSWORD_MATCHED = "비밀번호 일치"
const PASSWORD_MISMATCHED = "비밀번호 불일치"

type ResultDialog = "changed" | "accountNotFound"

type NewPasswordFormProps = {
  user: RecoveryUser
  onAccountNotFound: () => void
}

export function NewPasswordForm({
  user,
  onAccountNotFound,
}: NewPasswordFormProps) {
  const navigate = useNavigate()
  const showServerError = useServerErrorToast()
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resultDialog, setResultDialog] = useState<ResultDialog | null>(null)

  const issue = findPasswordIssue(password)
  const isConfirmed = confirmation !== "" && confirmation === password
  const canChange = issue === null && isConfirmed

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await resetPassword({ ...user, newPassword: password })
      setResultDialog("changed")
    } catch (error) {
      if (isAuthError(error, "ACCOUNT_NOT_FOUND")) {
        setResultDialog("accountNotFound")
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
      className="flex w-full flex-col gap-3"
    >
      <div className="flex w-full flex-col gap-5">
        <TextFieldBox
          label="새 비밀번호"
          type="password"
          placeholder="새 비밀번호를 입력하세요"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          caption={
            issue === "symbol" ? (
              <>
                {PASSWORD_RULE}
                <br />
                {PASSWORD_SYMBOL_RULE}
              </>
            ) : (
              PASSWORD_RULE
            )
          }
          captionColor={issue === null ? "success" : "neutral"}
          className="min-h-[99px]"
        />
        <TextFieldBox
          label="새 비밀번호"
          aria-label="새 비밀번호 확인"
          type="password"
          placeholder="한번 더 입력하세요"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          caption={
            confirmation === ""
              ? undefined
              : isConfirmed
                ? PASSWORD_MATCHED
                : PASSWORD_MISMATCHED
          }
          captionColor={isConfirmed ? "success" : "neutral"}
          className="min-h-[99px]"
        />
      </div>
      <RecoveryFormActions
        submitLabel="비밀번호 변경하기"
        canSubmit={canChange}
        isSubmitting={isSubmitting}
      />
      <Dialog
        open={resultDialog === "changed"}
        onOpenChange={(open) => {
          if (!open) navigate({ to: "/login" })
        }}
        icon={<CheckPictogram size={24} />}
        title="비밀번호 변경 완료"
        description="새 비밀번호로 로그인해 주세요."
        confirmLabel="로그인하기"
      />
      <AccountNotFoundDialog
        open={resultDialog === "accountNotFound"}
        onClose={onAccountNotFound}
      />
    </form>
  )
}
