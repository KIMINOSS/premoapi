/**
 * 메뉴 설정 조회 API (공개)
 * GET /api/menus/config - 메뉴 설정 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractBearerToken } from '@/app/api/_lib/auth';
import { adminStorage } from '@/lib/admin-storage';

// Edge Runtime
export const runtime = 'edge';

// 메뉴 설정 타입 정의 (기존 형식 호환)
interface MenuInterface {
  id: string;
  name: { ko: string; en: string };
  params: string[];
  hidden?: boolean;
  order?: number;
}

interface LegacyMenuConfig {
  version: string;
  lastUpdated: string;
  HMC: MenuInterface[];
  KMC: MenuInterface[];
}

// 기본 메뉴 설정 데이터 (DB에 없을 때 사용)
const DEFAULT_MENU_CONFIG: LegacyMenuConfig = {
  version: '1.0.0',
  lastUpdated: '2026-01-01T00:00:00Z',
  HMC: [
    { id: 'MMPM8001', name: { ko: '품목 정보', en: 'Material Info' }, params: ['I_LIFNR', 'I_WERKS'], order: 1 },
    { id: 'MMPM8002', name: { ko: '검수 합격 통보서', en: 'Inspection Report' }, params: ['I_LIFNR', 'I_ZDSEND2_START'], order: 2 },
    { id: 'MMPM8003', name: { ko: '입고 실적 조회', en: 'GR Info Query' }, params: ['I_LIFNR', 'I_BUDAT', 'I_WERKS'], order: 3 },
    { id: 'MMPM8004', name: { ko: '월 검수 정보', en: 'Monthly Sales Info' }, params: ['I_LIFNR', 'I_SPMON'], order: 4 },
    { id: 'MMPM8005', name: { ko: '사급 매출 현황', en: 'Subcon Sales Info' }, params: ['I_LIFNR', 'I_SPMON'], order: 5 },
    { id: 'MMPM8006', name: { ko: '일별 소요량', en: 'Daily Demand' }, params: ['I_LIFNR', 'I_DISPD', 'I_ZPLDAYS', 'I_WERKS'], order: 6 },
    { id: 'MMPM8007', name: { ko: '주별 소요량', en: 'Weekly Demand' }, params: ['I_LIFNR', 'I_DISPW', 'I_WERKS'], order: 7 },
    { id: 'MMPM8008', name: { ko: '부품 출하 조회', en: 'Shipment Query' }, params: ['I_LIFNR', 'I_ERDAT'], order: 8 },
    { id: 'MMPM8009', name: { ko: '부품 출하 생성', en: 'Shipment Create' }, params: ['I_LIFNR', 'I_ZASNNO'], order: 9 },
    { id: 'MMPM8010', name: { ko: '부품 소급 정산', en: 'Retro Settlement' }, params: ['I_LIFNR', 'I_SPMON'], order: 10 },
    { id: 'MMPM8011', name: { ko: '유상사급 재고 조회', en: 'Subcon Stock Query' }, params: ['I_LIFNR', 'I_BUDAT', 'I_WERKS', 'I_STATUS'], order: 11 },
    { id: 'MMPM8012', name: { ko: '유상사급 재고 조정', en: 'Subcon Stock Adjust' }, params: ['I_LIFNR', 'I_BUDAT', 'I_WERKS'], order: 12 },
    { id: 'MMPM8013', name: { ko: '전주공장 간판발주', en: 'Kanban Order' }, params: ['I_LIFNR', 'I_WERKS'], order: 13 },
    { id: 'MMPM8014', name: { ko: '업체자율 재고 조회', en: 'VMI Stock Query' }, params: ['I_LIFNR', 'I_BASEDT', 'I_WERKS', 'I_MATNR'], order: 14 },
    { id: 'MMPM8015', name: { ko: '업체자율 재고 조정', en: 'VMI Stock Adjust' }, params: ['I_LIFNR', 'I_BASEDT', 'I_WERKS'], order: 15 },
  ],
  KMC: [
    { id: 'MMPM8001', name: { ko: '품목 정보', en: 'Material Info' }, params: ['I_LIFNR', 'I_WERKS'], order: 1 },
    { id: 'MMPM8002', name: { ko: '검수 합격 통보서', en: 'Inspection Report' }, params: ['I_LIFNR', 'I_ZDSEND2_START'], order: 2 },
    { id: 'MMPM8003', name: { ko: '입고 실적 조회', en: 'GR Info Query' }, params: ['I_LIFNR', 'I_BUDAT', 'I_WERKS'], order: 3 },
    { id: 'MMPM8004', name: { ko: '월 검수 정보', en: 'Monthly Sales Info' }, params: ['I_LIFNR', 'I_SPMON'], order: 4 },
    { id: 'MMPM8005', name: { ko: '사급 매출 현황', en: 'Subcon Sales Info' }, params: ['I_LIFNR', 'I_SPMON'], order: 5 },
    { id: 'MMPM8006', name: { ko: '일별 소요량', en: 'Daily Demand' }, params: ['I_LIFNR', 'I_DISPD', 'I_ZPLDAYS', 'I_WERKS'], order: 6 },
    { id: 'MMPM8007', name: { ko: '주별 소요량', en: 'Weekly Demand' }, params: ['I_LIFNR', 'I_DISPW', 'I_WERKS'], order: 7 },
    { id: 'MMPM8008', name: { ko: '부품 출하 조회', en: 'Shipment Query' }, params: ['I_LIFNR', 'I_ERDAT'], order: 8 },
    { id: 'MMPM8010', name: { ko: '부품 소급 정산', en: 'Retro Settlement' }, params: ['I_LIFNR', 'I_SPMON'], order: 9 },
    { id: 'MMPM8011', name: { ko: '유상사급 재고 조회', en: 'Subcon Stock Query' }, params: ['I_LIFNR', 'I_BUDAT', 'I_WERKS', 'I_STATUS'], order: 10 },
    { id: 'MMPM8012', name: { ko: '유상사급 재고 조정', en: 'Subcon Stock Adjust' }, params: ['I_LIFNR', 'I_BUDAT', 'I_WERKS'], order: 11 },
    { id: 'MMPM8014', name: { ko: '업체자율 재고 조회', en: 'VMI Stock Query' }, params: ['I_LIFNR', 'I_BASEDT', 'I_WERKS', 'I_MATNR'], order: 12 },
    { id: 'MMPM8015', name: { ko: '업체자율 재고 조정', en: 'VMI Stock Adjust' }, params: ['I_LIFNR', 'I_BASEDT', 'I_WERKS'], order: 13 },
  ],
};

/**
 * GET - 메뉴 설정 조회
 * 인증 없이도 기본 메뉴 조회 가능 (로그인 전 UI 렌더링용)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientVersion = searchParams.get('version');

    // DB에서 관리자 설정 조회 시도
    let dbConfig;
    try {
      dbConfig = await adminStorage.getMenuConfig();
    } catch {
      // DB 조회 실패 시 기본값 사용
      dbConfig = null;
    }

    // 기본 설정 사용 (DB 설정은 visible 필드로 필터링에 사용)
    const menuConfig = DEFAULT_MENU_CONFIG;

    // DB 설정이 있으면 visible 필드 적용
    let hmcMenus = menuConfig.HMC;
    let kmcMenus = menuConfig.KMC;

    if (dbConfig && dbConfig.items) {
      const visibleIds = new Set(
        dbConfig.items.filter((i) => i.visible).map((i) => i.id.toUpperCase())
      );

      // 모든 항목이 visible인 경우 (기본 설정) 필터링 안함
      if (visibleIds.size < dbConfig.items.length) {
        hmcMenus = menuConfig.HMC.filter((m) => visibleIds.has(m.id));
        kmcMenus = menuConfig.KMC.filter((m) => visibleIds.has(m.id));
      }
    }

    // 버전 확인으로 캐시 무효화 지원
    const currentVersion = dbConfig ? String(dbConfig.version) : menuConfig.version;
    const needsUpdate = !clientVersion || clientVersion !== currentVersion;

    // 숨김 처리된 메뉴 필터링 및 정렬
    const filteredConfig = {
      version: currentVersion,
      lastUpdated: dbConfig?.updatedAt || menuConfig.lastUpdated,
      needsUpdate,
      HMC: hmcMenus
        .filter((menu) => !menu.hidden)
        .sort((a, b) => (a.order || 999) - (b.order || 999)),
      KMC: kmcMenus
        .filter((menu) => !menu.hidden)
        .sort((a, b) => (a.order || 999) - (b.order || 999)),
    };

    return NextResponse.json({
      success: true,
      config: filteredConfig,
    });
  } catch (error) {
    console.error('Get menu config error:', error);

    // 에러 시에도 기본 메뉴 반환
    return NextResponse.json({
      success: true,
      config: {
        ...DEFAULT_MENU_CONFIG,
        needsUpdate: true,
      },
    });
  }
}
