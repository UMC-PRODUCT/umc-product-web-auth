import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Button } from "@umc-product/react"

import { BrandLogo } from "./-components/BrandLogo"
import { OAuthLoginButton, type OAuthProvider } from "./-components/OAuthButton"
import { OrDivider } from "./-components/OrDivider"
import { TextLinkPair } from "./-components/TextLinkPair"

export const Route = createFileRoute("/")({
  component: LoginHubPage,
})

const HUB_PROVIDERS: OAuthProvider[] = ["apple", "google", "kakao"]

function LoginHubPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[500px] w-full max-w-[360px] flex-col items-center gap-16">
      <BrandLogo />
      <div className="flex w-full flex-col items-center gap-4">
        <div className="flex w-full flex-col gap-3">
          {HUB_PROVIDERS.map((provider) => (
            <OAuthLoginButton key={provider} provider={provider} />
          ))}
        </div>
        <OrDivider />
        <div className="flex w-full flex-col items-center gap-3.5">
          <Button
            variant="weak"
            color="brand"
            size="md"
            className="w-full"
            onClick={() => navigate({ to: "/login" })}
          >
            UMC 계정 로그인
          </Button>
          <TextLinkPair
            neutralLabel="계정 찾기"
            onNeutralClick={() =>
              navigate({ to: "/account-recovery", search: { tab: "email" } })
            }
            brandLabel="회원가입"
            onBrandClick={() => navigate({ to: "/signup" })}
          />
        </div>
      </div>
    </div>
  )
}
