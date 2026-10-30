import { afterEach, describe, expect, it } from "vitest"

import {
  authorizeUrl,
  readAuthorizeRequest,
  saveAuthorizeRequest,
} from "./authorize-request"

const PARAMS = {
  client_id: "local",
  code_challenge: "challenge",
  code_challenge_method: "S256",
  redirect_uri: "http://localhost:5173/auth/callback",
  response_type: "code",
  state: "state-1",
}

afterEach(() => {
  sessionStorage.clear()
})

describe("authorize request storage", () => {
  it("keeps the six authorize params without changing redirect_uri", () => {
    const search = new URLSearchParams(PARAMS)

    expect(saveAuthorizeRequest(search)).toBe(true)
    expect(readAuthorizeRequest()).toEqual(PARAMS)
    expect(readAuthorizeRequest()?.redirect_uri).toBe(PARAMS.redirect_uri)
  })

  it("does not store a partial query", () => {
    const search = new URLSearchParams({ client_id: "local" })

    expect(saveAuthorizeRequest(search)).toBe(false)
    expect(readAuthorizeRequest()).toBeNull()
  })

  it("builds an authorize url on the api host", () => {
    const url = new URL(
      authorizeUrl("https://api.university.neordinary.com", PARAMS),
    )

    expect(url.origin).toBe("https://api.university.neordinary.com")
    expect(url.pathname).toBe("/api/v1/auth/sso/oauth/authorize")
    expect(url.searchParams.get("redirect_uri")).toBe(PARAMS.redirect_uri)
    expect(url.searchParams.get("code_challenge_method")).toBe("S256")
  })
})
