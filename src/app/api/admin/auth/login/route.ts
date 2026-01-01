/**
 * 관리자 로그인 API
 * POST /api/admin/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAccessToken, createRefreshToken } from '@/app/api/_lib/auth';
import { logAdminAction } from '@/app/api/_lib/admin-auth';

// Edge Runtime
export const runtime = 'edge';

// 관리자 계정 (환경변수 필수)
function getAdminEmail(): string {
  const email = process.env.ADMIN_EMAIL;
  if (!email) {
    throw new Error('ADMIN_EMAIL 환경변수가 설정되지 않았습니다');
  }
  return email;
}

function getAdminPasswordHash(): string | null {
  return process.env.ADMIN_PASSWORD_HASH || null;
}

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error('ADMIN_PASSWORD 또는 ADMIN_PASSWORD_HASH 환경변수가 설정되지 않았습니다');
  }
  return password;
}

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
 * 간단한 비밀번호 비교 (환경변수 기반)
 */
async function simplePasswordCheck(password: string, email: string): Promise<boolean> {
  const adminPassword = getAdminPassword();
  const adminEmail = getAdminEmail();
  return password === adminPassword && email === adminEmail;
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
    const adminEmail = getAdminEmail();
    if (email !== adminEmail) {
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

    const adminPasswordHash = getAdminPasswordHash();
    if (adminPasswordHash) {
      // 프로덕션: 해시 비교
      isValid = await verifyPassword(password, adminPasswordHash);
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
