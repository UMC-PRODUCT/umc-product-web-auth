import { Dialog } from "@umc-product/react"

type EmailCodeHelpDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onResend: () => void
}

export function EmailCodeHelpDialog({
  open,
  onOpenChange,
  onResend,
}: EmailCodeHelpDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="인증 메일이 안 왔나요?"
      description={
        <>
          인증 메일이 스팸 메일함에 있을 수 있어요.
          <br />
          확인한 뒤에도 메일이 없다면 다시 보내기를 눌러 주세요.
        </>
      }
      cancelLabel="닫기"
      confirmLabel="다시 보내기"
      onConfirm={onResend}
    />
  )
}
