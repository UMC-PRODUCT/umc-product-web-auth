const HEAD_ONLY_MAX_LENGTH = 2
const ONE_CHAR_HEAD_MAX_LENGTH = 5

export function maskEmail(email: string) {
  const atIndex = email.lastIndexOf("@")
  if (atIndex < 0) return maskLocalPart(email)
  return maskLocalPart(email.slice(0, atIndex)) + email.slice(atIndex)
}

function maskLocalPart(localPart: string) {
  if (localPart.length <= HEAD_ONLY_MAX_LENGTH) {
    return `${localPart.slice(0, -1)}*`
  }
  const headLength = localPart.length <= ONE_CHAR_HEAD_MAX_LENGTH ? 1 : 2
  const hiddenLength = localPart.length - headLength - 1
  return (
    localPart.slice(0, headLength) +
    "*".repeat(hiddenLength) +
    localPart.slice(-1)
  )
}
