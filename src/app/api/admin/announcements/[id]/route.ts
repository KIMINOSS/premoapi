/**
 * 관리자 공지사항 상세 API
 * GET /api/admin/announcements/[id] - 단일 조회
 * PUT /api/admin/announcements/[id] - 수정
 * DELETE /api/admin/announcements/[id] - 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, logAdminAction } from '@/app/api/_lib/admin-auth';
import { adminStorage } from '@/lib/admin-storage';
import type { UpdateAnnouncementRequest } from '@/app/api/_lib/admin-types';
import type { JWTPayload } from '@/app/api/_lib/types';

// Edge Runtime
export const runtime = 'edge';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - 공지사항 단일 조회
 */
async function handleGet(
  request: NextRequest,
  context: { payload: JWTPayload },
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const announcement = await adminStorage.getAnnouncement(id);

    if (!announcement) {
      return NextResponse.json(
        { error: '공지사항을 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error('Get announcement error:', error);
    return NextResponse.json(
      { error: '공지사항 조회 실패', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PUT - 공지사항 수정
 */
async function handlePut(
  request: NextRequest,
  context: { payload: JWTPayload },
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body: UpdateAnnouncementRequest = await request.json();

    // 제목 길이 검증
    if (body.title && body.title.length > 100) {
      return NextResponse.json(
        { error: '제목은 100자 이내로 입력해주세요', code: 'TITLE_TOO_LONG' },
        { status: 400 }
      );
    }

    // 내용 길이 검증
    if (body.content && body.content.length > 5000) {
      return NextResponse.json(
        { error: '내용은 5000자 이내로 입력해주세요', code: 'CONTENT_TOO_LONG' },
        { status: 400 }
      );
    }

    const updated = await adminStorage.updateAnnouncement(id, {
      ...body,
      title: body.title?.trim(),
      content: body.content?.trim(),
    });

    if (!updated) {
      return NextResponse.json(
        { error: '공지사항을 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 감사 로그
    await logAdminAction(
      context.payload.sub,
      context.payload.email,
      'update_announcement',
      'announcement',
      id,
      { changes: Object.keys(body) },
      request
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    return NextResponse.json(
      { error: '공지사항 수정 실패', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - 공지사항 삭제
 */
async function handleDelete(
  request: NextRequest,
  context: { payload: JWTPayload },
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const deleted = await adminStorage.deleteAnnouncement(id);

    if (!deleted) {
      return NextResponse.json(
        { error: '공지사항을 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 감사 로그
    await logAdminAction(
      context.payload.sub,
      context.payload.email,
      'delete_announcement',
      'announcement',
      id,
      null,
      request
    );

    return NextResponse.json({
      success: true,
      message: '공지사항이 삭제되었습니다',
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    return NextResponse.json(
      { error: '공지사항 삭제 실패', code: 'SERVER_ERROR' },
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
