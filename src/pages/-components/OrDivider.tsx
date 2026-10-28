import { Divider } from "@umc-product/react"

export function OrDivider() {
  return (
    <div className="flex h-6 w-[200px] items-center gap-3">
      <Divider className="flex-1" />
      <span className="text-body-1-regular text-disabled">or</span>
      <Divider className="flex-1" />
    </div>
  )
}
