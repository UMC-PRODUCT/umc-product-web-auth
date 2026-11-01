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
  // 로그인·콜백 등 중간 화면이 히스토리에 남지 않도록 replace
  return { to: next, replace: true } as const
}

export async function completeKakaoSsoLogin(params: {
  idToken: string
  accessToken?: string
}) {
  const result = await loginBySsoKakao({
    idToken: params.idToken,
    accessToken: params.accessToken,
  })
  return resolveSsoSocialLogin(result)
}
