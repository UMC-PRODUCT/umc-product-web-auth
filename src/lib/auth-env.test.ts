import { describe, expect, it } from "vitest"

import { isAllowedReturnTo, resolveAuthEnv } from "./auth-env"

describe("resolveAuthEnv", () => {
  it("uses the local admin origin and an empty api base on localhost", () => {
    expect(resolveAuthEnv("http://localhost:5174")).toEqual({
      allowedReturnOrigins: ["http://localhost:5173"],
      apiBaseUrl: "",
    })
  })

  it("uses the confirmed production origins", () => {
    expect(resolveAuthEnv("https://auth.university.neordinary.com")).toEqual({
      allowedReturnOrigins: [
        "https://admin.university.neordinary.com",
        "https://university.neordinary.com",
      ],
      apiBaseUrl: "https://api.university.neordinary.com",
    })
  })

  it("rejects an unknown origin when the dev env is missing", () => {
    expect(() => resolveAuthEnv("https://auth-dev.example")).toThrow(/TODO/)
  })
})

describe("isAllowedReturnTo", () => {
  const allowed = ["http://localhost:5173"]

  it("accepts a return url whose origin is on the list", () => {
    expect(isAllowedReturnTo("http://localhost:5173/notices", allowed)).toBe(
      true,
    )
  })

  it("rejects a return url from another origin", () => {
    expect(isAllowedReturnTo("https://evil.example/login", allowed)).toBe(false)
    expect(isAllowedReturnTo("not a url", allowed)).toBe(false)
  })
})
