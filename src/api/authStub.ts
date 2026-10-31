const FAKE_LATENCY_MS = 600

export const STUB_INPUTS = {
  wrongPassword: "wrong1234",
  serverErrorEmail: "error@umc.dev",
  takenEmail: "taken@umc.dev",
  wrongCode: "000000",
  takenPhone: "01000000000",
  unreachablePhone: "01099999999",
  unknownName: "없는사람",
  localAccountNickname: "로컬",
  allProvidersNickname: "전부연동",
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

export type School = {
  schoolId: string
  schoolName: string
}

const STUB_SCHOOLS: School[] = [
  { schoolId: "1", schoolName: "가천대" },
  { schoolId: "2", schoolName: "가톨릭대" },
  { schoolId: "3", schoolName: "광운대" },
  { schoolId: "4", schoolName: "단국대" },
  { schoolId: "5", schoolName: "덕성여대" },
  { schoolId: "6", schoolName: "한양대 ERICA" },
]

export async function listSchools() {
  await respond(null)
  return STUB_SCHOOLS
}

export type LinkedProvider = "kakao" | "apple" | "google"

export type FoundAccount = {
  name: string
  nickname: string
  schoolName: string
  email: string
  joinedAt: string
  linkedProviders: LinkedProvider[]
}

type FindEmailRequest = {
  schoolId: string
  name: string
  nickname: string
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
  email: "mcp123@gmail.com",
  joinedAt: "2024-03-02",
}

function linkedProvidersFor(nickname: string): LinkedProvider[] {
  if (nickname === STUB_INPUTS.localAccountNickname) return []
  if (nickname === STUB_INPUTS.allProvidersNickname) {
    return ["google", "kakao", "apple"]
  }
  return ["kakao"]
}

export function requestRecoveryCode() {
  return respond(null)
}

export async function findEmail({
  name,
  nickname,
}: FindEmailRequest): Promise<FoundAccount> {
  await respond(name === STUB_INPUTS.unknownName ? "ACCOUNT_NOT_FOUND" : null)
  return { ...FOUND_ACCOUNT, linkedProviders: linkedProvidersFor(nickname) }
}

export function resetPassword({ name }: ResetPasswordRequest) {
  return respond(name === STUB_INPUTS.unknownName ? "ACCOUNT_NOT_FOUND" : null)
}
