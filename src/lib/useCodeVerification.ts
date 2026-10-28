import { useState } from "react"

import { isAuthError } from "@/api/authStub"
import { CODE_EXPIRED_ERROR, CODE_MISMATCH_ERROR } from "@/lib/messages"
import { formatMinutesSeconds, useCountdown } from "@/lib/useCountdown"
import { toDigits, VERIFICATION_CODE_LENGTH } from "@/lib/validation"

const CODE_VALID_SECONDS = 600

type PendingAction = "send" | "verify"

export function useCodeVerification(target: string) {
  const countdown = useCountdown()
  const [sentTarget, setSentTarget] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [hasCodeMismatch, setHasCodeMismatch] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const codeError = countdown.isExpired
    ? CODE_EXPIRED_ERROR
    : hasCodeMismatch
      ? CODE_MISMATCH_ERROR
      : null

  const runPending = async <T>(
    action: PendingAction,
    request: () => Promise<T>,
  ) => {
    setPendingAction(action)
    try {
      return await request()
    } finally {
      setPendingAction(null)
    }
  }

  const send = (
    sendTo: string,
    requestCode: (sendTo: string) => Promise<void>,
  ) =>
    runPending("send", async () => {
      await requestCode(sendTo)
      setSentTarget(sendTo)
      setCode("")
      setHasCodeMismatch(false)
      countdown.start(CODE_VALID_SECONDS)
    })

  const verify = <T>(request: (code: string) => Promise<T>) =>
    runPending("verify", async () => {
      try {
        return await request(code)
      } catch (error) {
        if (isAuthError(error, "CODE_MISMATCH")) setHasCodeMismatch(true)
        throw error
      }
    })

  return {
    code,
    codeError,
    sentTarget,
    pendingAction,
    timer: formatMinutesSeconds(countdown.remainingSeconds),
    needsNewCode: target !== sentTarget || countdown.isExpired,
    canVerify:
      target === sentTarget &&
      code.length === VERIFICATION_CODE_LENGTH &&
      codeError === null,
    changeCode: (value: string) => {
      setCode(toDigits(value, VERIFICATION_CODE_LENGTH))
      setHasCodeMismatch(false)
    },
    send,
    verify,
  }
}
