import { http, HttpResponse } from 'msw'

const OAUTH_URL = 'https://stg-apigw-kr.hmg-corp.io/oauth/token'
const HMC_API_URL = 'https://stg-apigw-kr.hmg-corp.io/HGERPVENDOR/apiGERPAPIGW/GERPVENDOR/Receive'
const KMC_API_URL = 'https://stg-apigw-kr.hmg-corp.io/KGERPVENDOR/apiGERPAPIGW/GERPVENDOR/Receive'

export const handlers = [
  // OAuth 토큰 발급
  http.post(OAUTH_URL, async () => {
    return HttpResponse.json({
      accToken: 'mock-access-token-12345',
      expires_in: 3600,
      token_type: 'Bearer',
    })
  }),

  // HMC API 호출
  http.post(HMC_API_URL, async ({ request }) => {
    const body = await request.json() as { interfaceId?: string }
    const interfaceId = body?.interfaceId || 'MMPM8001'

    return HttpResponse.json({
      E_RETURN: {
        TYPE: 'S',
        MESSAGE: 'Success',
        ID: interfaceId,
      },
      ET_DATA: [
        {
          MATNR: 'TEST-MATERIAL-001',
          MAKTX: '테스트 자재',
          WERKS: 'H101',
          LIFNR: 'RR4U',
        },
      ],
    })
  }),

  // KMC API 호출
  http.post(KMC_API_URL, async ({ request }) => {
    const body = await request.json() as { interfaceId?: string }
    const interfaceId = body?.interfaceId || 'MMPM8001'

    return HttpResponse.json({
      E_RETURN: {
        TYPE: 'S',
        MESSAGE: 'Success',
        ID: interfaceId,
      },
      ET_DATA: [
        {
          MATNR: 'TEST-MATERIAL-002',
          MAKTX: '테스트 자재 KMC',
          WERKS: 'K101',
          LIFNR: 'RR4U',
        },
      ],
    })
  }),
]

// 에러 핸들러 (테스트에서 필요시 사용)
export const errorHandlers = {
  oauthTimeout: http.post(OAUTH_URL, async () => {
    await new Promise((resolve) => setTimeout(resolve, 15000))
    return HttpResponse.json({ error: 'timeout' })
  }),

  oauthError: http.post(OAUTH_URL, async () => {
    return HttpResponse.json(
      { error: 'invalid_client' },
      { status: 401 }
    )
  }),

  apiError: http.post(HMC_API_URL, async () => {
    return HttpResponse.json({
      E_RETURN: {
        TYPE: 'E',
        MESSAGE: 'Error occurred',
        ID: 'MMPM8001',
      },
      ET_DATA: [],
    })
  }),
}
