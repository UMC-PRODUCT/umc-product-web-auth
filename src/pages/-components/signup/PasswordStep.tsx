import { Button, TextFieldBox } from "@umc-product/react"
import { type FormEvent, useState } from "react"

import { PASSWORD_RULE, PASSWORD_SYMBOL_RULE } from "@/lib/messages"
import { findPasswordIssue } from "@/lib/validation"

type PasswordStepProps = {
  email: string
  onDone: () => void
}

export function PasswordStep({ email, onDone }: PasswordStepProps) {
  const [password, setPassword] = useState("")
  const [isTouched, setIsTouched] = useState(false)

  const issue = findPasswordIssue(password)
  const showsError = isTouched && password !== "" && issue !== null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (issue === null) onDone()
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-10"
    >
      <div className="flex w-full flex-col gap-4">
        <TextFieldBox
          label="아이디"
          value={email}
          clearable={false}
          disabled
          readOnly
        />
        <TextFieldBox
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력하세요"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onBlur={() => setIsTouched(true)}
          invalid={showsError}
          caption={showsError ? undefined : PASSWORD_RULE}
          errorMessage={
            showsError &&
            (issue === "symbol" ? (
              <>
                {PASSWORD_RULE}
                <br />
                {PASSWORD_SYMBOL_RULE}
              </>
            ) : (
              PASSWORD_RULE
            ))
          }
        />
      </div>
      <Button
        type="submit"
        variant={issue === null ? "fill" : "weak"}
        color="brand"
        size="md"
        className="w-full"
        disabled={issue !== null}
      >
        다음
      </Button>
    </form>
  )
}
