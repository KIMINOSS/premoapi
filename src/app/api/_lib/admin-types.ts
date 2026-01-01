/**
 * 관리자 페이지 타입 정의
 */

import type { UserRole, Permission, AuditAction } from './types';

// 공지사항 타입
export type AnnouncementType = 'info' | 'warning' | 'urgent';

// 공지사항 표시 위치
export type DisplayLocation = 'login' | 'dashboard';

// 공지사항 엔티티
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  displayLocations: DisplayLocation[];
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 공지사항 생성 요청
export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  type?: AnnouncementType;
  displayLocations?: DisplayLocation[];
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

// 공지사항 수정 요청
export interface UpdateAnnouncementRequest {
  title?: string;
  content?: string;
  type?: AnnouncementType;
  displayLocations?: DisplayLocation[];
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

// 메뉴 그룹
export interface MenuGroup {
  id: string;
  label: string;
  order: number;
}

// 메뉴 항목
export interface MenuItem {
  id: string;
  label: string;
  group: string;
  order: number;
  visible: boolean;
  icon?: string;
  path?: string;
}

// 메뉴 설정
export interface MenuConfig {
  version: number;
  groups: MenuGroup[];
  items: MenuItem[];
  updatedBy: string;
  updatedAt: string;
}

// 메뉴 설정 업데이트 요청
export interface UpdateMenuConfigRequest {
  groups?: MenuGroup[];
  items?: MenuItem[];
}

// 관리자 감사 로그 액션 (확장)
export type AdminAuditAction =
  | AuditAction
  | 'create_announcement'
  | 'update_announcement'
  | 'delete_announcement'
  | 'update_menu_config'
  | 'admin_login'
  | 'admin_logout';

// 관리자 감사 로그
export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: AdminAuditAction;
  resource: string | null;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

// 관리자 대시보드 통계
export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  totalAnnouncements: number;
  activeAnnouncements: number;
  recentLogins: number;
  lastUpdated: string;
}

// 사용자 관리용 확장 타입
export interface AdminUserView {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'locked';
  company: string | null;
  department: string | null;
  permissions: Permission[];
  loginAttempts: number;
  lastLoginAt: string | null;
  createdAt: string;
}

// 사용자 상태 변경 요청
export interface UpdateUserStatusRequest {
  status: 'active' | 'inactive' | 'locked';
  reason?: string;
}

// 사용자 역할 변경 요청
export interface UpdateUserRoleRequest {
  role: UserRole;
  permissions?: Permission[];
}

// Redis 키 상수
export const REDIS_KEYS = {
  ANNOUNCEMENTS: 'admin:announcements',
  MENU_CONFIG: 'admin:menus',
  AUDIT_LOG: 'admin:audit',
  USER_SESSIONS: 'admin:sessions',
} as const;
