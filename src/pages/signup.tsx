import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { TextButton } from "@umc-product/react"
import { useState } from "react"

import { EmailStep } from "./-components/signup/EmailStep"
import { PasswordStep } from "./-components/signup/PasswordStep"
import { PhoneStep } from "./-components/signup/PhoneStep"

export const Route = createFileRoute("/signup")({
  component: SignupPage,
})

type SignupStep = "email" | "password" | "phone"

function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<SignupStep>("email")
  const [email, setEmail] = useState("")

  return (
    <section className="flex w-full max-w-[400px] flex-col items-center gap-10 pt-8 pb-[120px]">
      <h1 className="text-heading-1-semibold text-neutral-default-900">
        회원가입
      </h1>
      <div className="flex w-full flex-col items-center gap-3.5">
        {step === "email" && (
          <EmailStep
            defaultEmail={email}
            onVerified={(verifiedEmail) => {
              setEmail(verifiedEmail)
              setStep("password")
            }}
          />
        )}
        {step === "password" && (
          <PasswordStep email={email} onDone={() => setStep("phone")} />
        )}
        {step === "phone" && (
          <PhoneStep
            onVerified={() => {
              // TODO: 가입 직후 SSO 쿠키를 받는 방법이 정해지면 여기서 authorize 로 이어간다.
              void navigate({ to: "/login" })
            }}
          />
        )}
        <TextButton
          color="neutral"
          size="xs"
          onClick={() => navigate({ to: "/login" })}
        >
          이미 계정이 있어요
        </TextButton>
      </div>
    </section>
  )
}
