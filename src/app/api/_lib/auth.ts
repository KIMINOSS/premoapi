/**
 * JWT 인증 유틸리티
 * Edge Runtime 호환 (Web Crypto API 사용)
 */

import type { JWTPayload, Permission, UserRole } from './types';

// 환경변수에서 비밀키 로드 (기본값 포함)
const DEFAULT_JWT_SECRET = '***REMOVED***';

function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  return new TextEncoder().encode(secret);
}

// Base64URL 인코딩
function base64UrlEncode(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Base64URL 디코딩
function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

// HMAC-SHA256 서명 생성
async function sign(data: string, secret: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    secret.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(data)
  );
  
  return base64UrlEncode(new Uint8Array(signature));
}

// HMAC-SHA256 서명 검증
async function verify(data: string, signature: string, secret: Uint8Array): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    secret.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  const signatureBytes = base64UrlDecode(signature);

  return crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes.buffer as ArrayBuffer,
    new TextEncoder().encode(data)
  );
}

// JWT 헤더 (고정)
const JWT_HEADER = {
  alg: 'HS256',
  typ: 'JWT'
};

/**
 * JWT Access Token 생성
 * @param userId 사용자 ID
 * @param email 이메일
 * @param role 역할
 * @param permissions 권한 목록
 * @param expiresIn 만료 시간 (초, 기본 1시간)
 */
export async function createAccessToken(
  userId: string,
  email: string,
  role: UserRole,
  permissions: Permission[],
  expiresIn = 3600
): Promise<string> {
  const secret = getJWTSecret();
  const now = Math.floor(Date.now() / 1000);
  
  const payload: JWTPayload = {
    sub: userId,
    email,
    role,
    permissions,
    iat: now,
    exp: now + expiresIn
  };
  
  const headerEncoded = base64UrlEncode(JSON.stringify(JWT_HEADER));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerEncoded}.${payloadEncoded}`;
  
  const signature = await sign(data, secret);
  
  return `${data}.${signature}`;
}

/**
 * JWT 토큰 검증 및 페이로드 추출
 * @param token JWT 토큰
 * @returns 페이로드 또는 에러
 */
export async function verifyAccessToken(
  token: string
): Promise<{ valid: true; payload: JWTPayload } | { valid: false; error: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'INVALID_TOKEN_FORMAT' };
    }
    
    const [headerEncoded, payloadEncoded, signature] = parts;
    const secret = getJWTSecret();
    
    // 서명 검증
    const data = `${headerEncoded}.${payloadEncoded}`;
    const isValid = await verify(data, signature, secret);
    
    if (!isValid) {
      return { valid: false, error: 'INVALID_SIGNATURE' };
    }
    
    // 페이로드 파싱
    const payloadBytes = base64UrlDecode(payloadEncoded);
    const payloadJson = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadJson) as JWTPayload;
    
    // 만료 확인
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { valid: false, error: 'TOKEN_EXPIRED' };
    }
    
    return { valid: true, payload };
  } catch (error) {
    console.error('Token verification error:', error);
    return { valid: false, error: 'VERIFICATION_ERROR' };
  }
}

/**
 * 리프레시 토큰 생성 (랜덤 문자열)
 * @returns 32바이트 랜덤 토큰
 */
export function createRefreshToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/**
 * Authorization 헤더에서 Bearer 토큰 추출
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * 권한 확인
 * @param userPermissions 사용자 권한 목록
 * @param requiredPermission 필요한 권한
 */
export function hasPermission(
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean {
  // 와일드카드 권한은 모든 권한 보유
  if (userPermissions.includes('*')) return true;
  
  return userPermissions.includes(requiredPermission);
}

/**
 * 역할 기반 권한 확인
 * @param userRole 사용자 역할
 * @param minRole 최소 필요 역할
 */
export function hasRoleLevel(
  userRole: UserRole,
  minRole: UserRole
): boolean {
  const roleLevels: Record<UserRole, number> = {
    viewer: 1,
    operator: 2,
    admin: 3
  };
  
  return roleLevels[userRole] >= roleLevels[minRole];
}
