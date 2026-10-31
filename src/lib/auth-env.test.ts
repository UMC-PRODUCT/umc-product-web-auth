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
        "https://university.neordinary.com",
        "https://activity.university.neordinary.com",
        "https://admin.university.neordinary.com",
      ],
      apiBaseUrl: "https://api.university.neordinary.com",
    })
  })

  it("uses the dev service origins and dev api on the dev auth app", () => {
    expect(
      resolveAuthEnv("https://dev.auth.university.neordinary.com"),
    ).toEqual({
      allowedReturnOrigins: [
        "https://dev.university.neordinary.com",
        "https://dev.activity.university.neordinary.com",
        "https://dev.admin.university.neordinary.com",
      ],
      apiBaseUrl: "https://api-dev.university.neordinary.com",
    })
  })

  it("reads env for an origin outside the table", () => {
    expect(
      resolveAuthEnv("https://preview.example", {
        allowedReturnOrigins: "https://a.example, https://b.example",
        apiBaseUrl: "https://api.example",
      }),
    ).toEqual({
      allowedReturnOrigins: ["https://a.example", "https://b.example"],
      apiBaseUrl: "https://api.example",
    })
  })

  it("rejects an origin outside the table when env is missing", () => {
    expect(() => resolveAuthEnv("https://preview.example")).toThrow(
      /VITE_ALLOWED_RETURN_ORIGINS/,
    )
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
