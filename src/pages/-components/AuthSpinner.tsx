type AuthSpinnerProps = {
  /** 스크린 리더용 안내. 화면에 글자로 보이진 않음. */
  label?: string
}

/** 디자인 시스템에 Spinner가 없어 브랜드(민트) 톤으로 둔 로딩 표시. */
export function AuthSpinner({ label = "로딩 중" }: AuthSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="flex items-center justify-center"
    >
      <span
        aria-hidden
        className="box-border size-9 rounded-full border-[3px] border-solid motion-safe:animate-spin motion-reduce:animate-pulse"
        style={{
          borderColor: "var(--umc-color-teal-100)",
          borderTopColor: "var(--umc-color-teal-600)",
        }}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
