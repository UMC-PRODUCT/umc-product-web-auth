const FAKE_LATENCY_MS = 600

export const STUB_INPUTS = {
  wrongPassword: "wrong1234",
  serverErrorEmail: "error@umc.dev",
  takenEmail: "taken@umc.dev",
  wrongCode: "000000",
  takenPhone: "01000000000",
  unreachablePhone: "01099999999",
  unknownName: "없는사람",
  localAccountPhone: "01022222222",
  allProvidersPhone: "01033333333",
} as const

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "SERVER_ERROR"
  | "EMAIL_TAKEN"
  | "CODE_MISMATCH"
  | "PHONE_TAKEN"
  | "SEND_FAILED"
  | "ACCOUNT_NOT_FOUND"

export class AuthError extends Error {
  readonly code: AuthErrorCode

  constructor(code: AuthErrorCode) {
    super(code)
    this.code = code
  }
}

export function isAuthError(error: unknown, code: AuthErrorCode) {
  return error instanceof AuthError && error.code === code
}

async function respond(failure: AuthErrorCode | null) {
  await new Promise((resolve) => setTimeout(resolve, FAKE_LATENCY_MS))
  if (failure) throw new AuthError(failure)
}

export function loginByEmail(email: string, password: string) {
  if (email === STUB_INPUTS.serverErrorEmail) return respond("SERVER_ERROR")
  return respond(
    password === STUB_INPUTS.wrongPassword ? "INVALID_CREDENTIALS" : null,
  )
}

export function requestEmailCode(email: string) {
  return respond(email === STUB_INPUTS.takenEmail ? "EMAIL_TAKEN" : null)
}

export function requestPhoneCode(phoneDigits: string) {
  if (phoneDigits === STUB_INPUTS.takenPhone) return respond("PHONE_TAKEN")
  return respond(
    phoneDigits === STUB_INPUTS.unreachablePhone ? "SEND_FAILED" : null,
  )
}

export function verifyCode(code: string) {
  return respond(code === STUB_INPUTS.wrongCode ? "CODE_MISMATCH" : null)
}

export type LinkedProvider = "kakao" | "apple" | "google"

export type FoundAccount = {
  name: string
  nickname: string
  schoolName: string
  maskedEmail: string
  joinedAt: string
  linkedProviders: LinkedProvider[]
}

type FindEmailRequest = {
  name: string
  phoneDigits: string
  code: string
}

type ResetPasswordRequest = {
  name: string
  email: string
  newPassword: string
}

const FOUND_ACCOUNT: Omit<FoundAccount, "linkedProviders"> = {
  name: "이예원",
  nickname: "이방토",
  schoolName: "한양대 ERICA",
  maskedEmail: "mc***3",
  joinedAt: "2024-03-02",
}

function linkedProvidersFor(phoneDigits: string): LinkedProvider[] {
  if (phoneDigits === STUB_INPUTS.localAccountPhone) return []
  if (phoneDigits === STUB_INPUTS.allProvidersPhone) {
    return ["google", "kakao", "apple"]
  }
  return ["kakao"]
}

export function requestRecoveryCode() {
  return respond(null)
}

export async function findEmail({
  name,
  phoneDigits,
  code,
}: FindEmailRequest): Promise<FoundAccount> {
  await respond(
    code === STUB_INPUTS.wrongCode
      ? "CODE_MISMATCH"
      : name === STUB_INPUTS.unknownName
        ? "ACCOUNT_NOT_FOUND"
        : null,
  )
  return { ...FOUND_ACCOUNT, linkedProviders: linkedProvidersFor(phoneDigits) }
}

export function resetPassword({ name }: ResetPasswordRequest) {
  return respond(name === STUB_INPUTS.unknownName ? "ACCOUNT_NOT_FOUND" : null)
}
