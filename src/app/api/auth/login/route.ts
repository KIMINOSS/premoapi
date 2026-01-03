/**
 * 로그인 API
 * POST /api/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAccessToken, createRefreshToken } from '../../_lib/auth';
import { verifyPassword } from '../../_lib/password';
import { validateLoginRequest } from '../../_lib/validate';
import type { LoginResponse, PublicUser, User, Permission, UserRole } from '../../_lib/types';
import { storage } from '@/lib/storage';

export const runtime = 'nodejs';

// 비밀번호 검증 (PBKDF2 기반)
async function verifySimplePassword(password: string, hash: string): Promise<boolean> {
  // PBKDF2 해시 형식: iterations$salt$hash
  const parts = hash.split('$');
  if (parts.length !== 3) {
    // 레거시 Base64 해시 지원 (마이그레이션용)
    const computed = Buffer.from(password + '_premo_salt').toString('base64');
    return timingSafeEqual(computed, hash);
  }

  const [iterations, salt, storedHash] = parts;
  const crypto = await import('crypto');
  const derivedKey = crypto.pbkdf2Sync(
    password,
    salt,
    parseInt(iterations, 10),
    32,
    'sha256'
  ).toString('hex');

  return timingSafeEqual(derivedKey, storedHash);
}

// 타이밍 공격 방지용 안전한 비교
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// 로그인 실패 임계값
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30분

// TODO: 실제 데이터베이스 연동 시 교체
// 임시 인메모리 사용자 저장소 (개발용)
const MOCK_USERS: Record<string, User & { passwordHash: string }> = {
  'admin@premo.io': {
    id: 'usr_admin001',
    email: 'admin@premo.io',
    passwordHash: '100000$0123456789abcdef$abcdef0123456789',
    name: '관리자',
    role: 'admin',
    status: 'active',
    company: 'HMC',
    department: 'IT팀',
    permissions: ['*'] as Permission[],
    loginAttempts: 0,
    requirePasswordChange: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    lastLoginAt: null,
    deletedAt: null
  }
};

// 환경변수 관리자 계정 체크 (타이밍 공격 방지)
function checkEnvAdmin(email: string, password: string): (User & { passwordHash: string }) | null {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) return null;

  // 타이밍 공격 방지: 항상 두 비교 모두 수행
  const emailMatch = timingSafeEqual(email, adminEmail);
  const passwordMatch = timingSafeEqual(password, adminPassword);

  if (emailMatch && passwordMatch) {
    return {
      id: 'usr_env_admin',
      email: adminEmail,
      passwordHash: '',
      name: '시스템 관리자',
      role: 'admin' as UserRole,
      status: 'active',
      company: null,
      department: 'IT',
      permissions: ['*'] as Permission[],
      loginAttempts: 0,
      requirePasswordChange: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
      deletedAt: null
    };
  }
  return null;
}

// 로그인 시도 추적 (인메모리, 프로덕션에서는 KV 사용)
const loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();

/**
 * 계정 잠금 확인
 */
function isAccountLocked(email: string): boolean {
  const attempts = loginAttempts.get(email);
  if (!attempts) return false;
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const timeSinceLock = Date.now() - attempts.lastAttempt;
    if (timeSinceLock < LOCKOUT_DURATION_MS) {
      return true;
    }
    // 잠금 해제
    loginAttempts.delete(email);
  }
  
  return false;
}

/**
 * 로그인 실패 기록
 */
function recordFailedAttempt(email: string): number {
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
  attempts.count += 1;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(email, attempts);
  return MAX_LOGIN_ATTEMPTS - attempts.count;
}

/**
 * 로그인 성공 시 시도 횟수 초기화
 */
function clearLoginAttempts(email: string): void {
  loginAttempts.delete(email);
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
    const validation = validateLoginRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', '), code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { email, password } = body as { email: string; password: string };

    // 3. 계정 잠금 확인
    if (isAccountLocked(email)) {
      return NextResponse.json(
        { 
          error: `계정이 잠겼습니다. ${Math.ceil(LOCKOUT_DURATION_MS / 60000)}분 후 다시 시도하세요.`,
          code: 'ACCOUNT_LOCKED'
        },
        { status: 403 }
      );
    }

    // 4. 환경변수 관리자 계정 체크 (admin@premo.kr)
    const envAdmin = checkEnvAdmin(email, password);
    if (envAdmin) {
      // 환경변수 관리자로 바로 로그인 처리
      clearLoginAttempts(email);
      const accessToken = await createAccessToken(
        envAdmin.id,
        envAdmin.email,
        envAdmin.role as UserRole,
        envAdmin.permissions as Permission[],
        3600
      );
      const refreshToken = createRefreshToken();

      const publicUser: PublicUser = {
        id: envAdmin.id,
        email: envAdmin.email,
        name: envAdmin.name,
        role: envAdmin.role as UserRole,
        company: envAdmin.company,
        department: envAdmin.department,
        permissions: envAdmin.permissions as Permission[]
      };

      const res = NextResponse.json({
        accessToken,
        refreshToken,
        expiresIn: 3600,
        user: publicUser
      });

      res.cookies.set('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600,
        path: '/'
      });

      res.cookies.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 604800,
        path: '/api/auth'
      });

      return res;
    }

    // 5. 사용자 조회 (MOCK + 등록된 사용자)
    let user = MOCK_USERS[email];
    let isRegisteredUser = false;

    // MOCK에 없으면 등록된 사용자에서 찾기 (Upstash Redis 또는 파일)
    if (!user) {
      const regUser = await storage.getUser(email);

      if (regUser) {
        isRegisteredUser = true;
        // 등록된 사용자를 User 형식으로 변환
        user = {
          id: `usr_${email.replace(/[@.]/g, '_')}`,
          email,
          passwordHash: regUser.passwordHash,
          name: regUser.name,
          role: 'viewer' as UserRole,
          status: 'active',
          company: null,
          department: 'PREMO',
          permissions: ['read:api'] as Permission[],
          loginAttempts: 0,
          requirePasswordChange: false,
          createdAt: regUser.createdAt,
          updatedAt: regUser.createdAt,
          lastLoginAt: null,
          deletedAt: null
        };
      }
    }

    if (!user) {
      recordFailedAttempt(email);
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 일치하지 않습니다.', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    // 6. 계정 상태 확인
    if (user && user.status === 'inactive') {
      return NextResponse.json(
        { error: '비활성화된 계정입니다. 관리자에게 문의하세요.', code: 'ACCOUNT_DISABLED' },
        { status: 403 }
      );
    }

    if (user && user.status === 'locked') {
      return NextResponse.json(
        { error: '잠긴 계정입니다. 관리자에게 문의하세요.', code: 'ACCOUNT_LOCKED' },
        { status: 403 }
      );
    }

    // 7. 비밀번호 검증
    let isValidPassword = false;

    if (isRegisteredUser) {
      // 등록된 사용자는 PBKDF2 해시 검증
      isValidPassword = await verifySimplePassword(password, user.passwordHash);
    } else {
      // MOCK 사용자는 기존 검증
      isValidPassword = await verifyPassword(password, user.passwordHash);
    }

    if (!isValidPassword) {
      const remaining = recordFailedAttempt(email);
      const message = remaining > 0
        ? `이메일 또는 비밀번호가 일치하지 않습니다. (${remaining}회 남음)`
        : `로그인 실패 횟수 초과. 계정이 ${Math.ceil(LOCKOUT_DURATION_MS / 60000)}분간 잠깁니다.`;
      
      return NextResponse.json(
        { error: message, code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    // 7. 로그인 성공 처리
    clearLoginAttempts(email);

    // 8. 토큰 생성
    const accessToken = await createAccessToken(
      user.id,
      user.email,
      user.role as UserRole,
      user.permissions as Permission[],
      3600 // 1시간
    );
    
    const refreshToken = createRefreshToken();

    // TODO: 리프레시 토큰을 KV Store에 저장

    // 9. 응답 생성
    const publicUser: PublicUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      company: user.company,
      department: user.department,
      permissions: user.permissions as Permission[]
    };

    const response: LoginResponse = {
      accessToken,
      refreshToken,
      expiresIn: 3600,
      user: publicUser
    };

    // 10. 쿠키 설정 (httpOnly, secure)
    const res = NextResponse.json(response);
    
    // Access Token 쿠키 (1시간)
    res.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600,
      path: '/'
    });
    
    // Refresh Token 쿠키 (7일)
    res.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 604800,
      path: '/api/auth'
    });

    return res;
  } catch (error) {
    console.error('Login error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
