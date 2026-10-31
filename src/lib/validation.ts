const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const EMAIL_MAX_LENGTH = 100

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 64
const PASSWORD_MIN_CATEGORY_COUNT = 2
const PASSWORD_ALLOWED_CHARACTERS = /^[A-Za-z0-9!#$&*@?]*$/

const PHONE_DIGITS_PATTERN = /^01[016-9]\d{7,8}$/
const PHONE_MAX_DIGITS = 11

const NICKNAME_PATTERN = /^[가-힣]{1,4}$/

export const VERIFICATION_CODE_LENGTH = 6

export function isValidEmail(email: string) {
  return email.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(email)
}

export function isValidNickname(nickname: string) {
  return NICKNAME_PATTERN.test(nickname.normalize("NFC"))
}

export type PasswordIssue = "policy" | "symbol"

export function findPasswordIssue(password: string): PasswordIssue | null {
  if (!PASSWORD_ALLOWED_CHARACTERS.test(password)) return "symbol"

  const categoryCount = [/[A-Za-z]/, /\d/, /[^A-Za-z\d]/].filter((category) =>
    category.test(password),
  ).length
  const hasValidLength =
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH

  return hasValidLength && categoryCount >= PASSWORD_MIN_CATEGORY_COUNT
    ? null
    : "policy"
}

export function toDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength)
}

export function toPhoneDigits(value: string) {
  return toDigits(value, PHONE_MAX_DIGITS)
}

export function isValidPhone(digits: string) {
  return PHONE_DIGITS_PATTERN.test(digits)
}

export function formatPhone(digits: string) {
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return [digits.slice(0, 3), digits.slice(3, 7), digits.slice(7)]
    .filter(Boolean)
    .join("-")
}
