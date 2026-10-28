import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { SegmentedControl, type SegmentedControlItem } from "@umc-product/react"
import { useState } from "react"

import { type FoundAccount } from "@/api/authStub"

import { FindEmailForm } from "./-components/account-recovery/FindEmailForm"
import { FoundEmailResult } from "./-components/account-recovery/FoundEmailResult"
import { NewPasswordForm } from "./-components/account-recovery/NewPasswordForm"
import {
  type RecoveryUser,
  ResetPasswordVerifyForm,
} from "./-components/account-recovery/ResetPasswordVerifyForm"
import { BrandLogo } from "./-components/BrandLogo"

type RecoveryTab = "email" | "password"

const RECOVERY_TABS: SegmentedControlItem<RecoveryTab>[] = [
  { value: "email", label: "이메일 찾기" },
  { value: "password", label: "비밀번호 찾기" },
]

export const Route = createFileRoute("/account-recovery")({
  validateSearch: (search: Record<string, unknown>): { tab: RecoveryTab } => ({
    tab: search.tab === "password" ? "password" : "email",
  }),
  component: AccountRecoveryPage,
})

function AccountRecoveryPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { tab } = Route.useSearch()

  return (
    <section className="flex w-full max-w-[440px] flex-col items-center gap-10 py-8">
      <BrandLogo />
      <SegmentedControl
        aria-label="계정 찾기 방법"
        items={RECOVERY_TABS}
        value={tab}
        onValueChange={(nextTab) =>
          navigate({ search: { tab: nextTab }, replace: true })
        }
        className="max-w-[360px]"
      />
      {tab === "email" ? <FindEmailTab /> : <ResetPasswordTab />}
    </section>
  )
}

function FindEmailTab() {
  const [account, setAccount] = useState<FoundAccount | null>(null)

  if (account) return <FoundEmailResult account={account} />
  return <FindEmailForm onFound={setAccount} />
}

const EMPTY_RECOVERY_USER: RecoveryUser = { name: "", email: "" }

function ResetPasswordTab() {
  const [user, setUser] = useState(EMPTY_RECOVERY_USER)
  const [isVerified, setIsVerified] = useState(false)

  if (isVerified) {
    return (
      <NewPasswordForm
        user={user}
        onAccountNotFound={() => setIsVerified(false)}
      />
    )
  }
  return (
    <ResetPasswordVerifyForm
      defaultUser={user}
      onVerified={(verifiedUser) => {
        setUser(verifiedUser)
        setIsVerified(true)
      }}
    />
  )
}
