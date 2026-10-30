import { UmcLogo } from "@umc-product/icons"

import activityLogo from "@/assets/brand/umc-activity-logo.svg"
import operationLogo from "@/assets/brand/umc-operation-logo.svg"
import { type LoginAudience } from "@/lib/login-audience"

const LOGO_HEIGHT = 50
const ADMIN_LOGO_HEIGHT = 45
const ACTIVITY_LOGO_WIDTH = 191
const ACTIVITY_LOGO_HEIGHT = 84
const OPERATION_LOGO_WIDTH = 222
const OPERATION_LOGO_HEIGHT = 84

type BrandLogoProps = {
  audience?: LoginAudience
  /**
   * hub(`/`): Admin = UmcLogo + 운영진 워크스페이스.
   * form(`/login`): Admin = OPERATION 11TH 워드마크 SVG (Activity SVG와 동일 계열).
   * default / activity 는 hub·form 동일.
   */
  surface?: "hub" | "form"
}

export function BrandLogo({
  audience = "default",
  surface = "form",
}: BrandLogoProps) {
  if (audience === "activity") {
    return (
      <img
        src={activityLogo}
        alt="UMC ACTIVITY 11TH"
        width={ACTIVITY_LOGO_WIDTH}
        height={ACTIVITY_LOGO_HEIGHT}
      />
    )
  }

  if (audience === "admin" && surface === "form") {
    return (
      <img
        src={operationLogo}
        alt="UMC OPERATION 11TH"
        width={OPERATION_LOGO_WIDTH}
        height={OPERATION_LOGO_HEIGHT}
      />
    )
  }

  if (audience === "admin") {
    return (
      <div className="flex flex-col items-center gap-4">
        <UmcLogo
          height={ADMIN_LOGO_HEIGHT}
          aria-label="UMC"
          className="text-teal-grey-700"
        />
        <p className="text-center text-neutral-medium-600 text-title-3-medium">
          UMC 운영진 워크스페이스
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <UmcLogo
        height={LOGO_HEIGHT}
        aria-label="UMC"
        className="text-teal-grey-700"
      />
      <p className="w-[264px] text-center text-label-5-medium text-neutral-strong-800">
        UNIVERSITY MAKEUS CHALLENGE
      </p>
    </div>
  )
}
