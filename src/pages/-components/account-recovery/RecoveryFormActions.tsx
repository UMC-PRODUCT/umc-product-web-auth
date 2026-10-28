import { useNavigate } from "@tanstack/react-router"
import { Button, TextButton } from "@umc-product/react"

type RecoveryFormActionsProps = {
  submitLabel: string
  canSubmit: boolean
  isSubmitting: boolean
}

export function RecoveryFormActions({
  submitLabel,
  canSubmit,
  isSubmitting,
}: RecoveryFormActionsProps) {
  const navigate = useNavigate()

  return (
    <div className="flex w-full flex-col items-center gap-2 pt-4 pb-2.5">
      <Button
        type="submit"
        variant={canSubmit ? "fill" : "weak"}
        color="brand"
        size="md"
        className="w-full"
        disabled={!canSubmit}
        isLoading={isSubmitting}
      >
        {submitLabel}
      </Button>
      <TextButton
        color="neutral"
        size="xs"
        className="h-12"
        onClick={() => navigate({ to: "/login" })}
      >
        로그인으로
      </TextButton>
    </div>
  )
}
