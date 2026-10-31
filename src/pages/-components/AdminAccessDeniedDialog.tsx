import { Button, Dimmed } from "@umc-product/react"
import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"

import { getUmcHomeUrl } from "@/lib/admin-access"

type AdminAccessDeniedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Figma Web/Dialog (Button Style=Fill, 아이콘 없음, CTA 1개).
 * DS `Dialog`는 cancel 없이 confirm만 있으면 TextButton(weak)로 렌더되어
 * Figma Fill brand 버튼과 달라, 동일 dialog 토큰/클래스 + `Button` fill로 맞춘다.
 *
 * CTA: `VITE_UMC_HOME_URL`이 있으면 「UMC 홈으로」이동, 없으면 「확인」으로 닫기.
 */
export function AdminAccessDeniedDialog({
  open,
  onOpenChange,
}: AdminAccessDeniedDialogProps) {
  const homeUrl = getUmcHomeUrl()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const focusConfirmButton = () => {
      dialogRef.current?.querySelector<HTMLElement>("button")?.focus()
    }
    focusConfirmButton()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false)
        return
      }
      if (event.key === "Tab") {
        event.preventDefault()
        focusConfirmButton()
      }
    }
    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
      previousFocus?.focus()
    }
  }, [open, onOpenChange])

  if (!open || typeof document === "undefined") {
    return null
  }

  return createPortal(
    <>
      <Dimmed
        intensity="weak"
        className="umc-dialog__backdrop"
        onClick={() => onOpenChange(false)}
      />
      <div className="umc-dialog__viewport">
        <div
          ref={dialogRef}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="admin-access-denied-title"
          aria-describedby="admin-access-denied-description"
          className="umc-dialog__popup !w-[446px] !min-w-[446px] !max-w-none shrink-0"
          data-color="brand"
          data-button-style="fill"
        >
          <div className="umc-dialog__text">
            <div className="umc-dialog__heading">
              <h2 id="admin-access-denied-title" className="umc-dialog__title">
                운영진 권한이 없어요
              </h2>
            </div>
            <p
              id="admin-access-denied-description"
              className="umc-dialog__description"
            >
              UMC Operation은 운영진으로 등록된 계정만 이용할 수 있어요.
            </p>
          </div>
          <div
            className="umc-dialog__actions"
            data-variant="fill"
            data-color="brand"
          >
            <Button
              variant="fill"
              color="brand"
              size="xs"
              onClick={() => {
                if (homeUrl) {
                  window.location.assign(homeUrl)
                  return
                }
                onOpenChange(false)
              }}
            >
              {homeUrl ? "UMC 홈으로" : "확인"}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
