/**
 * 관리자 메뉴 설정 API
 * GET /api/admin/menus - 메뉴 설정 조회
 * PUT /api/admin/menus - 메뉴 설정 수정
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, logAdminAction } from '@/app/api/_lib/admin-auth';
import { adminStorage } from '@/lib/admin-storage';
import type { MenuConfig, UpdateMenuConfigRequest } from '@/app/api/_lib/admin-types';
import type { JWTPayload } from '@/app/api/_lib/types';

// Edge Runtime
export const runtime = 'edge';

/**
 * GET - 메뉴 설정 조회
 */
async function handleGet(
  request: NextRequest,
  context: { payload: JWTPayload }
): Promise<NextResponse> {
  try {
    const menuConfig = await adminStorage.getMenuConfig();

    return NextResponse.json({
      success: true,
      data: menuConfig,
    });
  } catch (error) {
    console.error('Get menu config error:', error);
    return NextResponse.json(
      { error: '메뉴 설정 조회 실패', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PUT - 메뉴 설정 수정
 */
async function handlePut(
  request: NextRequest,
  context: { payload: JWTPayload }
): Promise<NextResponse> {
  try {
    const body: UpdateMenuConfigRequest = await request.json();

    // 현재 설정 조회
    const currentConfig = await adminStorage.getMenuConfig();

    // 유효성 검증
    if (body.groups) {
      // 그룹 ID 중복 확인
      const groupIds = body.groups.map((g) => g.id);
      const uniqueGroupIds = new Set(groupIds);
      if (groupIds.length !== uniqueGroupIds.size) {
        return NextResponse.json(
          { error: '그룹 ID가 중복됩니다', code: 'DUPLICATE_GROUP_ID' },
          { status: 400 }
        );
      }
    }

    if (body.items) {
      // 아이템 ID 중복 확인
      const itemIds = body.items.map((i) => i.id);
      const uniqueItemIds = new Set(itemIds);
      if (itemIds.length !== uniqueItemIds.size) {
        return NextResponse.json(
          { error: '메뉴 항목 ID가 중복됩니다', code: 'DUPLICATE_ITEM_ID' },
          { status: 400 }
        );
      }

      // 그룹 참조 확인
      const validGroups = new Set(
        (body.groups || currentConfig.groups).map((g) => g.id)
      );
      for (const item of body.items) {
        if (!validGroups.has(item.group)) {
          return NextResponse.json(
            {
              error: `메뉴 항목 "${item.id}"가 존재하지 않는 그룹 "${item.group}"을 참조합니다`,
              code: 'INVALID_GROUP_REFERENCE',
            },
            { status: 400 }
          );
        }
      }
    }

    // 새 설정 생성
    const newConfig: MenuConfig = {
      version: currentConfig.version + 1,
      groups: body.groups || currentConfig.groups,
      items: body.items || currentConfig.items,
      updatedBy: context.payload.email,
      updatedAt: new Date().toISOString(),
    };

    // 저장
    await adminStorage.setMenuConfig(newConfig);

    // 감사 로그
    await logAdminAction(
      context.payload.sub,
      context.payload.email,
      'update_menu_config',
      'menu_config',
      null,
      {
        version: newConfig.version,
        changedGroups: !!body.groups,
        changedItems: !!body.items,
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: newConfig,
      message: '메뉴 설정이 업데이트되었습니다',
    });
  } catch (error) {
    console.error('Update menu config error:', error);
    return NextResponse.json(
      { error: '메뉴 설정 수정 실패', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

// 관리자 인증 래퍼 적용
export const GET = withAdminAuth(handleGet);
export const PUT = withAdminAuth(handlePut);
