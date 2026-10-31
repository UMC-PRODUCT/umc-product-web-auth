import { describe, expect, it } from "vitest"

import { maskEmail } from "./maskEmail"

describe("maskEmail", () => {
  it.each([
    ["abcdef@gmail.com", "ab***f@gmail.com"],
    ["abc_def12@naver.com", "ab******2@naver.com"],
    ["2eabc3@gmail.com", "2e***3@gmail.com"],
    ["abcde@gmail.com", "a***e@gmail.com"],
    ["abc@gmail.com", "a*c@gmail.com"],
    ["ab@gmail.com", "a*@gmail.com"],
    ["a@gmail.com", "*@gmail.com"],
  ])("%s → %s", (email, expected) => {
    expect(maskEmail(email)).toBe(expected)
  })
})
