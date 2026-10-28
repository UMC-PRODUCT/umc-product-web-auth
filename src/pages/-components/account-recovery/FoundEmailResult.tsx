import { useNavigate } from "@tanstack/react-router"
import { Button } from "@umc-product/react"
import { type ReactNode } from "react"

import { type FoundAccount, type LinkedProvider } from "@/api/authStub"

const PROVIDER_ORDER: LinkedProvider[] = ["kakao", "apple", "google"]

const PROVIDER_LABELS: Record<LinkedProvider, string> = {
  kakao: "카카오",
  apple: "Apple",
  google: "Google",
}

type FoundEmailResultProps = {
  account: FoundAccount
}

export function FoundEmailResult({ account }: FoundEmailResultProps) {
  const navigate = useNavigate()
  const linkedProviders = PROVIDER_ORDER.filter((provider) =>
    account.linkedProviders.includes(provider),
  )

  return (
    <div className="flex w-full flex-col items-center gap-10">
      <div className="flex w-full flex-col items-center gap-8">
        <h1 className="text-center text-neutral-strong-800 text-title-3-medium leading-normal">
          <span className="font-semibold text-brand-default-600">
            {account.nickname}/{account.name}
          </span>{" "}
          <span className="font-bold">·</span>{" "}
          <span className="font-semibold text-brand-default-600">
            {account.schoolName}
          </span>{" "}
          님의
          <br />
          가입한 이메일을 찾았어요
        </h1>
        <dl className="flex w-full flex-col gap-3.5 rounded-[10px] bg-fill-neutral-weaker-50 px-[38px] py-5 text-body-1-medium">
          <AccountInfoRow term="이메일">{account.maskedEmail}</AccountInfoRow>
          <AccountInfoRow term="가입일">
            {account.joinedAt.replaceAll("-", ". ")}
          </AccountInfoRow>
          {linkedProviders.length > 0 && (
            <AccountInfoRow term="연동 계정">
              <span className="flex flex-wrap gap-x-3">
                {linkedProviders.map((provider) => (
                  <span key={provider}>{PROVIDER_LABELS[provider]}</span>
                ))}
              </span>
            </AccountInfoRow>
          )}
        </dl>
      </div>
      <Button
        variant="weak"
        color="brand"
        size="md"
        className="w-full"
        onClick={() => navigate({ to: "/login" })}
      >
        로그인 하기
      </Button>
    </div>
  )
}

type AccountInfoRowProps = {
  term: string
  children: ReactNode
}

function AccountInfoRow({ term, children }: AccountInfoRowProps) {
  return (
    <div className="flex items-center gap-[29px]">
      <dt className="w-[60px] shrink-0 text-neutral-medium-600">{term}</dt>
      <dd className="min-w-0 flex-1 break-all text-neutral-strong-800">
        {children}
      </dd>
    </div>
  )
}
