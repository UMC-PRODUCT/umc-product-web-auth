import { UmcLogo } from "@umc-product/icons"

const DESKTOP_LOGO_HEIGHT = 50

export function BrandLogo() {
  return (
    <div className="flex flex-col items-center gap-4">
      <UmcLogo
        height={DESKTOP_LOGO_HEIGHT}
        aria-label="UMC"
        className="h-10 w-auto text-teal-grey-700 md:h-[50px]"
      />
      <p className="text-caption-2-medium text-neutral-strong-800 md:text-label-5-medium">
        UNIVERSITY MAKEUS CHALLENGE
      </p>
    </div>
  )
}
