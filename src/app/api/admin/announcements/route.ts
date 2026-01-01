/**
 * 관리자 공지사항 API
 * GET /api/admin/announcements - 전체 조회
 * POST /api/admin/announcements - 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, logAdminAction } from '@/app/api/_lib/admin-auth';
import { adminStorage } from '@/lib/admin-storage';
import type {
  Announcement,
  CreateAnnouncementRequest,
} from '@/app/api/_lib/admin-types';
import type { JWTPayload } from '@/app/api/_lib/types';

// Edge Runtime
export const runtime = 'edge';

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
 * GET - 전체 공지사항 조회 (관리자)
 */
async function handleGet(
  request: NextRequest,
  context: { payload: JWTPayload }
): Promise<NextResponse> {
  try {
    const announcements = await adminStorage.getAllAnnouncements();

    // 최신순 정렬
    announcements.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      data: announcements,
      total: announcements.length,
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    return NextResponse.json(
      { error: '공지사항 조회 실패', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST - 공지사항 생성
 */
async function handlePost(
  request: NextRequest,
  context: { payload: JWTPayload }
): Promise<NextResponse> {
  try {
    const body: CreateAnnouncementRequest = await request.json();

    // 필수 필드 검증
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: '제목과 내용은 필수입니다', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // 제목 길이 검증
    if (body.title.length > 100) {
      return NextResponse.json(
        { error: '제목은 100자 이내로 입력해주세요', code: 'TITLE_TOO_LONG' },
        { status: 400 }
      );
    }

    // 내용 길이 검증
    if (body.content.length > 5000) {
      return NextResponse.json(
        { error: '내용은 5000자 이내로 입력해주세요', code: 'CONTENT_TOO_LONG' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const announcement: Announcement = {
      id: generateId(),
      title: body.title.trim(),
      content: body.content.trim(),
      type: body.type || 'info',
      displayLocations: body.displayLocations || ['dashboard'],
      isActive: body.isActive ?? true,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      createdBy: context.payload.email,
      createdAt: now,
      updatedAt: now,
    };

    await adminStorage.createAnnouncement(announcement);

    // 감사 로그
    await logAdminAction(
      context.payload.sub,
      context.payload.email,
      'create_announcement',
      'announcement',
      announcement.id,
      { title: announcement.title, type: announcement.type },
      request
    );

    return NextResponse.json(
      {
        success: true,
        data: announcement,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create announcement error:', error);
    return NextResponse.json(
      { error: '공지사항 생성 실패', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

// 관리자 인증 래퍼 적용
export const GET = withAdminAuth(handleGet);
export const POST = withAdminAuth(handlePost);
