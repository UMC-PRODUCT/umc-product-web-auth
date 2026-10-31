import { afterEach, describe, expect, it, vi } from "vitest"

import { ApiError } from "@/api/http"

vi.mock("@/api/sso", () => ({
  logoutSso: vi.fn(),
}))

import { logoutSso } from "@/api/sso"

import {
  canAccessAdminOps,
  clearAdminGateAccessToken,
  clearAdminReloginRequired,
  isAdminGateBoundToSsoMember,
  isAdminReloginRequired,
  isOAuthRegisterRequired,
  logoutSsoAndClearAdminGate,
  readAdminGateAccessToken,
  saveAdminGateAccessToken,
  shouldCheckAdminAccess,
} from "./admin-access"

describe("canAccessAdminOps", () => {
  it("allows SUPER_ADMIN", () => {
    expect(canAccessAdminOps({ isSuperAdmin: true })).toBe(true)
  })

  it("allows active-gisu admin", () => {
    expect(
      canAccessAdminOps({
        isSuperAdmin: false,
        currentGisuMemberInfo: { isAdmin: true },
      }),
    ).toBe(true)
  })

  it("denies members without admin role", () => {
    expect(
      canAccessAdminOps({
        isSuperAdmin: false,
        currentGisuMemberInfo: { isAdmin: false },
      }),
    ).toBe(false)
    expect(
      canAccessAdminOps({
        isSuperAdmin: false,
        currentGisuMemberInfo: null,
      }),
    ).toBe(false)
    expect(canAccessAdminOps({})).toBe(false)
  })
})

describe("shouldCheckAdminAccess", () => {
  it("checks only admin audience client ids", () => {
    const env = {
      adminClientIds: "backoffice",
      activityClientIds: "",
    }
    expect(shouldCheckAdminAccess("backoffice", env)).toBe(true)
    expect(shouldCheckAdminAccess("website", env)).toBe(false)
  })

  it("checks backoffice even when the admin env is missing", () => {
    expect(shouldCheckAdminAccess("backoffice", {})).toBe(true)
    expect(shouldCheckAdminAccess("local", {})).toBe(false)
  })
})

describe("isOAuthRegisterRequired", () => {
  it("detects register-required social login", () => {
    expect(
      isOAuthRegisterRequired({
        code: "REGISTER_REQUIRED",
        oAuthVerificationToken: "token",
      }),
    ).toBe(true)
    expect(
      isOAuthRegisterRequired({
        accessToken: "at",
        success: true,
      }),
    ).toBe(false)
  })
})

describe("admin gate member binding", () => {
  afterEach(() => {
    clearAdminGateAccessToken()
    clearAdminReloginRequired()
    vi.mocked(logoutSso).mockReset()
  })

  it("stores access token with member id", () => {
    saveAdminGateAccessToken("token", 42)
    expect(readAdminGateAccessToken()).toEqual({
      kind: "ok",
      accessToken: "token",
      memberId: 42,
    })
  })

  it("treats legacy token-only values as invalid", () => {
    sessionStorage.setItem("umc.auth.adminGateAccessToken", "legacy-token")
    expect(readAdminGateAccessToken()).toEqual({ kind: "invalid" })
  })

  it("matches only the same sso member id", () => {
    expect(isAdminGateBoundToSsoMember(42, 42)).toBe(true)
    expect(isAdminGateBoundToSsoMember(42, 7)).toBe(false)
    expect(isAdminGateBoundToSsoMember(42, undefined)).toBe(false)
  })

  it("clears gate only after logout succeeds", async () => {
    saveAdminGateAccessToken("token", 42)
    vi.mocked(logoutSso).mockResolvedValueOnce({})

    await expect(logoutSsoAndClearAdminGate()).resolves.toEqual({ ok: true })
    expect(readAdminGateAccessToken()).toEqual({ kind: "none" })
    expect(isAdminReloginRequired()).toBe(false)
  })

  it("keeps gate and relogin flag when logout fails", async () => {
    saveAdminGateAccessToken("token", 42)
    vi.mocked(logoutSso).mockRejectedValueOnce(
      new ApiError("logout failed", 500),
    )

    await expect(logoutSsoAndClearAdminGate()).resolves.toEqual({ ok: false })
    expect(readAdminGateAccessToken()).toEqual({
      kind: "ok",
      accessToken: "token",
      memberId: 42,
    })
    expect(isAdminReloginRequired()).toBe(true)
  })
})
