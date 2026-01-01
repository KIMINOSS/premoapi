/**
 * Stateless 토큰 암호화/복호화 유틸리티
 * 데이터베이스 없이 토큰만으로 인증 처리
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

// 환경변수에서 시크릿 키 가져오기
function getSecretKey(): string {
  const secret = process.env.JWT_SECRET || 'premo-default-secret-key-change-in-production';
  return secret;
}

// 시크릿 키를 CryptoKey로 변환
async function deriveKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('premo-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// 데이터 암호화
export async function encrypt(data: object): Promise<string> {
  const key = await deriveKey(getSecretKey());
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(JSON.stringify(data))
  );

  // IV + 암호화된 데이터를 Base64로 인코딩
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return Buffer.from(combined).toString('base64url');
}

// 데이터 복호화
export async function decrypt<T>(token: string): Promise<T | null> {
  try {
    const key = await deriveKey(getSecretKey());
    const combined = Buffer.from(token, 'base64url');

    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted)) as T;
  } catch {
    return null;
  }
}

// 검증 토큰 생성 (이메일 + 만료시간)
export async function createVerificationToken(email: string, expiresInHours = 24): Promise<string> {
  const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;
  return encrypt({ email, expiresAt });
}

// 검증 토큰 확인
export async function verifyToken(token: string): Promise<{ email: string; expiresAt: number } | null> {
  const data = await decrypt<{ email: string; expiresAt: number }>(token);

  if (!data) return null;
  if (Date.now() > data.expiresAt) return null;

  return data;
}
