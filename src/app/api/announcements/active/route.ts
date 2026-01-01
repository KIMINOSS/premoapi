/**
 * 활성 공지사항 조회 API (공개)
 * GET /api/announcements/active - 활성화된 공지사항 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/admin-storage';

// Edge Runtime
export const runtime = 'edge';

/**
 * GET - 활성 공지사항 조회
 * 인증 없이 접근 가능 (로그인 페이지에서 사용)
 *
 * Query params:
 * - location: 'login' | 'dashboard' (표시 위치 필터)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');

    // 활성 공지사항 조회 (위치 필터 적용)
    const announcements = await adminStorage.getActiveAnnouncements(
      location || undefined
    );

    // 긴급 공지사항 먼저, 그 다음 최신순
    announcements.sort((a, b) => {
      // 긴급 공지 우선
      if (a.type === 'urgent' && b.type !== 'urgent') return -1;
      if (a.type !== 'urgent' && b.type === 'urgent') return 1;
      // 경고 공지 두 번째
      if (a.type === 'warning' && b.type === 'info') return -1;
      if (a.type === 'info' && b.type === 'warning') return 1;
      // 같은 타입은 최신순
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // 민감한 정보 제거 (createdBy 등), 다국어 형식 호환
    const publicAnnouncements = announcements.map((a) => ({
      id: a.id,
      type: a.type,
      title: { ko: a.title, en: a.title }, // 다국어 형식 호환
      message: { ko: a.content, en: a.content },
      location: a.displayLocations.length === 2 ? 'both' : a.displayLocations[0],
      displayLocations: a.displayLocations,
      startDate: a.startDate,
      endDate: a.endDate,
      createdAt: a.createdAt,
    }));

    return NextResponse.json({
      success: true,
      announcements: publicAnnouncements,
      data: publicAnnouncements, // 새 API 형식
      count: publicAnnouncements.length,
      total: publicAnnouncements.length,
    });
  } catch (error) {
    console.error('Get active announcements error:', error);
    return NextResponse.json(
      { error: '공지사항 조회 실패', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
