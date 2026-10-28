const FAKE_LATENCY_MS = 600

export const STUB_INPUTS = {
  wrongPassword: "wrong1234",
  serverErrorEmail: "error@umc.dev",
  takenEmail: "taken@umc.dev",
  wrongCode: "000000",
  takenPhone: "01000000000",
  unreachablePhone: "01099999999",
} as const

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "SERVER_ERROR"
  | "EMAIL_TAKEN"
  | "CODE_MISMATCH"
  | "PHONE_TAKEN"
  | "SEND_FAILED"

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
