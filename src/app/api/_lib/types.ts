/**
 * 사용자 관리 API 타입 정의
 */

// 회사 코드
export type CompanyType = 'HMC' | 'KMC';

// 사용자 역할
export type UserRole = 'admin' | 'operator' | 'viewer';

// 사용자 상태
export type UserStatus = 'active' | 'inactive' | 'locked';

// 권한 목록
export type Permission =
  | 'read:api'
  | 'write:api'
  | 'export:data'
  | 'admin:users'
  | 'admin:settings'
  | '*';

// 사용자 엔티티
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  company: CompanyType | null;
  department: string | null;
  permissions: Permission[];
  loginAttempts: number;
  requirePasswordChange: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  deletedAt: string | null;
}

// 사용자 생성 요청
export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  company?: CompanyType;
  department?: string;
  permissions?: Permission[];
}

// 사용자 수정 요청
export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
  company?: CompanyType;
  department?: string;
  permissions?: Permission[];
  status?: UserStatus;
}

// 로그인 요청
export interface LoginRequest {
  email: string;
  password: string;
}

// 로그인 응답
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: PublicUser;
}

// 공개 사용자 정보 (민감 정보 제외)
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company: CompanyType | null;
  department: string | null;
  permissions: Permission[];
}

// JWT 페이로드
export interface JWTPayload {
  sub: string;           // 사용자 ID
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;           // 발급 시간
  exp: number;           // 만료 시간
}

// 리프레시 토큰 데이터
export interface RefreshTokenData {
  userId: string;
  tokenId: string;
  deviceInfo: string;
  createdAt: string;
}

// API 에러 응답
export interface APIError {
  error: string;
  code: string;
  details?: unknown;
}

// 페이지네이션 정보
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 목록 응답
export interface ListResponse<T> {
  data: T[];
  pagination: Pagination;
}

// 감사 로그 액션
export type AuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'create_user'
  | 'update_user'
  | 'delete_user'
  | 'api_call'
  | 'export_data'
  | 'password_change';

// 감사 로그 엔티티
export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resource: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}
