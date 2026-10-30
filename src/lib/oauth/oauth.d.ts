interface GoogleTokenResponse {
  access_token?: string
  error?: string
  error_description?: string
}

interface GoogleTokenClient {
  requestAccessToken: (overridable?: { prompt?: string }) => void
}

interface AppleIDAuthorizationResponse {
  authorization: {
    code: string
    id_token: string
  }
}

interface Window {
  google?: {
    accounts: {
      oauth2: {
        initTokenClient: (config: {
          client_id: string
          scope: string
          callback: (response: GoogleTokenResponse) => void
          error_callback?: (error: { type: string; message?: string }) => void
        }) => GoogleTokenClient
      }
    }
  }
  Kakao?: {
    Auth: {
      authorize: (options: { redirectUri: string; state?: string }) => void
    }
    init: (appKey: string) => void
    isInitialized: () => boolean
  }
  AppleID?: {
    auth: {
      init: (config: {
        clientId: string
        redirectURI: string
        scope: string
        usePopup?: boolean
      }) => void
      signIn: () => Promise<AppleIDAuthorizationResponse>
    }
  }
}
