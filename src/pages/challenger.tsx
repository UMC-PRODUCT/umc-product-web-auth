import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Button, CodeField, Dialog, TextInfoButton } from "@umc-product/react"
import { type FormEvent, useState } from "react"

import { isAuthError, verifyCode } from "@/api/authStub"
import { useMediaQuery } from "@/lib/useMediaQuery"
import { useServerErrorToast } from "@/lib/useServerErrorToast"
import { VERIFICATION_CODE_LENGTH } from "@/lib/validation"

export const Route = createFileRoute("/challenger")({
  component: ChallengerPage,
})

const INVALID_CODE_ERROR = "올바르지 않은 인증코드 입니다"
const MOBILE_QUERY = "(max-width: 767px)"

function ChallengerPage() {
  const navigate = useNavigate()
  const showServerError = useServerErrorToast()
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const [code, setCode] = useState("")
  const [hasError, setHasError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const canSubmit = code.length === VERIFICATION_CODE_LENGTH && !hasError

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await verifyCode(code)
      navigate({ to: "/" })
    } catch (error) {
      if (isAuthError(error, "CODE_MISMATCH")) {
        setHasError(true)
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
      className="flex w-full max-w-[364px] flex-col items-center gap-10 pt-8 pb-[120px]"
    >
      <h1 className="text-heading-1-semibold text-neutral-default-900">
        UMC 챌린저 인증
      </h1>
      <div className="flex w-full flex-col gap-10">
        <CodeField
          label="개별 지원 코드"
          required
          length={VERIFICATION_CODE_LENGTH}
          size={isMobile ? "md" : "lg"}
          value={code}
          onValueChange={(nextCode) => {
            setCode(nextCode)
            setHasError(false)
          }}
          invalid={hasError}
          errorMessage={hasError ? INVALID_CODE_ERROR : undefined}
          info={
            <TextInfoButton onClick={() => setIsHelpOpen(true)}>
              개별 지원 코드란?
            </TextInfoButton>
          }
          className={hasError ? "animate-shake" : undefined}
        />
        <Button
          type="submit"
          variant={canSubmit ? "fill" : "weak"}
          color="brand"
          size="md"
          className="w-full"
          disabled={!canSubmit}
          isLoading={isSubmitting}
        >
          시작하기
        </Button>
      </div>
      <Dialog
        open={isHelpOpen}
        onOpenChange={setIsHelpOpen}
        title="개별 인증코드란?"
        description="OT에서 안내한 챌린저 전용 인증 코드예요. 코드를 확인하기 어렵다면 소속 학교 회장단에 문의해 주세요."
        confirmLabel="닫기"
      />
    </form>
  )
}
