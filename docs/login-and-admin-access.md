# 인증 앱 로그인 구현과 운영진(Admin) 접근 분기 안내

이 문서는 `umc-product-web-auth` 저장소에서 브라우저 기반 단일 로그인(Single Sign-On)이 어떻게 동작하는지, 그리고 운영진용 클라이언트(Backoffice, Operation)로 들어온 요청에 대해 운영진 권한이 없는 계정을 어떻게 걸러내는지 설명합니다. 백엔드 API 계약과 프론트엔드 코드를 함께 본 결과를 기준으로 작성했으며, 다른 팀원이 코드를 처음 열어봐도 흐름을 따라갈 수 있도록 문장 위주로 정리했습니다.

문서 뒤쪽에는 피드백용으로, **이번에 손댄 파일과 동작이 무엇인지**만 따로 모아 두었습니다.

---

## 1. 이 앱이 하는 일

이 저장소는 UMC 제품군의 **인증 허브 웹 애플리케이션**입니다. 사용자가 Operation(관리자 웹), 공식 웹사이트, 기술 블로그 같은 클라이언트 앱에서 “로그인”을 누르면, 브라우저가 이 인증 앱으로 이동한 뒤 여기서 신원을 확인합니다. 확인이 끝나면 인증 앱이 다시 API 서버의 OAuth 인가 주소로 이동하고, API 서버가 클라이언트 앱에 등록된 콜백 주소로 **인가 코드(authorization code)** 를 돌려줍니다. 인가 코드를 액세스 토큰으로 바꾸는 단계는 이 인증 앱이 아니라 **원래의 클라이언트 앱**이 담당합니다.

인증 방식은 OAuth 2.0 Authorization Code Flow에 Proof Key for Code Exchange(PKCE)를 더한 형태입니다. 인증 앱은 액세스 토큰을 장기 보관하지 않고, 브라우저에 남는 **SSO 로그인 쿠키**와 `sessionStorage`에 잠시 두는 OAuth 요청 파라미터를 중심으로 동작합니다.

---

## 2. 전체 로그인 흐름

### 2.1 클라이언트가 인증 앱으로 보내는 진입

클라이언트 앱은 사용자를 대략 다음 형태의 주소로 보냅니다.

`/authorize?client_id=...&redirect_uri=...&response_type=code&state=...&code_challenge=...&code_challenge_method=S256`

여기서 `client_id`는 서버에 등록된 OAuth 클라이언트 식별자입니다. 운영 서버 설정 기준으로는 예를 들어 `backoffice`(관리자 웹), `website`(공식 웹), `tech`(기술 블로그), 모바일 앱용 식별자 등이 있습니다. 로컬 개발용으로 서버 alpha 프로필에는 `local` 클라이언트가 추가로 있을 수 있습니다.

### 2.2 `/authorize` 페이지가 하는 일

`src/pages/authorize.tsx`는 쿼리 문자열이 있으면 필수 파라미터 여섯 개(`client_id`, `redirect_uri`, `response_type`, `state`, `code_challenge`, `code_challenge_method`)를 검증한 뒤 `sessionStorage` 키 `umc.auth.authorizeRequest`에 저장합니다. 이후 `GET /api/v1/auth/sso/me`로 SSO 쿠키 세션이 살아 있는지 확인합니다.

세션이 없으면(대개 HTTP 401) 로그인 허브인 `/`로 보냅니다. 세션이 있으면 API의 `GET /api/v1/auth/sso/oauth/authorize?...` 주소로 브라우저를 통째로 이동시킵니다. 이 이동은 SPA 라우터가 아니라 `window.location.replace`라서, `/authorize` 칸이 히스토리에 남지 않고 이후부터는 API 서버가 응답하는 리다이렉트를 따릅니다.

운영진 검사는 **게이트 토큰(`umc.auth.adminGateAccessToken`)이 있을 때만** 이 단계에서 수행합니다. 토큰이 없으면(다른 서비스에서 이미 SSO 로그인한 경우) `/login`으로 보내지 않고 SSO 세션을 유지한 채 인가를 이어 가며, 운영진 판별은 클라이언트 앱(operations `/_admin` 가드)이 맡습니다. 따라서 `/authorize`의 검사는 모든 SSO 세션의 최종 안전망이 아닙니다. 자세한 분기는 4.5절을 보면 됩니다.

### 2.3 로그인 허브와 이메일 로그인

`/`(`src/pages/index.tsx`)는 Apple, Google, Kakao 버튼과 “UMC 계정 로그인” 진입을 제공합니다. “UMC 계정 로그인”은 `/login`으로 이동합니다.

`/login`(`src/pages/login.tsx`)에서는 이메일과 비밀번호로 `POST /api/v1/auth/sso/email`을 호출합니다. 성공하면 서버가 SSO 로그인 쿠키를 심고, 인증 앱은 저장해 둔 authorize 요청이 있으면 `/authorize`로, 없으면 `/`로 이동합니다. 아이디나 비밀번호가 틀리면 서버가 401 또는 인증 오류 코드를 주고, 화면에는 입력 아래 `GuidanceMessage`로 “아이디 또는 비밀번호가 올바르지 않아요”를 보여 줍니다. 이 메시지는 **자격 증명 실패**용이며, 운영진 권한 없음과는 구분합니다.

### 2.4 소셜 로그인

Google과 Apple은 팝업으로 공급자 토큰(또는 Apple 인가 코드)을 받은 뒤, 각각 `POST /api/v1/auth/sso/google`, `POST /api/v1/auth/sso/apple`로 SSO 세션을 만듭니다. Kakao는 인증 앱의 `/oauth/kakao/callback`으로 리다이렉트한 뒤, Kakao 토큰을 교환하고 `POST /api/v1/auth/sso/kakao`를 호출합니다. 공통 판정은 `src/lib/oauth/completeSsoSocialLogin.ts`에 있으며, 미가입이면 `oAuthVerificationToken`을 `sessionStorage`에 저장하고 가입 유도 안내를 띄운 뒤 authorize로 보내지 않습니다. 가입된 계정이면 authorize 요청 유무에 따라 `/authorize` 또는 `/`로 갑니다.

### 2.5 로그아웃

`/logout`은 `POST /api/v1/auth/sso/logout`으로 쿠키를 지운 뒤, 허용된 `return_to` origin이면 그곳으로, 아니면 `/login`으로 보냅니다.

### 2.6 인증 앱이 호출하는 주요 API

| 용도 | 방법과 경로 |
|------|-------------|
| SSO 세션 확인 | `GET /api/v1/auth/sso/me` |
| 이메일 SSO 로그인 | `POST /api/v1/auth/sso/email` |
| Google / Kakao / Apple SSO 로그인 | `POST /api/v1/auth/sso/google` 등 |
| SSO 로그아웃 | `POST /api/v1/auth/sso/logout` |
| 인가 코드 발급(브라우저 이동) | `GET /api/v1/auth/sso/oauth/authorize` |
| 인가 코드 → 토큰(클라이언트 앱) | `POST /api/v1/auth/sso/oauth/token` |

모든 인증 앱 API 요청은 `credentials: "include"`로 쿠키를 포함합니다. SSO 로그인 응답 본문에는 보통 `memberId`와 `expiresAt` 정도만 있고, **운영진 역할 필드는 없습니다.**

---

## 3. 화면 브랜딩 분기(audience)

`client_id`만으로 로고와 레이아웃 톤을 나누기 위해 `src/lib/login-audience.ts`의 `resolveLoginAudience`를 씁니다. 결과는 `default`, `activity`, `admin` 중 하나입니다.

우선순위는 다음과 같습니다. 환경 변수 `VITE_LOGIN_UI_TEST`가 `activity` / `admin` / `default` 중 하나로 설정되어 있으면 **client_id보다 우선**하여 그 값을 강제합니다. 강제값이 없으면 `VITE_LOGIN_CLIENT_IDS_ACTIVITY`에 포함된 client_id는 `activity`, 운영진 client_id는 `admin`, 그 외는 `default`입니다.

운영진 client_id는 서버에 등록된 관리자 웹 client_id인 `backoffice`가 **코드에 고정**되어 있습니다(`BUILT_IN_ADMIN_CLIENT_IDS`). 배포 빌드에 `VITE_LOGIN_CLIENT_IDS_ADMIN`이 빠져도 운영진 검사가 꺼지지 않게 하려는 것입니다. 이 env는 운영진 client_id를 더 추가할 때만 씁니다.

중요한 점은, audience는 원래 **브랜드 UI**용이라는 것입니다. 운영진 권한 검사는 이 값이 `admin`일 때만 추가로 켜지도록 연결해 두었습니다. 즉 `admin` audience는 “로고가 운영진용이다”와 “인가 코드 발급 전에 운영진인지 한 번 더 본다”를 함께 타는 스위치가 됩니다.

---

## 4. 운영진(Admin) 접근 분기 처리 방식

### 4.1 왜 SSO 세션만으로는 부족한가

`GET /api/v1/auth/sso/me`는 로그인 여부만 알려 줍니다. OpenAPI 기준으로 운영진 여부는 `GET /api/v2/member/me`의 `isSuperAdmin`과 `currentGisuMemberInfo.isAdmin`으로 판단하는 것이 가장 명확합니다. 다만 `/api/v2/member/me`는 **Bearer 액세스 토큰**이 필요하고, SSO 쿠키만으로는 호출할 수 없습니다. 백엔드에 SSO me 응답을 확장하지 않기로 한 전제에서, 인증 앱은 **기존에 있는 일반 로그인 API로 액세스 토큰을 잠시 받은 뒤** 회원 정보를 조회하는 우회를 택했습니다.

허용 조건은 다음과 같습니다.

- `isSuperAdmin`이 참이거나
- 활성 기수 정보 `currentGisuMemberInfo.isAdmin`이 참이면 운영진으로 통과합니다.

활성 기수가 없거나(`currentGisuMemberInfo`가 null) 두 값이 모두 거짓이면 거부합니다.

### 4.2 조기 검사의 위치와 이유

인가 코드가 나가기 직전인 `/authorize`에서만 막으면, 이메일 로그인 직후 사용자가 잠깐 “로그인 확인 중” 같은 빈 화면에 머물렀다가 거절 UI를 보게 됩니다. 그래서 **admin audience일 때**는 로그인 성공 직후·`/authorize`로 보내기 **전에** 같은 판별을 한 번 수행합니다. 거절이면 Dialog를 그 자리에서 띄우고 authorize로 이동하지 않습니다. 조기 검사에서 저장한 게이트 토큰이 남아 있으면 `/authorize`에서도 같은 판별을 한 번 더 합니다. 게이트 토큰이 없으면 `/authorize`는 운영진을 막지 않고 인가를 이어 가므로, 모든 SSO 세션을 막는 최종 안전망은 아닙니다.

판별 공통 로직은 `src/lib/admin-access.ts`에 있습니다.

### 4.3 이메일 로그인에서의 분기

`/login`에서 admin audience이면 순서는 다음과 같습니다.

1. `POST /api/v1/auth/login/email`으로 일반 로그인을 해 액세스 토큰을 받습니다. 요청 body에 `clientType: "WEB"`을 넣습니다.
2. 그 토큰으로 `GET /api/v2/member/me`를 호출하고 `canAccessAdminOps`로 판별합니다.
3. 거부이면 SSO 쿠키를 정리하려고 `logout`을 시도한 뒤, “운영진 권한이 없어요” Dialog를 띄우고 **SSO 이메일 로그인을 하지 않습니다.**
4. 허용이면 액세스 토큰을 `sessionStorage`의 `umc.auth.adminGateAccessToken`에 잠시 저장한 뒤, 기존처럼 `POST /api/v1/auth/sso/email`으로 SSO 쿠키를 만들고 `/authorize`로 이동합니다.

admin audience가 아니면 예전과 같이 SSO 이메일 로그인만 수행합니다. 일반 로그인 API를 한 번 더 치지 않습니다.

### 4.4 소셜 로그인에서의 분기

Google과 Kakao는 공급자 액세스 토큰으로 `POST /api/v1/auth/login/google` 또는 `.../kakao`를 먼저 호출해 UMC 액세스 토큰을 얻은 뒤, 동일하게 `/api/v2/member/me`를 검사하고, 통과하면 SSO 소셜 로그인을 이어서 호출합니다. 구현 위치는 `src/lib/oauth/useSocialLogin.tsx`와 Kakao 콜백 `src/pages/oauth/kakao/callback.tsx`입니다.

Apple은 공급자 **인가 코드를 한 번만** 쓸 수 있어서, admin audience일 때는 권한이 있는지 확인하려고 Apple 로그인을 한 번 하고, 통과한 뒤에 SSO 쿠키를 만들려고 Apple 로그인을 **한 번 더** 합니다. admin이 아닌 audience에서는 Apple 팝업이 한 번만 뜹니다.

Kakao 콜백에서 거부된 경우에는 Dialog를 콜백 페이지에 바로 두기 어려워, `sessionStorage` 플래그 `umc.auth.adminAccessDenied`를 켠 뒤 `/login`으로 보내고, `/login`이 마운트될 때 플래그를 읽어 Dialog를 엽니다.

### 4.5 `/authorize` 최종 검사

admin audience이고 SSO 세션이 살아 있을 때, `/authorize`는 `umc.auth.adminGateAccessToken`을 읽습니다. 토큰이 없으면 다른 서비스에서 이미 SSO 로그인한 사람이므로, SSO 세션을 그대로 두고 인가 URL로 이동합니다. 이때 운영진 판별은 클라이언트 앱(operations `/_admin` 가드)이 토큰 교환 뒤에 합니다. 토큰이 있으면 `/api/v2/member/me`를 다시 확인하고, 거부이면 Dialog를 `/authorize` 위에 띄운 채 인가 URL로 이동하지 않습니다. 통과하면 토큰을 지우고 API authorize로 이동합니다.

### 4.6 거절 UI

`src/pages/-components/AdminAccessDeniedDialog.tsx`는 Figma의 Web Dialog(제목 “운영진 권한이 없어요”, 본문 “UMC Operation은 운영진으로 등록된 계정만 이용할 수 있어요.”)를 맞춥니다. 디자인 시스템 `Dialog` 컴포넌트는 취소 버튼 없이 확인만 두면 텍스트 버튼으로 그려져 Figma의 Fill 버튼과 달라, 같은 Dialog 토큰 클래스와 `Button`의 fill brand 조합으로 조립했습니다. 너비는 Figma 기준 **446px**로 고정합니다.

환경 변수 `VITE_UMC_HOME_URL`이 있으면 버튼 문구는 “UMC 홈으로”이고 해당 주소로 이동합니다. 없으면 문구는 “확인”이고 Dialog만 닫습니다. 자격 증명 오류용 `GuidanceMessage`와는 절대 섞지 않습니다.

---

## 5. 환경 변수와 로컬 검증

`backoffice`는 코드에 고정되어 있어 env가 없어도 운영진 검사를 탑니다. `VITE_LOGIN_CLIENT_IDS_ADMIN`은 운영진 client_id를 더 추가할 때만 씁니다. 로컬 client_id `local`은 모든 서비스가 함께 쓰므로 이 목록에 넣으면 안 됩니다. 그래서 로컬에서는 기본적으로 인증 앱의 운영진 검사가 돌지 않습니다. Activity 브랜딩은 `VITE_LOGIN_CLIENT_IDS_ACTIVITY`입니다. 로컬에서 게이트나 UI를 확인하려면 `VITE_LOGIN_UI_TEST=admin`처럼 강제할 수 있으나, **배포 전에는 비워야** 합니다. 켜 둔 채 배포하면 멤버·Activity를 포함한 모든 진입이 admin 검사·로고를 탑니다.

`VITE_UMC_HOME_URL`은 거절 Dialog의 홈 이동용입니다. API 주소는 `VITE_API_BASE_URL` 등 기존 인증 환경 설정을 따릅니다.

---

## 6. 수정·개선이 필요하다고 보는 점

### 6.1 백엔드에 SSO 세션 조회 응답을 확장하는 것이 가장 깔끔하다

지금 구조는 운영진 검사 때문에 **일반 로그인 API와 SSO 로그인을 연달아** 호출합니다. 이메일·Google·Kakao는 자격 증명을 두 번 검증하는 셈이고, Apple은 팝업이 두 번 필요합니다. `GET /api/v1/auth/sso/me` 응답에 `isSuperAdmin`과 `isAdmin`(또는 동등한 필드)만 실어 주면, 액세스 토큰을 `sessionStorage`에 잠시 둘 필요도 없고, 로그인 API 이중 호출도 사라집니다. 서버의 OAuth authorize 단계에서 backoffice 클라이언트에 대해 동일 검증을 하면, 인증 앱을 우회하려는 시도에도 더 단단해집니다.

### 6.2 프론트엔드 운영진 검사는 편의 장치이지 유일한 보안 경계가 아니다

인가 코드 발급은 여전히 서버가 수행하며, 현재 서버 authorize 구현은 로그인만 되면 코드를 줄 수 있습니다. 프론트 분기는 사용자 경험과 불필요한 코드 발급을 줄이는 목적에 가깝습니다. 장기적으로는 서버 authorize 또는 토큰 교환 직후에 운영진 검증을 두는 편이 맞습니다.

### 6.3 `/authorize`에서 게이트 토큰이 없을 때 판별을 클라이언트에 맡기는 점

이미 SSO 쿠키만 있는 상태로 `/authorize`에 들어오면, 인증 앱은 액세스 토큰이 없어 운영진 여부를 알 수 없습니다. 예전에는 SSO를 끊고 `/login`으로 보냈지만, 그러면 운영진도 다시 로그인해야 하고 멤버 사이트의 SSO 세션까지 끊겼습니다. 지금은 code를 발급하고, operations가 토큰 교환 뒤 운영진이 아니면 자기 토큰만 지우고 안내 화면을 보여 줍니다. 그래서 이 경로의 비운영진에게도 operations용 토큰이 잠깐 발급됩니다. 실제 데이터 접근은 백엔드 권한 검사가 막으므로, 서버 authorize에서 운영진 검증을 하게 되면 이 분기는 필요 없어집니다.

### 6.4 `sessionStorage`에 액세스 토큰을 잠시 두는 위험

조기 검사에 쓴 Bearer 토큰을 authorize 직전까지 `umc.auth.adminGateAccessToken`에 둡니다. 탭 안에서만 쓰고 통과·거부 시 지우려 하지만, XSS가 있다면 노출 표면이 됩니다. SSO me 확장으로 대체하는 것이 바람직합니다.

### 6.5 Apple 이중 로그인 사용자 경험

admin audience에서만 Apple을 두 번 띄우는 것은 공급자 제약 때문입니다. 사용자에게 “한 번 더 확인해 주세요” 정도의 안내가 없으면 버그처럼 느껴질 수 있습니다. 서버 me 확장 또는 Apple 쪽에서 SSO와 일반 로그인을 한 자격으로 잇는 API가 생기면 해소됩니다.

### 6.6 audience 환경 변수와 서버 등록 client_id의 불일치

운영진 client_id `backoffice`는 코드에 고정해, env 누락으로 권한 검사가 조용히 꺼지는 일은 막았습니다. 서버 `app.sso.clients`에서 관리자 웹 client_id가 바뀌면 `src/lib/login-audience.ts`의 `BUILT_IN_ADMIN_CLIENT_IDS`도 함께 바꿔야 합니다. Activity 브랜딩은 여전히 env(`VITE_LOGIN_CLIENT_IDS_ACTIVITY`)에 의존하므로, 빠지면 로고만 기본값으로 보입니다.

### 6.7 `VITE_LOGIN_UI_TEST` 배포 실수

로컬 강제값이 빌드에 남으면 운영에서도 admin UI와 검사가 켜질 수 있습니다. 배포 파이프라인에서 이 변수가 비어 있는지 확인하는 것이 안전합니다.

### 6.8 거절 후에도 SSO 정리 실패 가능성

거절 시 `logoutSso`를 시도하지만 네트워크 오류면 쿠키가 남을 수 있습니다. Dialog를 닫은 뒤 허브가 “로그인되어 있습니다”로 보일 수 있으므로, 실패 시 재시도나 상태 문구를 보강할 여지가 있습니다.

### 6.9 Dialog를 디자인 시스템 `Dialog`와 다르게 조립한 이유와 유지 비용

Fill 단일 버튼을 맞추려고 `Dialog` 대신 토큰 클래스와 `Button`을 직접 조합했습니다. 디자인 시스템이 나중에 “확인만 있어도 Fill”을 지원하면 다시 `Dialog`로 되돌리는 편이 유지보수에 유리합니다. 너비 446px도 Figma 노드에 맞춘 오버라이드라, 디자인 시스템 기본 430px와 문서에 차이를 적어 두는 것이 좋습니다.

### 6.10 회원가입·계정 찾기와 authorize의 연결

가입 완료 후 authorize로 이어지는 경로는 아직 완전하지 않을 수 있습니다. 운영진 게이트와는 별개이나, SSO 허브 완성도와 함께 점검할 항목입니다.

### 6.11 “로그인 유지” 체크박스

`/login`의 “로그인 유지”는 UI만 있고 API나 쿠키 수명에 연결되어 있지 않습니다. 동작하지 않는 컨트롤이면 제거하거나 서버 계약과 연결해야 합니다.

---

## 7. 관련 파일 목록

| 역할 | 경로 |
|------|------|
| 로그인 허브 | `src/pages/index.tsx` |
| 이메일 로그인과 조기 검사 | `src/pages/login.tsx` |
| 인가 진입과 최종 검사 | `src/pages/authorize.tsx` |
| Kakao 콜백과 조기 검사 | `src/pages/oauth/kakao/callback.tsx` |
| 소셜 로그인과 조기 검사 | `src/lib/oauth/useSocialLogin.tsx` |
| 소셜 성공·미가입 판정 | `src/lib/oauth/completeSsoSocialLogin.ts` |
| audience 해석 | `src/lib/login-audience.ts` |
| 운영진 판별과 게이트 토큰 | `src/lib/admin-access.ts` |
| 일반 로그인 API 클라이언트 | `src/api/credential-auth.ts` |
| 회원 종합 정보 | `src/api/member.ts` |
| SSO API 클라이언트 | `src/api/sso.ts` |
| authorize 요청 저장 | `src/lib/authorize-request.ts` |
| 권한 없음 Dialog | `src/pages/-components/AdminAccessDeniedDialog.tsx` |

---

## 8. 한 줄로 요약하면

인증 앱은 SSO 쿠키로 로그인한 뒤 `/authorize`에서 API에 인가 코드를 요청하는 허브이고, **관리자 웹(`backoffice` 등 admin audience)으로 들어온 경우에만** 일반 로그인으로 액세스 토큰을 받아 `/api/v2/member/me`의 운영진 여부를 본 다음, 자격이 있을 때만 SSO를 이어 인가 코드 발급으로 보냅니다. 자격이 없으면 로그인 화면에 Dialog로 막고 코드는 발급하지 않습니다. 이 이중 로그인 구조는 백엔드 변경 없이 기존 API만으로 구현한 타협안이며, 장기적으로는 SSO 세션 조회에 역할 정보를 실어 단순화하는 것이 바람직합니다.

---

## 9. 이번에 수정·추가한 부분 (피드백용)

위 1절부터 8절은 **현재 동작 전체**를 설명합니다. 이 절만 보면 “원래 있던 것”과 “이번 작업에서 손댄 것”을 구분하기 쉽습니다. 백엔드 API 추가는 하지 않았고, 이미 있는 일반 로그인·회원 조회 API를 조합했습니다.

### 9.1 동작으로 본 변경 요약

운영진용 audience(`admin`, 환경 변수상 보통 `backoffice`)로 들어온 로그인에 대해, SSO만으로 바로 인가 코드를 넘기지 않고 **운영진 여부를 먼저 확인**하도록 바꿨습니다. 확인에 쓰는 값은 `GET /api/v2/member/me`의 `isSuperAdmin`과 `currentGisuMemberInfo.isAdmin`입니다. 액세스 토큰이 필요해서, 같은 자격으로 `POST /api/v1/auth/login/email`(또는 소셜 일반 로그인)을 한 번 더 친 뒤 통과할 때만 기존 `POST /api/v1/auth/sso/...`를 이어 갑니다.

거절 시에는 `/authorize`로 보내지 않고, Figma에 맞춘 “운영진 권한이 없어요” Dialog를 띄웁니다. 이메일뿐 아니라 Google·Apple·Kakao에도 같은 판별을 넣었고, `/authorize`에는 게이트 토큰이 있을 때만 같은 검사를 다시 합니다.

로그인·인가 과정의 **중간 화면이 브라우저 히스토리에 쌓여**, 클라이언트(예: `localhost:5173`)로 돌아간 뒤 뒤로가기를 누르면 `/login`이나 `/authorize`에 다시 떨어지는 문제를 줄이기 위해, 인증 앱 안의 이동과 API로 넘기는 구간에 **replace**를 적용했습니다. 자세한 배경과 한계는 아래 9.6절을 보면 됩니다.

### 9.2 새로 만든 파일

| 파일 | 무엇을 위해 추가했는지 |
|------|------------------------|
| `src/lib/admin-access.ts` | 운영진 판별, 게이트용 액세스 토큰·거절 플래그 저장 |
| `src/lib/admin-access.test.ts` | 위 판별 단위 테스트 |
| `src/api/credential-auth.ts` | 일반 로그인(` /api/v1/auth/login/... `) 호출 |
| `src/api/member.ts` | `GET /api/v2/member/me` 호출 |
| `src/pages/-components/AdminAccessDeniedDialog.tsx` | 권한 없음 Dialog (Fill 버튼, 너비 446px) |

### 9.3 기존 파일에서 손본 내용

| 파일 | 무엇을 바꿨는지 |
|------|-----------------|
| `src/pages/login.tsx` | admin일 때 일반 로그인 → me 조기 검사 → 통과 시만 SSO. Dialog 연결. Kakao 거절 플래그 소비. 성공 이동 `replace: true` |
| `src/pages/authorize.tsx` | SSO me 이후 admin이고 게이트 토큰이 있으면 me 재검사, 실패 시 Dialog. 게이트 토큰이 없으면 판별을 클라이언트 앱에 맡기고 그대로 authorize. 허브·로그인으로 보낼 때 `replace`. API authorize로 넘길 때 `location.replace` |
| `src/pages/index.tsx` | 소셜 로그인 거절 시 Dialog가 보이도록 연결. “UMC 계정 로그인” 이동 `replace: true` |
| `src/lib/oauth/useSocialLogin.tsx` | Google·Apple admin 조기 검사. Apple은 admin일 때 팝업 두 번 |
| `src/lib/oauth/completeSsoSocialLogin.ts` | 소셜 성공 후 이동 옵션에 `replace: true` |
| `src/pages/oauth/kakao/callback.tsx` | Kakao admin 조기 검사. 거절 시 플래그 후 `/login`(replace) |
| `src/pages/logout.tsx` | 로그아웃 후 `/login` 이동 `replace: true` |
| `.env` / `.env.example` | `VITE_LOGIN_CLIENT_IDS_ADMIN`(추가 admin client용, 기본 `backoffice`는 코드 고정), `VITE_UMC_HOME_URL` 선택 항목 |
| `src/vite-env.d.ts` | `VITE_UMC_HOME_URL` 타입 선언 |

`src/lib/login-audience.ts`의 audience 해석 자체는 유지했고, **admin일 때 권한 검사를 켜는 쪽**에만 연결했습니다. SSO API 클라이언트(`src/api/sso.ts`)의 엔드포인트 목록은 그대로입니다.

### 9.4 환경 변수 관련 변경

`backoffice`는 `BUILT_IN_ADMIN_CLIENT_IDS`에 코드로 고정되어 있고, `VITE_LOGIN_CLIENT_IDS_ADMIN`은 그 밖의 admin client_id를 더할 때만 씁니다. `VITE_UMC_HOME_URL`이 있으면 Dialog 버튼이 “UMC 홈으로”로 해당 주소에 이동하고, 없으면 “확인”으로 Dialog만 닫습니다. `VITE_LOGIN_UI_TEST`는 원래 로고용 강제값인데, 지금은 admin 강제 시 권한 검사도 함께 탑니다. 배포 빌드에는 비워 두어야 합니다.

### 9.5 이번에 하지 않은 것

서버 `GET /api/v1/auth/sso/me`에 역할 필드를 추가하거나, 서버 OAuth authorize에서 운영진을 검증하는 작업은 하지 않았습니다. 회원가입·“로그인 유지” 체크박스 연결도 이번 범위 밖입니다. 클라이언트 앱이 인증 앱 `/authorize`를 **처음 열 때** `location.replace`를 쓰는 것은 operations 등 **클라이언트 저장소** 쪽 변경이라 이 인증 앱만으로는 다루지 않았습니다.

### 9.6 브라우저 히스토리와 replace

#### 왜 손댔는지

전형적인 경로는 클라이언트(예: `http://localhost:5173`) → 인증 앱 `/authorize` → `/` 또는 `/login` → 다시 `/authorize` → API authorize → 클라이언트 콜백입니다. 기본 이동은 히스토리에 **새 칸을 쌓는(push)** 방식이라, 클라이언트에 도착한 뒤 뒤로가기를 누르면 `/login`이나 `/authorize` 같은 **중간 화면**이 다시 보입니다. 이미 로그인이 끝난 사용자에게는 “왜 또 로그인 화면이지?”로 느껴집니다.

현업에서도 뒤로가기 버튼 자체를 막지는 않습니다. 대신 중간 단계를 히스토리에 남기지 않거나(`replace`), 걸려도 세션이 있으면 다시 앞으로 보내는 식으로 **우회**합니다. 이번 작업에서는 그중 replace를 인증 앱에 적용했습니다.

#### push와 replace의 차이

- **push** (`navigate({ to })`, `window.location.assign`): 지금 주소 위에 새 칸을 추가합니다. 뒤로가면 이전 주소로 돌아갑니다.
- **replace** (`navigate({ to, replace: true })`, `window.location.replace`): **지금 칸만 새 주소로 덮습니다.** 덮인 주소는 스택에서 빠지므로, 뒤로가기 때 그 중간 화면이 다시 안 나옵니다.

#### 인증 앱에서 적용한 곳

인증 앱 **origin 안** SPA 이동은 TanStack Router의 `replace: true`를 씁니다.

- `/login`에서 SSO 성공 후 `/authorize` 또는 `/`로 갈 때
- 소셜 로그인 성공 후 `/authorize` 또는 `/`로 갈 때 (`socialSuccessNavigateOptions`)
- 로그인 허브에서 “UMC 계정 로그인”으로 `/login`에 갈 때
- `/authorize`에서 미로그인이라 `/`로 보낼 때
- Kakao 콜백에서 `/login`으로 되돌릴 때
- 로그아웃 후 `/login`으로 갈 때

인증 앱 `/authorize`에서 **API** `.../sso/oauth/authorize`로 브라우저를 넘길 때는 SPA가 아니라 전체 페이지 이동입니다. 여기까지 `assign`으로 두면 `/authorize` 칸이 스택에 남은 채 API·클라이언트가 그 위에 쌓여, 클라이언트에서 뒤로가기 시 `http://localhost:5174/authorize`가 다시 보입니다. 그래서 이 구간은 `window.location.replace`로 바꿨습니다. SPA의 `navigate({ replace: true })`만으로는 **다른 origin(API)으로 나가는 이동**을 덮을 수 없습니다.

#### replace만으로 안 끝나는 부분

클라이언트가 처음 인증 앱을 열 때 만드는 `/authorize` 진입 칸은, 그 이동을 시작한 쪽이 클라이언트입니다. 인증 앱이 나중에 SPA replace를 해도 “5173에서 5174로 넘어오며 생긴 첫 칸”의 성격까지 전부 지우지는 못할 수 있습니다. 클라이언트에서 IdP로 보낼 때 `location.replace`를 쓰는 것은 클라이언트 앱 설정 이슈입니다.

admin audience로 `/authorize`에 다시 들어왔을 때 게이트용 액세스 토큰이 없으면 `/login`으로 보내지 않고, SSO 세션을 유지한 채 API authorize로 이어 갑니다. 운영진 판별은 클라이언트 앱이 담당합니다. replace는 중간 칸을 줄이는 장치이고, “세션이 있으면 인증 화면에 머물지 않고 다시 인가를 이어 간다”는 처리는 이미 이 경로에 반영되어 있습니다.
