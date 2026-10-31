import { WarningTriangleIcon } from "@umc-product/icons"
import { Dialog } from "@umc-product/react"

type AccountNotFoundDialogProps = {
  open: boolean
  onClose: () => void
}

export function AccountNotFoundDialog({
  open,
  onClose,
}: AccountNotFoundDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
      color="error"
      icon={<WarningTriangleIcon weight="fill" />}
      title="계정을 찾지 못했어요"
      description="입력한 아이디, 학교, 이름, 닉네임을 다시 확인해 주세요."
      confirmLabel="확인"
    />
  )
}
