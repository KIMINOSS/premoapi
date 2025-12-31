/**
 * Next.js 전역 미들웨어
 * 인증 및 권한 검증
 */

import { NextRequest, NextResponse } from 'next/server';

// 인증이 필요한 경로 패턴
const PROTECTED_PATHS = [
  '/api/users',
  '/api/roles',
  '/dashboard'
];

// 인증 없이 접근 가능한 경로
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/register',
  '/api/auth/verify',
  '/api/oauth',
  '/api/call',
  '/api/responses',
  '/',
  '/login',
  '/register',
  '/verify'
];

// Rate Limiting 설정
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1분
const RATE_LIMIT_MAX_REQUESTS = 100;    // 분당 최대 요청

// 요청 추적 (인메모리, 프로덕션에서는 KV 사용)
const requestCounts: Map<string, { count: number; windowStart: number }> = new Map();

/**
 * Rate Limiting 체크
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    requestCounts.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

/**
 * 경로가 보호되어야 하는지 확인
 */
function isProtectedPath(pathname: string): boolean {
  // 명시적 공개 경로 체크
  for (const path of PUBLIC_PATHS) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      return false;
    }
  }
  
  // 보호 경로 패턴 매칭
  for (const pattern of PROTECTED_PATHS) {
    if (pathname === pattern || pathname.startsWith(pattern + '/')) {
      return true;
    }
  }
  
  return false;
}

/**
 * JWT 토큰 간단 검증 (상세 검증은 API 핸들러에서)
 */
function extractToken(request: NextRequest): string | null {
  // Authorization 헤더
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  
  // 쿠키
  return request.cookies.get('access_token')?.value || null;
}

/**
 * JWT 페이로드 디코딩 (서명 검증 없이, 빠른 체크용)
 */
function decodeJWTPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payloadBase64 = parts[1];
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 🔧 개발 환경 인증 우회 (배포 시 자동 비활성화)
  if (process.env.NODE_ENV === 'development') {
    const response = NextResponse.next();
    response.headers.set('X-Dev-Bypass', 'true');
    return response;
  }
  
  // 1. Rate Limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const rateLimit = checkRateLimit(ip);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.', code: 'RATE_LIMITED' },
      { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
          'X-RateLimit-Remaining': '0'
        }
      }
    );
  }

  // 2. 보호 경로 체크
  if (!isProtectedPath(pathname)) {
    // 공개 경로는 Rate Limit 헤더만 추가
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    return response;
  }

  // 3. 토큰 추출
  const token = extractToken(request);
  
  if (!token) {
    // API 요청은 401, 페이지 요청은 로그인 리다이렉트
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    
    // 대시보드 등 페이지 접근 시 로그인 리다이렉트
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. 토큰 기본 검증 (만료 체크)
  const payload = decodeJWTPayload(token);
  
  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 만료 체크
  const exp = payload.exp as number;
  if (!exp || exp < Math.floor(Date.now() / 1000)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: '토큰이 만료되었습니다.', code: 'TOKEN_EXPIRED' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 5. 요청에 사용자 정보 추가 (API 핸들러에서 사용)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.sub as string);
  requestHeaders.set('x-user-email', payload.email as string);
  requestHeaders.set('x-user-role', payload.role as string);
  requestHeaders.set('x-user-permissions', JSON.stringify(payload.permissions || []));

  // 6. 응답 생성
  const response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
  
  response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
  response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));

  return response;
}

// 미들웨어 적용 경로 설정
export const config = {
  matcher: [
    /*
     * 다음 경로 제외:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico (파비콘)
     * - public 폴더
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)'
  ]
};
