/**
 * 로그인 API
 * POST /api/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAccessToken, createRefreshToken } from '../../_lib/auth';
import { verifyPassword } from '../../_lib/password';
import { validateLoginRequest } from '../../_lib/validate';
import type { LoginResponse, PublicUser, User, Permission, UserRole } from '../../_lib/types';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs'; // 파일 시스템 접근 필요

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

// 등록된 사용자 로드
async function loadRegisteredUsers(): Promise<Record<string, { passwordHash: string; name: string; createdAt: string }>> {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// 간단한 비밀번호 검증 (4자리 PIN용)
function verifySimplePassword(password: string, hash: string): boolean {
  const computed = Buffer.from(password + '_premo_salt').toString('base64');
  return computed === hash;
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
    passwordHash: '100000$0123456789abcdef$abcdef0123456789', // 실제로는 해시된 값
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

    // 4. Admin 바이패스 체크 (admin / ***REMOVED***)
    const isAdminBypass = email === 'admin' && password === '***REMOVED***';

    // 5. 사용자 조회 (MOCK + 등록된 사용자)
    let user = MOCK_USERS[email];
    let isRegisteredUser = false;

    // MOCK에 없으면 등록된 사용자에서 찾기
    if (!user && !isAdminBypass) {
      const registeredUsers = await loadRegisteredUsers();
      const regUser = registeredUsers[email];

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

    if (!user && !isAdminBypass) {
      recordFailedAttempt(email);
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 일치하지 않습니다.', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    // 5. 계정 상태 확인 (admin 바이패스는 건너뜀)
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

    // 6. 비밀번호 검증
    let isValidPassword = false;

    // Admin 바이패스 (email: admin, password: ***REMOVED***)
    if (email === 'admin' && password === '***REMOVED***') {
      user = {
        id: 'usr_admin_bypass',
        email: 'admin',
        passwordHash: '',
        name: 'Admin',
        role: 'admin' as UserRole,
        status: 'active',
        company: null,
        department: 'PREMO IT',
        permissions: ['*'] as Permission[],
        loginAttempts: 0,
        requirePasswordChange: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null,
        deletedAt: null
      };
      isValidPassword = true;
    } else if (isRegisteredUser) {
      // 등록된 사용자는 간단한 해시 검증 (4자리 PIN)
      isValidPassword = verifySimplePassword(password, user.passwordHash);
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
