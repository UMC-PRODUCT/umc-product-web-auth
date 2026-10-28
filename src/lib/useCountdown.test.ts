import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { formatMinutesSeconds, useCountdown } from "./useCountdown"

describe("formatMinutesSeconds", () => {
  it.each([
    [600, "10:00"],
    [134, "02:14"],
    [0, "00:00"],
  ])("%i초 → %s", (seconds, expected) => {
    expect(formatMinutesSeconds(seconds)).toBe(expected)
  })
})

describe("useCountdown", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("시작 전에는 0초이고 만료가 아니다", () => {
    const { result } = renderHook(() => useCountdown())
    expect(result.current.remainingSeconds).toBe(0)
    expect(result.current.isExpired).toBe(false)
  })

  it("시간이 지나면 줄어들고 0초에서 만료된다", () => {
    const { result } = renderHook(() => useCountdown())

    act(() => result.current.start(3))
    expect(result.current.remainingSeconds).toBe(3)

    act(() => vi.advanceTimersByTime(1000))
    expect(result.current.remainingSeconds).toBe(2)

    act(() => vi.advanceTimersByTime(2000))
    expect(result.current.remainingSeconds).toBe(0)
    expect(result.current.isExpired).toBe(true)
  })
})
