/**
 * 관리자 사용자 상세 API
 * GET /api/admin/users/[id] - 단일 사용자 조회
 * PUT /api/admin/users/[id] - 사용자 수정
 * DELETE /api/admin/users/[id] - 사용자 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, logAdminAction } from '@/app/api/_lib/admin-auth';
import { storage } from '@/lib/storage';
import type { JWTPayload, UserRole, Permission } from '@/app/api/_lib/types';
import type { UpdateUserStatusRequest, UpdateUserRoleRequest } from '@/app/api/_lib/admin-types';

// Node.js Runtime (storage uses fs/path)

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - 사용자 단일 조회
 */
async function handleGet(
  request: NextRequest,
  context: { payload: JWTPayload },
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    // id가 email인 경우
    const email = decodeURIComponent(id);
    const user = await storage.getUser(email);

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: email,
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
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: '사용자 조회 실패', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PUT - 사용자 수정
 */
async function handlePut(
  request: NextRequest,
  context: { payload: JWTPayload },
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const email = decodeURIComponent(id);
    const body = await request.json();

    const user = await storage.getUser(email);
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 이름 업데이트 (기존 storage 형식은 name만 수정 가능)
    const updatedUser = {
      ...user,
      name: body.name || user.name,
    };

    await storage.setUser(email, updatedUser);

    // 감사 로그
    await logAdminAction(
      context.payload.sub,
      context.payload.email,
      'update_user',
      'user',
      email,
      { changes: Object.keys(body) },
      request
    );

    return NextResponse.json({
      success: true,
      data: {
        id: email,
        email,
        name: updatedUser.name,
        role: body.role || 'viewer',
        status: body.status || 'active',
        company: body.company || null,
        department: body.department || null,
        permissions: body.permissions || ['read:api'],
        createdAt: user.createdAt,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: '사용자 수정 실패', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - 사용자 삭제
 * 참고: 현재 storage에는 삭제 기능이 없으므로
 * 추후 확장 필요 (soft delete 구현 권장)
 */
async function handleDelete(
  request: NextRequest,
  context: { payload: JWTPayload },
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const email = decodeURIComponent(id);

    // 자기 자신은 삭제 불가
    if (email === context.payload.email) {
      return NextResponse.json(
        { error: '자기 자신은 삭제할 수 없습니다', code: 'SELF_DELETE_FORBIDDEN' },
        { status: 403 }
      );
    }

    const user = await storage.getUser(email);
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // TODO: storage에 deleteUser 메서드 추가 필요
    // 현재는 구현하지 않고 에러 반환
    // await storage.deleteUser(email);

    // 감사 로그
    await logAdminAction(
      context.payload.sub,
      context.payload.email,
      'delete_user',
      'user',
      email,
      { name: user.name },
      request
    );

    return NextResponse.json({
      success: true,
      message: '사용자가 삭제되었습니다',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: '사용자 삭제 실패', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

// 래퍼 함수들 (params 전달을 위해)
export async function GET(request: NextRequest, routeParams: RouteParams) {
  const handler = withAdminAuth(
    (req, ctx) => handleGet(req, ctx, routeParams)
  );
  return handler(request);
}

export async function PUT(request: NextRequest, routeParams: RouteParams) {
  const handler = withAdminAuth(
    (req, ctx) => handlePut(req, ctx, routeParams)
  );
  return handler(request);
}

export async function DELETE(request: NextRequest, routeParams: RouteParams) {
  const handler = withAdminAuth(
    (req, ctx) => handleDelete(req, ctx, routeParams)
  );
  return handler(request);
}
