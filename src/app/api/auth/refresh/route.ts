/**
 * 토큰 갱신 API
 * POST /api/auth/refresh
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAccessToken, createRefreshToken } from '../../_lib/auth';
import type { Permission, UserRole } from '../../_lib/types';

export const runtime = 'edge';

// TODO: 실제 데이터베이스/KV 연동 시 교체
// 임시 리프레시 토큰 저장소 (개발용)
const refreshTokenStore: Map<string, {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: number;
}> = new Map();

// 리프레시 토큰 유효 기간 (7일)
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    // 1. 리프레시 토큰 추출 (요청 본문 또는 쿠키)
    let refreshToken: string | undefined;
    
    // 쿠키에서 먼저 시도
    refreshToken = request.cookies.get('refresh_token')?.value;
    
    // 요청 본문에서 시도
    if (!refreshToken) {
      try {
        const body = await request.json();
        refreshToken = body.refreshToken;
      } catch {
        // JSON 파싱 실패 시 무시
      }
    }

    if (!refreshToken || typeof refreshToken !== 'string') {
      return NextResponse.json(
        { error: '리프레시 토큰이 필요합니다.', code: 'REFRESH_TOKEN_REQUIRED' },
        { status: 400 }
      );
    }

    // 2. 리프레시 토큰 검증
    // TODO: KV Store에서 조회
    const tokenData = refreshTokenStore.get(refreshToken);
    
    if (!tokenData) {
      return NextResponse.json(
        { error: '유효하지 않은 리프레시 토큰입니다.', code: 'REFRESH_INVALID' },
        { status: 401 }
      );
    }

    // 3. 만료 확인
    const age = Date.now() - tokenData.createdAt;
    if (age > REFRESH_TOKEN_TTL_MS) {
      refreshTokenStore.delete(refreshToken);
      return NextResponse.json(
        { error: '리프레시 토큰이 만료되었습니다. 다시 로그인하세요.', code: 'REFRESH_EXPIRED' },
        { status: 401 }
      );
    }

    // 4. 새 액세스 토큰 생성
    const newAccessToken = await createAccessToken(
      tokenData.userId,
      tokenData.email,
      tokenData.role,
      tokenData.permissions,
      3600 // 1시간
    );

    // 5. 리프레시 토큰 로테이션 (선택적, 보안 강화)
    // 기존 토큰 삭제하고 새 토큰 발급
    refreshTokenStore.delete(refreshToken);
    const newRefreshToken = createRefreshToken();
    refreshTokenStore.set(newRefreshToken, {
      ...tokenData,
      createdAt: Date.now()
    });

    // 6. 응답 생성
    const res = NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 3600
    });

    // 쿠키 업데이트
    res.cookies.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600,
      path: '/'
    });

    res.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 604800,
      path: '/api/auth'
    });

    return res;
  } catch (error) {
    console.error('Token refresh error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: '토큰 갱신 중 오류가 발생했습니다.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// storeRefreshToken은 _lib/token-store.ts로 이동됨
