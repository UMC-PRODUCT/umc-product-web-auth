import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router"
import { ChevronLeftIcon } from "@umc-product/icons"
import { TextButton } from "@umc-product/react"
import { useState } from "react"

import { EmailStep } from "./-components/signup/EmailStep"
import { PasswordStep } from "./-components/signup/PasswordStep"
import { PhoneStep } from "./-components/signup/PhoneStep"

export const Route = createFileRoute("/signup")({
  component: SignupPage,
})

type SignupStep = "email" | "password" | "phone"

const PREVIOUS_STEP: Record<SignupStep, SignupStep | null> = {
  email: null,
  password: "email",
  phone: "password",
}

function SignupPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const [step, setStep] = useState<SignupStep>("email")
  const [email, setEmail] = useState("")

  const goBack = () => {
    const previousStep = PREVIOUS_STEP[step]
    if (previousStep) {
      setStep(previousStep)
    } else if (router.history.canGoBack()) {
      router.history.back()
    } else {
      navigate({ to: "/" })
    }
  }

  return (
    <>
      <TextButton
        color="neutral"
        size="md"
        leadingIcon={<ChevronLeftIcon />}
        onClick={goBack}
        className="absolute top-10 left-8 hidden h-12 pr-4 pl-3.5 lg:inline-flex"
      >
        이전
      </TextButton>
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
            <PhoneStep onVerified={() => navigate({ to: "/challenger" })} />
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
    </>
  )
}
