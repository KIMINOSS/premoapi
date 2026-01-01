/**
 * 관리자 사용자 관리 API
 * GET /api/admin/users - 전체 사용자 조회
 * POST /api/admin/users - 사용자 생성
 *
 * Node.js Runtime (storage가 fs 모듈 사용)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, logAdminAction } from '@/app/api/_lib/admin-auth';
import { storage } from '@/lib/storage';
import type { JWTPayload, UserRole, Permission } from '@/app/api/_lib/types';
import type { AdminUserView } from '@/app/api/_lib/admin-types';

/**
 * UUID 생성
 */
function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * 비밀번호 해시 생성 (PBKDF2)
 */
async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const iterations = 100000;
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hash = new Uint8Array(derivedBits);
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const hashHex = Array.from(hash)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${iterations}:${saltHex}:${hashHex}`;
}

/**
 * 스토리지 사용자를 AdminUserView로 변환
 */
function toAdminUserView(
  email: string,
  user: { passwordHash: string; name: string; createdAt: string }
): AdminUserView {
  // 기존 storage 형식은 간단한 형태이므로 기본값 사용
  return {
    id: email, // email을 임시 ID로 사용
    email,
    name: user.name,
    role: 'viewer' as UserRole,
    status: 'active',
    company: null,
    department: null,
    permissions: ['read:api'] as Permission[],
    loginAttempts: 0,
    lastLoginAt: null,
    createdAt: user.createdAt,
  };
}

/**
 * GET - 전체 사용자 조회 (관리자)
 */
async function handleGet(
  request: NextRequest,
  context: { payload: JWTPayload }
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    // 모든 사용자 조회
    const allUsers = await storage.getAllUsers();
    let users = Object.entries(allUsers).map(([email, user]) =>
      toAdminUserView(email, user)
    );

    // 검색 필터
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.email.toLowerCase().includes(searchLower) ||
          u.name.toLowerCase().includes(searchLower)
      );
    }

    // 역할 필터
    if (role) {
      users = users.filter((u) => u.role === role);
    }

    // 상태 필터
    if (status) {
      users = users.filter((u) => u.status === status);
    }

    // 정렬 (생성일 역순)
    users.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // 페이지네이션
    const total = users.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedUsers = users.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: '사용자 목록 조회 실패', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST - 사용자 생성 (관리자)
 */
async function handlePost(
  request: NextRequest,
  context: { payload: JWTPayload }
): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email, password, name, role, company, department, permissions } = body;

    // 필수 필드 검증
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '이메일, 비밀번호, 이름은 필수입니다', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    // 비밀번호 강도 검증
    if (password.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 8자 이상이어야 합니다', code: 'WEAK_PASSWORD' },
        { status: 400 }
      );
    }

    // 중복 확인
    const exists = await storage.userExists(email);
    if (exists) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다', code: 'DUPLICATE_EMAIL' },
        { status: 409 }
      );
    }

    // 비밀번호 해시
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    // 사용자 저장 (기존 storage 형식)
    await storage.setUser(email, {
      passwordHash,
      name,
      createdAt: now,
    });

    // 감사 로그
    await logAdminAction(
      context.payload.sub,
      context.payload.email,
      'create_user',
      'user',
      email,
      { role: role || 'viewer', company },
      request
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: email,
          email,
          name,
          role: role || 'viewer',
          status: 'active',
          company: company || null,
          department: department || null,
          permissions: permissions || ['read:api'],
          createdAt: now,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: '사용자 생성 실패', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

// 관리자 인증 래퍼 적용
export const GET = withAdminAuth(handleGet);
export const POST = withAdminAuth(handlePost);
