/**
 * 입력 검증 유틸리티
 */

import type { 
  CompanyType, 
  UserRole, 
  UserStatus, 
  Permission,
  CreateUserRequest,
  UpdateUserRequest,
  LoginRequest
} from './types';

// 유효값 목록
const VALID_COMPANIES: CompanyType[] = ['HMC', 'KMC'];
const VALID_ROLES: UserRole[] = ['admin', 'operator', 'viewer'];
const VALID_STATUSES: UserStatus[] = ['active', 'inactive', 'locked'];
const VALID_PERMISSIONS: Permission[] = [
  'read:api',
  'write:api',
  'export:data',
  'admin:users',
  'admin:settings',
  '*'
];

// 이메일 정규식 (RFC 5322 간소화 버전)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * 검증 결과
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 이메일 검증
 */
export function validateEmail(email: unknown): email is string {
  return typeof email === 'string' && EMAIL_REGEX.test(email);
}

/**
 * 회사 코드 검증
 */
export function validateCompany(company: unknown): company is CompanyType {
  return typeof company === 'string' && VALID_COMPANIES.includes(company as CompanyType);
}

/**
 * 역할 검증
 */
export function validateRole(role: unknown): role is UserRole {
  return typeof role === 'string' && VALID_ROLES.includes(role as UserRole);
}

/**
 * 상태 검증
 */
export function validateStatus(status: unknown): status is UserStatus {
  return typeof status === 'string' && VALID_STATUSES.includes(status as UserStatus);
}

/**
 * 권한 검증
 */
export function validatePermission(permission: unknown): permission is Permission {
  return typeof permission === 'string' && VALID_PERMISSIONS.includes(permission as Permission);
}

/**
 * 권한 배열 검증
 */
export function validatePermissions(permissions: unknown): permissions is Permission[] {
  if (!Array.isArray(permissions)) return false;
  return permissions.every(p => validatePermission(p));
}

/**
 * 이름 검증 (2-50자)
 */
export function validateName(name: unknown): name is string {
  return typeof name === 'string' && name.length >= 2 && name.length <= 50;
}

/**
 * 부서명 검증 (선택, 1-100자)
 */
export function validateDepartment(department: unknown): department is string | undefined {
  if (department === undefined || department === null || department === '') return true;
  return typeof department === 'string' && department.length >= 1 && department.length <= 100;
}

/**
 * 로그인 요청 검증
 */
export function validateLoginRequest(body: unknown): ValidationResult {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['요청 본문이 객체여야 합니다.'] };
  }

  const { email, password } = body as Record<string, unknown>;

  if (!email || typeof email !== 'string') {
    errors.push('이메일은 필수 입력값입니다.');
  } else if (email !== 'admin' && !validateEmail(email)) {
    // admin 바이패스는 이메일 형식 검증 건너뜀
    errors.push('유효한 이메일 형식이 아닙니다.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('비밀번호는 필수 입력값입니다.');
  } else if (password.length < 1) {
    errors.push('비밀번호를 입력해주세요.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 사용자 생성 요청 검증
 */
export function validateCreateUserRequest(body: unknown): ValidationResult {
  const errors: string[] = [];
  
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['요청 본문이 객체여야 합니다.'] };
  }
  
  const { email, password, name, role, company, department, permissions } = body as Record<string, unknown>;
  
  // 필수 필드
  if (!validateEmail(email)) {
    errors.push('유효한 이메일 형식이 아닙니다.');
  }
  
  if (!password || typeof password !== 'string') {
    errors.push('비밀번호는 필수 입력값입니다.');
  }
  
  if (!validateName(name)) {
    errors.push('이름은 2-50자여야 합니다.');
  }
  
  // 선택 필드
  if (role !== undefined && !validateRole(role)) {
    errors.push('역할은 admin, operator, viewer 중 하나여야 합니다.');
  }
  
  if (company !== undefined && company !== null && company !== '' && !validateCompany(company)) {
    errors.push('회사는 HMC 또는 KMC여야 합니다.');
  }
  
  if (!validateDepartment(department)) {
    errors.push('부서명은 1-100자여야 합니다.');
  }
  
  if (permissions !== undefined && !validatePermissions(permissions)) {
    errors.push('유효하지 않은 권한이 포함되어 있습니다.');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * 사용자 수정 요청 검증
 */
export function validateUpdateUserRequest(body: unknown): ValidationResult {
  const errors: string[] = [];
  
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['요청 본문이 객체여야 합니다.'] };
  }
  
  const { name, role, company, department, permissions, status } = body as Record<string, unknown>;
  
  // 모든 필드가 선택적이지만, 있으면 검증
  if (name !== undefined && !validateName(name)) {
    errors.push('이름은 2-50자여야 합니다.');
  }
  
  if (role !== undefined && !validateRole(role)) {
    errors.push('역할은 admin, operator, viewer 중 하나여야 합니다.');
  }
  
  if (company !== undefined && company !== null && company !== '' && !validateCompany(company)) {
    errors.push('회사는 HMC 또는 KMC여야 합니다.');
  }
  
  if (!validateDepartment(department)) {
    errors.push('부서명은 1-100자여야 합니다.');
  }
  
  if (permissions !== undefined && !validatePermissions(permissions)) {
    errors.push('유효하지 않은 권한이 포함되어 있습니다.');
  }
  
  if (status !== undefined && !validateStatus(status)) {
    errors.push('상태는 active, inactive, locked 중 하나여야 합니다.');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * 타입 가드: LoginRequest
 */
export function isLoginRequest(body: unknown): body is LoginRequest {
  const result = validateLoginRequest(body);
  return result.valid;
}

/**
 * 타입 가드: CreateUserRequest
 */
export function isCreateUserRequest(body: unknown): body is CreateUserRequest {
  const result = validateCreateUserRequest(body);
  return result.valid;
}

/**
 * 타입 가드: UpdateUserRequest
 */
export function isUpdateUserRequest(body: unknown): body is UpdateUserRequest {
  const result = validateUpdateUserRequest(body);
  return result.valid;
}
