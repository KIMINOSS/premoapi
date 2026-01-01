/**
 * 관리자 환경변수 디버깅 (임시)
 * 배포 후 삭제 예정
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAccessToken } from '@/app/api/_lib/auth';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    env: {
      ADMIN_EMAIL: process.env.ADMIN_EMAIL ? 'SET' : 'NOT_SET',
      ADMIN_EMAIL_LENGTH: process.env.ADMIN_EMAIL?.length || 0,
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'SET' : 'NOT_SET',
      ADMIN_PASSWORD_LENGTH: process.env.ADMIN_PASSWORD?.length || 0,
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT_SET',
      JWT_SECRET_LENGTH: process.env.JWT_SECRET?.length || 0,
      JWT_SECRET_PREVIEW: process.env.JWT_SECRET?.substring(0, 5) || 'NONE',
    },
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Step 1: 환경변수 확인
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail) {
      return NextResponse.json({ step: 1, error: 'ADMIN_EMAIL not set' });
    }
    if (!adminPassword) {
      return NextResponse.json({ step: 2, error: 'ADMIN_PASSWORD not set' });
    }

    // Step 2: 이메일 비교
    if (email !== adminEmail) {
      return NextResponse.json({
        step: 3,
        error: 'Email mismatch',
        expected: adminEmail.length,
        got: email?.length,
      });
    }

    // Step 3: 비밀번호 비교
    if (password !== adminPassword) {
      return NextResponse.json({
        step: 4,
        error: 'Password mismatch',
        expected: adminPassword.length,
        got: password?.length,
      });
    }

    // Step 4: JWT 생성 테스트
    try {
      const token = await createAccessToken(
        'admin-001',
        email,
        'admin',
        ['*'],
        3600
      );
      return NextResponse.json({
        step: 5,
        success: true,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 50),
      });
    } catch (jwtError) {
      return NextResponse.json({
        step: 5,
        error: 'JWT creation failed',
        message: jwtError instanceof Error ? jwtError.message : String(jwtError),
      });
    }
  } catch (error) {
    return NextResponse.json({
      step: 0,
      error: 'Parse error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
