import {
  loginBySsoKakao,
  type SsoSocialLogin,
  saveOAuthVerificationToken,
} from "@/api/sso"
import { readAuthorizeRequest } from "@/lib/authorize-request"

export type SocialLoginOutcome =
  | { kind: "success"; next: "/authorize" | "/" }
  | { kind: "register_required" }

export function resolveSsoSocialLogin(
  result: SsoSocialLogin,
): SocialLoginOutcome {
  const needsRegister =
    Boolean(result.oAuthVerificationToken) &&
    (result.code === "REGISTER_REQUIRED" || result.memberId == null)

  if (needsRegister) {
    if (result.oAuthVerificationToken) {
      saveOAuthVerificationToken(result.oAuthVerificationToken)
    }
    return { kind: "register_required" }
  }

  return {
    kind: "success",
    next: readAuthorizeRequest() ? "/authorize" : "/",
  }
}

export function socialSuccessNavigateOptions(next: "/authorize" | "/") {
  return { to: next } as const
}

export async function completeKakaoSsoLogin(params: {
  accessToken: string
  idToken?: string
}) {
  const result = await loginBySsoKakao({
    accessToken: params.accessToken,
    idToken: params.idToken,
  })
  return resolveSsoSocialLogin(result)
}
