/**
 * 관리자 인증 유틸리티
 * Edge Runtime 호환 (Web Crypto API 사용)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractBearerToken, hasRoleLevel } from './auth';
import type { JWTPayload } from './types';
import type { AdminAuditLog, AdminAuditAction } from './admin-types';
import { adminStorage } from '@/lib/admin-storage';

// 관리자 인증 결과
export interface AdminAuthResult {
  success: true;
  payload: JWTPayload;
}

export interface AdminAuthError {
  success: false;
  error: string;
  code: string;
  status: number;
}

/**
 * 관리자 인증 검증
 * @param request NextRequest
 * @returns 인증 결과 또는 에러
 */
export async function verifyAdminAuth(
  request: NextRequest
): Promise<AdminAuthResult | AdminAuthError> {
  // Authorization 헤더에서 토큰 추출
  const authHeader = request.headers.get('Authorization');
  const token = extractBearerToken(authHeader);

  if (!token) {
    return {
      success: false,
      error: '인증 토큰이 필요합니다',
      code: 'MISSING_TOKEN',
      status: 401,
    };
  }

  // 토큰 검증
  const result = await verifyAccessToken(token);

  if (!result.valid) {
    const errorMessages: Record<string, string> = {
      INVALID_TOKEN_FORMAT: '잘못된 토큰 형식입니다',
      INVALID_SIGNATURE: '토큰 서명이 유효하지 않습니다',
      TOKEN_EXPIRED: '토큰이 만료되었습니다',
      VERIFICATION_ERROR: '토큰 검증 중 오류가 발생했습니다',
    };

    return {
      success: false,
      error: errorMessages[result.error] || '토큰 검증 실패',
      code: result.error,
      status: 401,
    };
  }

  // 관리자 권한 확인
  if (!hasRoleLevel(result.payload.role, 'admin')) {
    return {
      success: false,
      error: '관리자 권한이 필요합니다',
      code: 'FORBIDDEN',
      status: 403,
    };
  }

  return {
    success: true,
    payload: result.payload,
  };
}

/**
 * 관리자 인증 미들웨어 래퍼
 * @param handler API 핸들러
 * @returns 래핑된 핸들러
 */
export function withAdminAuth(
  handler: (
    request: NextRequest,
    context: { payload: JWTPayload }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await verifyAdminAuth(request);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          code: authResult.code,
        },
        { status: authResult.status }
      );
    }

    return handler(request, { payload: authResult.payload });
  };
}

/**
 * 감사 로그 기록
 * @param adminId 관리자 ID
 * @param adminEmail 관리자 이메일
 * @param action 액션
 * @param resource 리소스 타입
 * @param resourceId 리소스 ID
 * @param details 상세 정보
 * @param request 요청 객체 (IP, User-Agent 추출용)
 */
export async function logAdminAction(
  adminId: string,
  adminEmail: string,
  action: AdminAuditAction,
  resource: string | null,
  resourceId: string | null,
  details: Record<string, unknown> | null,
  request?: NextRequest
): Promise<void> {
  const log: AdminAuditLog = {
    id: generateId(),
    adminId,
    adminEmail,
    action,
    resource,
    resourceId,
    details,
    ipAddress: request?.headers.get('x-forwarded-for') ||
      request?.headers.get('x-real-ip') ||
      null,
    userAgent: request?.headers.get('user-agent') || null,
    createdAt: new Date().toISOString(),
  };

  try {
    await adminStorage.addAuditLog(log);
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // 감사 로그 실패는 작업을 중단하지 않음
  }
}

/**
 * 고유 ID 생성 (UUID v4 호환)
 */
function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // UUID v4 형식으로 변환
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant

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
 * 요청에서 클라이언트 정보 추출
 */
export function extractClientInfo(request: NextRequest): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  return {
    ipAddress:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      null,
    userAgent: request.headers.get('user-agent') || null,
  };
}
