import { beforeEach, describe, expect, it } from "vitest"

import { resolveSsoSocialLogin } from "./completeSsoSocialLogin"

describe("resolveSsoSocialLogin", () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it("기존 회원이면 홈으로 보낸다", () => {
    expect(
      resolveSsoSocialLogin({
        code: "LOGIN_SUCCESS",
        memberId: 1,
        expiresAt: "2099-01-01T00:00:00Z",
      }),
    ).toEqual({ kind: "success", next: "/" })
  })

  it("authorize 요청이 있으면 authorize 로 보낸다", () => {
    sessionStorage.setItem(
      "umc.auth.authorizeRequest",
      JSON.stringify({
        client_id: "local",
        code_challenge: "challenge",
        code_challenge_method: "S256",
        redirect_uri: "http://localhost:5173/callback",
        response_type: "code",
        state: "state",
      }),
    )

    expect(
      resolveSsoSocialLogin({
        memberId: 1,
        expiresAt: "2099-01-01T00:00:00Z",
      }),
    ).toEqual({ kind: "success", next: "/authorize" })
  })

  it("가입이 필요하면 register_required 를 반환한다", () => {
    expect(
      resolveSsoSocialLogin({
        code: "REGISTER_REQUIRED",
        oAuthVerificationToken: "token",
      }),
    ).toEqual({ kind: "register_required" })
    expect(sessionStorage.getItem("umc.auth.oAuthVerificationToken")).toBe(
      "token",
    )
  })
})
