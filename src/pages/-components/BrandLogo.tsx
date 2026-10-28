import { UmcLogo } from "@umc-product/icons"

const LOGO_HEIGHT = 50

export function BrandLogo() {
  return (
    <div className="flex flex-col items-center gap-4">
      <UmcLogo
        height={LOGO_HEIGHT}
        aria-label="UMC"
        className="text-teal-grey-700"
      />
      <p className="text-label-5-medium text-neutral-strong-800">
        UNIVERSITY MAKEUS CHALLENGE
      </p>
    </div>
  )
}
