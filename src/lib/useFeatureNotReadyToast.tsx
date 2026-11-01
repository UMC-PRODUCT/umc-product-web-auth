import { CheckCircleIcon } from "@umc-product/icons"
import { useToast } from "@umc-product/react"
import { useCallback } from "react"

const FEATURE_NOT_READY_MESSAGE = "해당 기능은 아직 준비중입니다."

export function useFeatureNotReadyToast() {
  const toast = useToast()
  return useCallback(
    () =>
      toast.show({
        message: FEATURE_NOT_READY_MESSAGE,
        color: "error",
        icon: <CheckCircleIcon />,
      }),
    [toast],
  )
}
