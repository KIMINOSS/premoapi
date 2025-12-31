import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const OAUTH_URL = "https://stg-apigw-kr.hmg-corp.io/oauth/token";
const OAUTH_TIMEOUT = 10000; // 10초

// 유효한 회사 코드 화이트리스트
const VALID_COMPANIES = ['HMC', 'KMC'] as const;
type CompanyType = typeof VALID_COMPANIES[number];

// 환경변수 검증 (빌드 타임에 체크되지 않으므로 런타임 체크)
function getCredentials(company: CompanyType): { clientId: string; secretKey: string } | null {
  const clientId = company === 'HMC'
    ? process.env.HMC_CLIENT_ID
    : process.env.KMC_CLIENT_ID;
  const secretKey = company === 'HMC'
    ? process.env.HMC_SECRET_KEY
    : process.env.KMC_SECRET_KEY;

  if (!clientId || !secretKey) {
    console.error(`Missing credentials for ${company}: clientId=${!!clientId}, secretKey=${!!secretKey}`);
    return null;
  }

  return { clientId, secretKey };
}

// 입력 검증
function validateCompany(company: unknown): company is CompanyType {
  return typeof company === 'string' && VALID_COMPANIES.includes(company as CompanyType);
}

export async function POST(request: NextRequest) {
  try {
    // 1. 요청 파싱
    let body: { company?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '잘못된 요청 형식', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    // 2. 입력 검증 - company 화이트리스트 체크
    const { company } = body;
    if (!validateCompany(company)) {
      return NextResponse.json(
        { error: '유효하지 않은 회사 코드. HMC 또는 KMC만 허용됩니다.', code: 'INVALID_COMPANY' },
        { status: 400 }
      );
    }

    // 3. 환경변수 검증
    const credentials = getCredentials(company);
    if (!credentials) {
      return NextResponse.json(
        { error: '서버 설정 오류. 관리자에게 문의하세요.', code: 'CONFIG_ERROR' },
        { status: 500 }
      );
    }

    const { clientId, secretKey } = credentials;
    const encodedCredentials = btoa(`${clientId}:${secretKey}`);

    // 4. 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OAUTH_TIMEOUT);

    try {
      const response = await fetch(OAUTH_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${encodedCredentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const statusText = response.statusText || 'Unknown error';
        return NextResponse.json(
          { error: `OAuth 실패: ${statusText}`, code: 'OAUTH_FAILED', status: response.status },
          { status: response.status }
        );
      }

      const data = await response.json();
      const token = data.accToken || data.access_token;

      if (!token) {
        return NextResponse.json(
          { error: '토큰이 응답에 포함되지 않았습니다.', code: 'NO_TOKEN' },
          { status: 502 }
        );
      }

      return NextResponse.json({ token, company });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'OAuth 서버 응답 시간 초과 (10초)', code: 'TIMEOUT' },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('OAuth error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: '토큰 발급 중 오류가 발생했습니다.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
