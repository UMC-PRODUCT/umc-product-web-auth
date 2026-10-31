import { describe, expect, it } from "vitest"

import {
  canAccessAdminOps,
  isOAuthRegisterRequired,
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
