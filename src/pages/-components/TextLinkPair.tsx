import { Divider, TextButton } from "@umc-product/react"

type TextLinkPairProps = {
  neutralLabel: string
  onNeutralClick?: () => void
  brandLabel: string
  onBrandClick: () => void
  compactOnMobile?: boolean
}

export function TextLinkPair({
  neutralLabel,
  onNeutralClick,
  brandLabel,
  onBrandClick,
  compactOnMobile = false,
}: TextLinkPairProps) {
  const containerClassName = compactOnMobile
    ? "flex items-center gap-2.5 md:gap-3"
    : "flex items-center gap-3"
  const labelClassName = compactOnMobile
    ? "max-md:text-label-5-medium"
    : undefined

  return (
    <div className={containerClassName}>
      <TextButton
        color="neutral"
        size="xs"
        className={labelClassName}
        onClick={onNeutralClick}
      >
        {neutralLabel}
      </TextButton>
      <Divider orientation="vertical" className="h-3" />
      <TextButton
        color="brand"
        size="xs"
        className={labelClassName}
        onClick={onBrandClick}
      >
        {brandLabel}
      </TextButton>
    </div>
  )
}
