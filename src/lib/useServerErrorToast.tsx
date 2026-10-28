import { CheckCircleIcon } from "@umc-product/icons"
import { useToast } from "@umc-product/react"

const SERVER_ERROR_MESSAGE = "잠시 후 다시 시도해 주세요"

export function useServerErrorToast() {
  const toast = useToast()
  return () =>
    toast.show({
      message: SERVER_ERROR_MESSAGE,
      color: "error",
      icon: <CheckCircleIcon />,
    })
}
