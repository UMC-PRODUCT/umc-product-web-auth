import { Select, type SelectOption, TextFieldBox } from "@umc-product/react"
import { type FormEvent, useEffect, useState } from "react"

import {
  type FoundAccount,
  findEmail,
  isAuthError,
  listSchools,
} from "@/api/authStub"
import { useServerErrorToast } from "@/lib/useServerErrorToast"
import { isValidNickname } from "@/lib/validation"

import { AccountNotFoundDialog } from "./AccountNotFoundDialog"
import { RecoveryFormActions } from "./RecoveryFormActions"

const NICKNAME_RULE = "공백 없이 한글 1-4자"

type FindEmailFormProps = {
  onFound: (account: FoundAccount) => void
}

export function FindEmailForm({ onFound }: FindEmailFormProps) {
  const showServerError = useServerErrorToast()
  const [schoolOptions, setSchoolOptions] = useState<SelectOption[]>([])
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [nickname, setNickname] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isNotFoundOpen, setIsNotFoundOpen] = useState(false)

  useEffect(() => {
    listSchools()
      .then((schools) =>
        setSchoolOptions(
          schools.map(({ schoolId, schoolName }) => ({
            value: schoolId,
            label: schoolName,
          })),
        ),
      )
      .catch(showServerError)
  }, [showServerError])

  const hasValidNickname = isValidNickname(nickname)
  const canFind = schoolId !== null && name.trim() !== "" && hasValidNickname

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (schoolId === null || !canFind) return
    setIsSubmitting(true)
    try {
      onFound(await findEmail({ schoolId, name, nickname }))
    } catch (error) {
      if (isAuthError(error, "ACCOUNT_NOT_FOUND")) {
        setIsNotFoundOpen(true)
      } else {
        showServerError()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3"
    >
      <div className="flex w-full flex-col gap-5">
        <Select
          label="학교"
          placeholder="학교를 선택해주세요"
          options={schoolOptions}
          value={schoolId}
          onValueChange={setSchoolId}
          searchable
        />
        <TextFieldBox
          label="이름"
          placeholder="김유엠"
          autoComplete="name"
          clearable={false}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <TextFieldBox
          label="닉네임"
          placeholder="윰씨"
          clearable={false}
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          caption={NICKNAME_RULE}
          captionSize="lg"
          captionColor={hasValidNickname ? "success" : "neutral"}
        />
      </div>
      <RecoveryFormActions
        submitLabel="이메일 찾기"
        canSubmit={canFind}
        isSubmitting={isSubmitting}
      />
      <AccountNotFoundDialog
        open={isNotFoundOpen}
        onClose={() => setIsNotFoundOpen(false)}
      />
    </form>
  )
}
