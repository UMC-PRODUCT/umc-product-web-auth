import { useEffect, useState } from "react"

const TICK_MS = 1000
const SECONDS_PER_MINUTE = 60

export function formatMinutesSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE)
  const seconds = totalSeconds % SECONDS_PER_MINUTE
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export function useCountdown() {
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (endsAt === null) return
    const timer = setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= endsAt) clearInterval(timer)
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [endsAt])

  const remainingSeconds =
    endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / TICK_MS))

  return {
    remainingSeconds,
    isExpired: endsAt !== null && remainingSeconds === 0,
    start: (seconds: number) => {
      const current = Date.now()
      setNow(current)
      setEndsAt(current + seconds * TICK_MS)
    },
  }
}
