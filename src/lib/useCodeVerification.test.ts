import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AuthError } from "@/api/authStub"

import { CODE_EXPIRED_ERROR, CODE_MISMATCH_ERROR } from "./messages"
import { useCodeVerification } from "./useCodeVerification"

const TARGET = "01012345678"
const sendSucceeds = () => Promise.resolve()

describe("useCodeVerification", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("보내기 전에는 새 코드가 필요하고 인증할 수 없다", () => {
    const { result } = renderHook(() => useCodeVerification(TARGET))
    expect(result.current.needsNewCode).toBe(true)
    expect(result.current.canVerify).toBe(false)
  })

  it("보낸 뒤 6자리를 입력하면 인증할 수 있고 대상이 바뀌면 다시 막힌다", async () => {
    const { result, rerender } = renderHook(
      ({ target }) => useCodeVerification(target),
      { initialProps: { target: TARGET } },
    )

    await act(() => result.current.send(TARGET, sendSucceeds))
    expect(result.current.needsNewCode).toBe(false)
    expect(result.current.timer).toBe("10:00")

    act(() => result.current.changeCode("12a3-456"))
    expect(result.current.code).toBe("123456")
    expect(result.current.canVerify).toBe(true)

    rerender({ target: "01099998888" })
    expect(result.current.needsNewCode).toBe(true)
    expect(result.current.canVerify).toBe(false)
  })

  it("보내기에 실패하면 상태를 바꾸지 않고 오류를 다시 던진다", async () => {
    const { result } = renderHook(() => useCodeVerification(TARGET))

    await act(async () => {
      await expect(
        result.current.send(TARGET, () =>
          Promise.reject(new AuthError("SEND_FAILED")),
        ),
      ).rejects.toThrow("SEND_FAILED")
    })
    expect(result.current.sentTarget).toBeNull()
    expect(result.current.timer).toBe("00:00")
    expect(result.current.needsNewCode).toBe(true)
    expect(result.current.pendingAction).toBeNull()
  })

  it("불일치 오류는 코드를 고치면 사라진다", async () => {
    const { result } = renderHook(() => useCodeVerification(TARGET))
    await act(() => result.current.send(TARGET, sendSucceeds))

    await act(async () => {
      await expect(
        result.current.verify(() =>
          Promise.reject(new AuthError("CODE_MISMATCH")),
        ),
      ).rejects.toThrow("CODE_MISMATCH")
    })
    expect(result.current.codeError).toBe(CODE_MISMATCH_ERROR)

    act(() => result.current.changeCode("1"))
    expect(result.current.codeError).toBeNull()
  })

  it("시간이 지나면 만료 오류가 나고 다시 보낼 수 있다", async () => {
    const { result } = renderHook(() => useCodeVerification(TARGET))
    await act(() => result.current.send(TARGET, sendSucceeds))

    act(() => vi.advanceTimersByTime(600_000))
    expect(result.current.codeError).toBe(CODE_EXPIRED_ERROR)
    expect(result.current.needsNewCode).toBe(true)
  })
})
