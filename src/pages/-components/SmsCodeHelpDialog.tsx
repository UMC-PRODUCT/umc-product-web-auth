import { Dialog } from "@umc-product/react"

const KAKAO_CHANNEL_URL = "https://pf.kakao.com/_MDxhqX/chat"

type SmsCodeHelpDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SmsCodeHelpDialog({
  open,
  onOpenChange,
}: SmsCodeHelpDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="인증 문자가 안 왔나요?"
      description={
        <>
          문자가 도착하기까지 시간이 걸릴 수 있어요.
          <br />
          계속 문자를 받지 못하면{" "}
          <a
            href={KAKAO_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-default-600 underline"
          >
            카카오톡 채널
          </a>
          로 문의해 주세요.
        </>
      }
      confirmLabel="닫기"
    />
  )
}
