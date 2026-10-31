import { apiRequest } from "./http"

export type CurrentGisuMemberInfo = {
  gisuId?: number
  generation?: number
  isAdmin?: boolean
  roleTypes?: string[]
}

export type MemberSummaryV2 = {
  id?: number
  isSuperAdmin?: boolean
  currentGisuMemberInfo?: CurrentGisuMemberInfo | null
}

export function fetchMemberMeV2(accessToken: string) {
  return apiRequest<MemberSummaryV2>("/api/v2/member/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method: "GET",
  })
}
