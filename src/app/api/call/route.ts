import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const HMC_API_URL = "https://stg-apigw-kr.hmg-corp.io/HGERPVENDOR/apiGERPAPIGW/GERPVENDOR/Receive";
const KMC_API_URL = "https://stg-apigw-kr.hmg-corp.io/KGERPVENDOR/apiGERPAPIGW/GERPVENDOR/Receive";
const API_TIMEOUT = 30000; // 30초 (외부 API는 더 긴 타임아웃)

// 유효한 회사 코드 화이트리스트
const VALID_COMPANIES = ['HMC', 'KMC'] as const;
type CompanyType = typeof VALID_COMPANIES[number];

// 입력 검증
function validateRequest(body: unknown): body is { company: CompanyType; token: string; payload: object } {
  if (!body || typeof body !== 'object') return false;

  const { company, token, payload } = body as Record<string, unknown>;

  if (typeof company !== 'string' || !VALID_COMPANIES.includes(company as CompanyType)) {
    return false;
  }
  if (typeof token !== 'string' || token.trim() === '') {
    return false;
  }
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    // 1. 요청 파싱
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '잘못된 요청 형식', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    // 2. 입력 검증
    if (!validateRequest(body)) {
      return NextResponse.json(
        {
          error: '유효하지 않은 요청. company(HMC/KMC), token, payload가 필요합니다.',
          code: 'INVALID_REQUEST'
        },
        { status: 400 }
      );
    }

    const { company, token, payload } = body;
    const apiUrl = company === 'HMC' ? HMC_API_URL : KMC_API_URL;

    // 3. 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accToken': token
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // 4. 응답 파싱
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        return NextResponse.json(
          { error: 'API 응답 파싱 실패', code: 'PARSE_ERROR' },
          { status: 502 }
        );
      }

      // 5. HTTP 에러 처리
      if (!response.ok) {
        return NextResponse.json(
          {
            error: `API 호출 실패: ${response.status} ${response.statusText}`,
            code: 'API_ERROR',
            details: data
          },
          { status: response.status }
        );
      }

      // 6. outData 구조 처리
      const result = (data as Record<string, unknown>).outData || data;

      return NextResponse.json(result);
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'API 서버 응답 시간 초과 (30초)', code: 'TIMEOUT' },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('API call error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'API 호출 중 오류가 발생했습니다.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
