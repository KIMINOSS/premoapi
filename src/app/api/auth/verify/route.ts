/**
 * 이메일 검증 및 계정 생성 API - Stateless 토큰 + Upstash Redis 영구 저장
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/crypto';
import { storage } from '@/lib/storage';

export const runtime = 'nodejs';

// 간단한 비밀번호 해시 (4자리 PIN용)
function hashPassword(password: string): string {
  return Buffer.from(password + '_premo_salt').toString('base64');
}

// GET: 토큰 검증
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: '토큰이 없습니다.' },
      { status: 400 }
    );
  }

  // Stateless 토큰 검증
  const data = await verifyToken(decodeURIComponent(token));

  if (!data) {
    return NextResponse.json(
      { error: '유효하지 않거나 만료된 링크입니다.' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    email: data.email,
    storage: storage.getStorageType(),
  });
}

// POST: 계정 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body as { token: string; password: string };

    // 1. 입력 검증
    if (!token || !password) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 2. 비밀번호 형식 검증 (4자리 숫자)
    if (!/^\d{4}$/.test(password)) {
      return NextResponse.json(
        { error: '비밀번호는 숫자 4자리여야 합니다.' },
        { status: 400 }
      );
    }

    // 3. Stateless 토큰 검증
    const data = await verifyToken(decodeURIComponent(token));

    if (!data) {
      return NextResponse.json(
        { error: '유효하지 않거나 만료된 링크입니다.' },
        { status: 400 }
      );
    }

    const email = data.email;

    // 4. 이미 등록된 사용자 확인 (Upstash Redis 또는 파일)
    if (await storage.userExists(email)) {
      return NextResponse.json(
        { error: '이미 등록된 계정입니다.' },
        { status: 400 }
      );
    }

    // 5. 사용자 생성
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    await storage.setUser(email, {
      passwordHash: hashPassword(password),
      name,
      createdAt: new Date().toISOString(),
    });

    console.log(`✅ 사용자 등록 완료: ${email} (${storage.getStorageType()})`);

    return NextResponse.json({
      success: true,
      storage: storage.getStorageType(),
    });

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
