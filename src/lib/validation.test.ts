import { describe, expect, it } from "vitest"

import {
  findPasswordIssue,
  formatPhone,
  isValidEmail,
  isValidNickname,
  isValidPhone,
  toPhoneDigits,
} from "./validation"

describe("isValidEmail", () => {
  it.each([
    ["eee2@naver.com", true],
    ["eee2", false],
    ["eee2@naver", false],
    [`${"a".repeat(95)}@a.com`, false],
  ])("%s → %s", (email, expected) => {
    expect(isValidEmail(email)).toBe(expected)
  })
})

describe("isValidNickname", () => {
  it.each([
    ["윰", true],
    ["이방토", true],
    ["이방토".normalize("NFD"), true],
    ["전부연동", true],
    ["다섯글자임", false],
    ["이 방토", false],
    ["umc", false],
    ["윰씨1", false],
    ["ㅇㅇ", false],
    ["", false],
  ])("%s → %s", (nickname, expected) => {
    expect(isValidNickname(nickname)).toBe(expected)
  })
})

describe("findPasswordIssue", () => {
  it.each([
    ["abcd1234", null],
    ["abcd!@#$", null],
    ["1234!@#$", null],
    ["abcdefgh", "policy"],
    ["abc123", "policy"],
    ["a1".repeat(33), "policy"],
    ["abcd1234%", "symbol"],
    ["비밀번호1234", "symbol"],
  ])("%s → %s", (password, expected) => {
    expect(findPasswordIssue(password)).toBe(expected)
  })
})

describe("phone", () => {
  it("숫자만 남기고 11자리에서 자른다", () => {
    expect(toPhoneDigits("010-1234-56789")).toBe("01012345678")
  })

  it.each([
    ["010", "010"],
    ["0101234", "010-1234"],
    ["01012345", "010-1234-5"],
    ["01012345678", "010-1234-5678"],
    ["0111234567", "011-123-4567"],
  ])("%s → %s", (digits, expected) => {
    expect(formatPhone(digits)).toBe(expected)
  })

  it.each([
    ["01012345678", true],
    ["0111234567", true],
    ["0101234567", true],
    ["0201234567", false],
    ["0101234", false],
  ])("%s 유효 여부 %s", (digits, expected) => {
    expect(isValidPhone(digits)).toBe(expected)
  })
})
