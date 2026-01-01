/**
 * 관리자 저장소 - Upstash Redis 기반
 * 공지사항, 메뉴 설정, 감사 로그 관리
 */

import { Redis } from '@upstash/redis';
import type {
  Announcement,
  MenuConfig,
  AdminAuditLog,
  REDIS_KEYS,
} from '@/app/api/_lib/admin-types';

// Redis 클라이언트
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Redis 키 상수
const KEYS = {
  ANNOUNCEMENTS: 'admin:announcements',
  MENU_CONFIG: 'admin:menus',
  AUDIT_LOG: 'admin:audit',
  USER_SESSIONS: 'admin:sessions',
} as const;

// 메모리 저장소 (Redis 없을 때 폴백)
const memoryStore = {
  announcements: new Map<string, Announcement>(),
  menuConfig: null as MenuConfig | null,
  auditLogs: [] as AdminAuditLog[],
};

// 기본 메뉴 설정
const DEFAULT_MENU_CONFIG: MenuConfig = {
  version: 1,
  groups: [
    { id: 'hmc', label: 'HMC (현대)', order: 1 },
    { id: 'kmc', label: 'KMC (기아)', order: 2 },
  ],
  items: [
    { id: 'mmpm8001', label: '품목정보', group: 'hmc', order: 1, visible: true },
    { id: 'mmpm8002', label: '검수합격통보서', group: 'hmc', order: 2, visible: true },
    { id: 'mmpm8003', label: '입고실적정보조회', group: 'hmc', order: 3, visible: true },
    { id: 'mmpm8004', label: '월검수정보', group: 'hmc', order: 4, visible: true },
    { id: 'mmpm8005', label: '사급매출현황정보', group: 'hmc', order: 5, visible: true },
    { id: 'mmpm8006', label: '일별소요량', group: 'hmc', order: 6, visible: true },
    { id: 'mmpm8007', label: '주별소요량', group: 'hmc', order: 7, visible: true },
    { id: 'mmpm8008', label: '부품출하정보조회', group: 'hmc', order: 8, visible: true },
    { id: 'mmpm8009', label: '부품출하정보생성', group: 'hmc', order: 9, visible: true },
    { id: 'mmpm8010', label: '부품소급정산정보', group: 'hmc', order: 10, visible: true },
    { id: 'mmpm8011', label: '유상사급재고조회', group: 'hmc', order: 11, visible: true },
    { id: 'mmpm8012', label: '유상사급재고조정', group: 'hmc', order: 12, visible: true },
    { id: 'mmpm8013', label: '전주공장간판발주', group: 'hmc', order: 13, visible: true },
    { id: 'mmpm8014', label: '업체자율재고조회', group: 'hmc', order: 14, visible: true },
    { id: 'mmpm8015', label: '업체자율재고조정', group: 'hmc', order: 15, visible: true },
  ],
  updatedBy: 'system',
  updatedAt: new Date().toISOString(),
};

/**
 * 관리자 저장소 인터페이스
 */
export const adminStorage = {
  // ==================== 공지사항 ====================

  /**
   * 모든 공지사항 조회
   */
  async getAllAnnouncements(): Promise<Announcement[]> {
    if (redis) {
      const data = await redis.hgetall<Record<string, Announcement>>(KEYS.ANNOUNCEMENTS);
      return data ? Object.values(data) : [];
    }
    return Array.from(memoryStore.announcements.values());
  },

  /**
   * 공지사항 조회 (단일)
   */
  async getAnnouncement(id: string): Promise<Announcement | null> {
    if (redis) {
      return await redis.hget<Announcement>(KEYS.ANNOUNCEMENTS, id);
    }
    return memoryStore.announcements.get(id) || null;
  },

  /**
   * 활성 공지사항 조회
   */
  async getActiveAnnouncements(location?: string): Promise<Announcement[]> {
    const all = await this.getAllAnnouncements();
    const now = new Date();

    return all.filter((a) => {
      // 활성 상태 확인
      if (!a.isActive) return false;

      // 표시 위치 필터
      if (location && !a.displayLocations.includes(location as 'login' | 'dashboard')) {
        return false;
      }

      // 시작일 확인
      if (a.startDate && new Date(a.startDate) > now) return false;

      // 종료일 확인
      if (a.endDate && new Date(a.endDate) < now) return false;

      return true;
    });
  },

  /**
   * 공지사항 생성
   */
  async createAnnouncement(announcement: Announcement): Promise<void> {
    if (redis) {
      await redis.hset(KEYS.ANNOUNCEMENTS, { [announcement.id]: announcement });
      return;
    }
    memoryStore.announcements.set(announcement.id, announcement);
  },

  /**
   * 공지사항 수정
   */
  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement | null> {
    const existing = await this.getAnnouncement(id);
    if (!existing) return null;

    const updated: Announcement = {
      ...existing,
      ...updates,
      id, // ID는 변경 불가
      updatedAt: new Date().toISOString(),
    };

    if (redis) {
      await redis.hset(KEYS.ANNOUNCEMENTS, { [id]: updated });
    } else {
      memoryStore.announcements.set(id, updated);
    }

    return updated;
  },

  /**
   * 공지사항 삭제
   */
  async deleteAnnouncement(id: string): Promise<boolean> {
    const existing = await this.getAnnouncement(id);
    if (!existing) return false;

    if (redis) {
      await redis.hdel(KEYS.ANNOUNCEMENTS, id);
    } else {
      memoryStore.announcements.delete(id);
    }

    return true;
  },

  // ==================== 메뉴 설정 ====================

  /**
   * 메뉴 설정 조회
   */
  async getMenuConfig(): Promise<MenuConfig> {
    if (redis) {
      const config = await redis.get<MenuConfig>(KEYS.MENU_CONFIG);
      return config || DEFAULT_MENU_CONFIG;
    }
    return memoryStore.menuConfig || DEFAULT_MENU_CONFIG;
  },

  /**
   * 메뉴 설정 저장
   */
  async setMenuConfig(config: MenuConfig): Promise<void> {
    if (redis) {
      await redis.set(KEYS.MENU_CONFIG, config);
      return;
    }
    memoryStore.menuConfig = config;
  },

  // ==================== 감사 로그 ====================

  /**
   * 감사 로그 추가
   */
  async addAuditLog(log: AdminAuditLog): Promise<void> {
    if (redis) {
      // 최신 1000개만 유지
      await redis.lpush(KEYS.AUDIT_LOG, log);
      await redis.ltrim(KEYS.AUDIT_LOG, 0, 999);
      return;
    }
    memoryStore.auditLogs.unshift(log);
    if (memoryStore.auditLogs.length > 1000) {
      memoryStore.auditLogs = memoryStore.auditLogs.slice(0, 1000);
    }
  },

  /**
   * 감사 로그 조회
   */
  async getAuditLogs(limit = 50, offset = 0): Promise<AdminAuditLog[]> {
    if (redis) {
      const logs = await redis.lrange<AdminAuditLog>(KEYS.AUDIT_LOG, offset, offset + limit - 1);
      return logs || [];
    }
    return memoryStore.auditLogs.slice(offset, offset + limit);
  },

  /**
   * 감사 로그 수 조회
   */
  async getAuditLogCount(): Promise<number> {
    if (redis) {
      return await redis.llen(KEYS.AUDIT_LOG);
    }
    return memoryStore.auditLogs.length;
  },

  // ==================== 유틸리티 ====================

  /**
   * 저장소 타입 확인
   */
  getStorageType(): string {
    return redis ? 'Upstash Redis' : 'In-Memory (Development)';
  },

  /**
   * 헬스 체크
   */
  async healthCheck(): Promise<boolean> {
    if (redis) {
      try {
        await redis.ping();
        return true;
      } catch {
        return false;
      }
    }
    return true; // 메모리 저장소는 항상 OK
  },
};
