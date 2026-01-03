/**
 * 관리자 로그인 API (간소화 버전)
 * POST /api/admin/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAccessToken, createRefreshToken } from '@/app/api/_lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요', code: 'MISSING_CREDENTIALS' },
        { status: 400 }
      );
    }

    // 환경변수에서 관리자 계정 확인
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('ADMIN_EMAIL or ADMIN_PASSWORD not set');
      return NextResponse.json(
        { error: '서버 설정 오류', code: 'CONFIG_ERROR' },
        { status: 500 }
      );
    }

    // 인증 확인
    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    // 토큰 생성
    const userId = 'admin-001';
    const accessToken = await createAccessToken(
      userId,
      email,
      'admin',
      ['*'],
      3600
    );
    const refreshToken = createRefreshToken();

    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      expiresIn: 3600,
      user: {
        id: userId,
        email,
        name: '시스템 관리자',
        role: 'admin',
        permissions: ['*'],
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
