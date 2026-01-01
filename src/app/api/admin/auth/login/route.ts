/**
 * 관리자 로그인 API
 * POST /api/admin/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAccessToken, createRefreshToken } from '@/app/api/_lib/auth';
import { logAdminAction } from '@/app/api/_lib/admin-auth';

// Edge Runtime
export const runtime = 'edge';

// 관리자 계정 (환경변수에서 로드, 프로덕션에서는 DB 사용 권장)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@premo.kr';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

/**
 * 비밀번호 해시 비교 (Web Crypto API)
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // PBKDF2 해시 형식: iterations:salt:hash
  const parts = hash.split(':');
  if (parts.length !== 3) return false;

  const [iterStr, saltHex, storedHashHex] = parts;
  const iterations = parseInt(iterStr, 10);

  const salt = hexToBytes(saltHex);
  const storedHash = hexToBytes(storedHashHex);

  // PBKDF2로 입력 비밀번호 해시
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const derivedHash = new Uint8Array(derivedBits);

  // 상수 시간 비교
  if (derivedHash.length !== storedHash.length) return false;
  let result = 0;
  for (let i = 0; i < derivedHash.length; i++) {
    result |= derivedHash[i] ^ storedHash[i];
  }
  return result === 0;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * 간단한 비밀번호 비교 (개발용)
 */
async function simplePasswordCheck(password: string, email: string): Promise<boolean> {
  // 개발 환경에서 사용할 기본 비밀번호
  const DEV_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '***REMOVED***';
  return password === DEV_ADMIN_PASSWORD && email === ADMIN_EMAIL;
}

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

    // 관리자 이메일 확인
    if (email !== ADMIN_EMAIL) {
      // 보안: 관리자가 아닌 경우에도 동일한 에러 메시지
      await logAdminAction(
        'unknown',
        email,
        'login_failed',
        'admin_auth',
        null,
        { reason: 'invalid_email' },
        request
      );
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    // 비밀번호 검증
    let isValid = false;

    if (ADMIN_PASSWORD_HASH) {
      // 프로덕션: 해시 비교
      isValid = await verifyPassword(password, ADMIN_PASSWORD_HASH);
    } else {
      // 개발: 간단 비교
      isValid = await simplePasswordCheck(password, email);
    }

    if (!isValid) {
      await logAdminAction(
        'unknown',
        email,
        'login_failed',
        'admin_auth',
        null,
        { reason: 'invalid_password' },
        request
      );
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    // 토큰 생성
    const userId = 'admin-001'; // 관리자 고정 ID
    const accessToken = await createAccessToken(
      userId,
      email,
      'admin',
      ['*'], // 모든 권한
      3600 // 1시간
    );
    const refreshToken = createRefreshToken();

    // 감사 로그
    await logAdminAction(
      userId,
      email,
      'admin_login',
      'admin_auth',
      null,
      { success: true },
      request
    );

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
