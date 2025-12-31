/**
 * 비밀번호 해싱 유틸리티
 * Edge Runtime 호환 (Web Crypto API 기반 PBKDF2)
 * 
 * bcrypt는 Node.js 전용이므로 Edge Runtime에서는 PBKDF2 사용
 */

// 해시 설정
const HASH_ALGORITHM = 'SHA-256';
const ITERATIONS = 100000;   // OWASP 권장 최소값
const KEY_LENGTH = 32;       // 256 bits
const SALT_LENGTH = 16;      // 128 bits

/**
 * 랜덤 Salt 생성
 */
function generateSalt(): Uint8Array {
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  return salt;
}

/**
 * Uint8Array를 Hex 문자열로 변환
 */
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hex 문자열을 Uint8Array로 변환
 */
function fromHex(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g);
  if (!matches) return new Uint8Array(0);
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

/**
 * PBKDF2로 비밀번호 해시 생성
 * 형식: iterations$salt$hash (모두 hex)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  
  // 비밀번호를 키로 변환
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // PBKDF2로 해시 생성
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM
    },
    passwordKey,
    KEY_LENGTH * 8  // 비트 단위
  );
  
  const hash = new Uint8Array(hashBuffer);
  
  // 형식: iterations$salt$hash
  return `${ITERATIONS}$${toHex(salt)}$${toHex(hash)}`;
}

/**
 * 비밀번호 검증
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;
    
    const [iterStr, saltHex, hashHex] = parts;
    const iterations = parseInt(iterStr, 10);
    const salt = fromHex(saltHex);
    const expectedHash = fromHex(hashHex);
    
    if (isNaN(iterations) || iterations < 1) return false;
    if (salt.length === 0 || expectedHash.length === 0) return false;
    
    // 비밀번호를 키로 변환
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    // PBKDF2로 해시 생성
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer,
        iterations,
        hash: HASH_ALGORITHM
      },
      passwordKey,
      expectedHash.length * 8  // 비트 단위
    );
    
    const computedHash = new Uint8Array(hashBuffer);
    
    // 타이밍 공격 방지를 위한 상수 시간 비교
    if (computedHash.length !== expectedHash.length) return false;
    
    let result = 0;
    for (let i = 0; i < computedHash.length; i++) {
      result |= computedHash[i] ^ expectedHash[i];
    }
    
    return result === 0;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * 비밀번호 강도 검증
 * @returns 유효하면 null, 아니면 에러 메시지
 */
export function validatePasswordStrength(password: string): string | null {
  // 4자리 숫자 PIN 형식만 허용
  if (password.length !== 4) {
    return '비밀번호는 4자리여야 합니다.';
  }
  
  if (!/^\d{4}$/.test(password)) {
    return '비밀번호는 숫자 4자리여야 합니다.';
  }
  
  return null;
}
