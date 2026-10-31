import appleBlackLogo from "@/assets/oauth/apple-black.svg"
import appleWhiteLogo from "@/assets/oauth/apple-white.svg"
import googleLogo from "@/assets/oauth/google.svg"
import kakaoLogo from "@/assets/oauth/kakao-20.svg"
import kakaoLargeLogo from "@/assets/oauth/kakao-24.svg"

export type OAuthProvider = "apple" | "google" | "kakao"

const OAUTH_LABELS: Record<OAuthProvider, string> = {
  apple: "Apple 로그인",
  google: "Google 로그인",
  kakao: "카카오 로그인",
}

const PRESS_OVERLAY_ON_LIGHT =
  "hover:shadow-[inset_0_0_0_100px_rgb(0_0_0/0.05)] active:shadow-[inset_0_0_0_100px_rgb(0_0_0/0.1)]"
const PRESS_OVERLAY_ON_DARK =
  "hover:shadow-[inset_0_0_0_100px_rgb(255_255_255/0.15)] active:shadow-[inset_0_0_0_100px_rgb(255_255_255/0.25)]"

const WIDE_BUTTONS: Record<
  OAuthProvider,
  { logo: string; width: number; height: number; className: string }
> = {
  apple: {
    logo: appleBlackLogo,
    width: 20.4,
    height: 24,
    className: `gap-4 border border-neutral-weak-200 bg-white text-neutral-default-900 ${PRESS_OVERLAY_ON_LIGHT}`,
  },
  google: {
    logo: googleLogo,
    width: 20,
    height: 20,
    className: `gap-3 border border-neutral-weak-200 bg-white text-neutral-default-900 ${PRESS_OVERLAY_ON_LIGHT}`,
  },
  kakao: {
    logo: kakaoLogo,
    width: 19,
    height: 19,
    className: `gap-[13px] bg-[#fee500] text-black/85 ${PRESS_OVERLAY_ON_LIGHT}`,
  },
}

const ICON_BUTTONS: Record<OAuthProvider, { logo: string; className: string }> =
  {
    apple: {
      logo: appleWhiteLogo,
      className: `bg-black ${PRESS_OVERLAY_ON_DARK}`,
    },
    google: {
      logo: googleLogo,
      className: `border border-neutral-weaker-100 bg-white ${PRESS_OVERLAY_ON_LIGHT}`,
    },
    kakao: {
      logo: kakaoLargeLogo,
      className: `bg-[#fee500] ${PRESS_OVERLAY_ON_LIGHT}`,
    },
  }

const ICON_LOGO_SIZE = 24

type OAuthButtonProps = {
  provider: OAuthProvider
  onClick?: () => void
}

export function OAuthLoginButton({ provider, onClick }: OAuthButtonProps) {
  const { logo, width, height, className } = WIDE_BUTTONS[provider]
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 w-full cursor-pointer items-center justify-center rounded-[10px] px-7 text-label-2-medium ${className}`}
    >
      <img src={logo} alt="" width={width} height={height} />
      {OAUTH_LABELS[provider]}
    </button>
  )
}

export function OAuthIconButton({ provider, onClick }: OAuthButtonProps) {
  const { logo, className } = ICON_BUTTONS[provider]
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={OAUTH_LABELS[provider]}
      className={`flex size-[54px] cursor-pointer items-center justify-center rounded-full ${className}`}
    >
      <img src={logo} alt="" width={ICON_LOGO_SIZE} height={ICON_LOGO_SIZE} />
    </button>
  )
}
