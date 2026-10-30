import { describe, expect, it } from "vitest"

import { resolveLoginAudience } from "./login-audience"

const env = {
  activityClientIds: "activity, activity-local",
  adminClientIds: "admin, admin-local",
}

describe("resolveLoginAudience", () => {
  it("returns default when client_id is missing", () => {
    expect(resolveLoginAudience(null, env)).toBe("default")
    expect(resolveLoginAudience(undefined, env)).toBe("default")
    expect(resolveLoginAudience("", env)).toBe("default")
  })

  it("maps activity client ids", () => {
    expect(resolveLoginAudience("activity", env)).toBe("activity")
    expect(resolveLoginAudience("activity-local", env)).toBe("activity")
  })

  it("maps admin client ids", () => {
    expect(resolveLoginAudience("admin", env)).toBe("admin")
    expect(resolveLoginAudience("admin-local", env)).toBe("admin")
  })

  it("returns default for unknown client ids", () => {
    expect(resolveLoginAudience("web", env)).toBe("default")
  })

  it("trims and ignores empty env entries", () => {
    expect(
      resolveLoginAudience("activity", {
        activityClientIds: " , activity , ",
        adminClientIds: "",
      }),
    ).toBe("activity")
  })

  it("forces audience from uiTest over client_id", () => {
    expect(
      resolveLoginAudience("admin-local", { ...env, uiTest: "activity" }),
    ).toBe("activity")
    expect(resolveLoginAudience(null, { ...env, uiTest: "admin" })).toBe(
      "admin",
    )
    expect(
      resolveLoginAudience("activity", { ...env, uiTest: "default" }),
    ).toBe("default")
  })

  it("ignores invalid uiTest values", () => {
    expect(resolveLoginAudience("admin", { ...env, uiTest: "nope" })).toBe(
      "admin",
    )
    expect(resolveLoginAudience(null, { ...env, uiTest: "  " })).toBe("default")
  })
})
