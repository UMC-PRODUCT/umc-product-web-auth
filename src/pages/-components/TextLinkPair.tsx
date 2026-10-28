import { Divider, TextButton } from "@umc-product/react"

type TextLinkPairProps = {
  neutralLabel: string
  onNeutralClick?: () => void
  brandLabel: string
  onBrandClick: () => void
}

export function TextLinkPair({
  neutralLabel,
  onNeutralClick,
  brandLabel,
  onBrandClick,
}: TextLinkPairProps) {
  return (
    <div className="flex items-center gap-3">
      <TextButton color="neutral" size="xs" onClick={onNeutralClick}>
        {neutralLabel}
      </TextButton>
      <Divider orientation="vertical" className="h-3" />
      <TextButton color="brand" size="xs" onClick={onBrandClick}>
        {brandLabel}
      </TextButton>
    </div>
  )
}
