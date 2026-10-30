import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Button } from "@umc-product/react"
import { useEffect, useState } from "react"

import { ApiError } from "@/api/http"
import { fetchSsoSession, type SsoSession } from "@/api/sso"
import { readAuthorizeRequest } from "@/lib/authorize-request"
import { resolveLoginAudience } from "@/lib/login-audience"
import { useSocialLogin } from "@/lib/oauth/useSocialLogin"

import { AdminAccessDeniedDialog } from "./-components/AdminAccessDeniedDialog"
import { AuthSpinner } from "./-components/AuthSpinner"
import { BrandLogo } from "./-components/BrandLogo"
import { OAuthLoginButton, type OAuthProvider } from "./-components/OAuthButton"
import { OrDivider } from "./-components/OrDivider"
import { TextLinkPair } from "./-components/TextLinkPair"

export const Route = createFileRoute("/")({
  component: LoginHubPage,
})

const HUB_PROVIDERS: OAuthProvider[] = ["apple", "google", "kakao"]
const COPYRIGHT = "© 2026 UMC Product All rights reserved."

function LoginHubPage() {
  const navigate = useNavigate()
  const { start, adminDeniedOpen, setAdminDeniedOpen } = useSocialLogin()
  const audience = resolveLoginAudience(readAuthorizeRequest()?.client_id)
  const [session, setSession] = useState<SsoSession | null | undefined>(
    undefined,
  )
  const [statusError, setStatusError] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchSsoSession()
      .then((next) => {
        if (!cancelled) {
          setSession(next)
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }
        if (error instanceof ApiError && error.status === 401) {
          setSession(null)
          return
        }
        setStatusError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const deniedDialog = (
    <AdminAccessDeniedDialog
      open={adminDeniedOpen}
      onOpenChange={setAdminDeniedOpen}
    />
  )

  if (statusError) {
    return (
      <>
        <p>로그인 상태를 확인하지 못했습니다.</p>
        {deniedDialog}
      </>
    )
  }

  if (session) {
    return (
      <>
        <div className="flex w-full max-w-[360px] flex-col items-center gap-6">
          <BrandLogo audience={audience} surface="hub" />
          <p className="text-body-2-regular text-neutral-default-900">
            로그인되어 있습니다.
          </p>
          <Button
            color="brand"
            onClick={() => navigate({ to: "/logout" })}
            size="md"
            variant="weak"
          >
            로그아웃
          </Button>
        </div>
        {deniedDialog}
      </>
    )
  }

  if (session === undefined) {
    return (
      <>
        <AuthSpinner label="로그인 확인 중" />
        {deniedDialog}
      </>
    )
  }

  return (
    <div className="flex w-full max-w-[440px] flex-col items-center gap-8 px-10 py-8">
      <div
        className={`flex w-full max-w-[360px] flex-col items-center ${
          audience === "activity"
            ? "gap-10"
            : audience === "admin"
              ? "gap-8"
              : "gap-16"
        }`}
      >
        <BrandLogo audience={audience} surface="hub" />
        <div className="flex w-full flex-col items-center gap-4">
          <div className="flex w-full flex-col gap-3">
            {HUB_PROVIDERS.map((provider) => (
              <OAuthLoginButton
                key={provider}
                provider={provider}
                onClick={() => start(provider)}
              />
            ))}
          </div>
          <OrDivider />
          <div className="flex w-full flex-col items-center gap-4">
            <Button
              variant="weak"
              color="brand"
              size="md"
              className="w-full"
              onClick={() => navigate({ to: "/login", replace: true })}
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
      <p className="w-full text-center text-body-2-regular text-disabled">
        {COPYRIGHT}
      </p>
      {deniedDialog}
    </div>
  )
}
