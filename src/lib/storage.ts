/**
 * 영구 저장소 - 우선순위: Upstash Redis > Pi Redis Proxy > 파일 시스템
 * 환경변수로 자동 선택
 */

import { Redis } from '@upstash/redis';
import { promises as fs } from 'fs';
import path from 'path';

// Upstash Redis 클라이언트 (환경변수가 있을 때만 사용)
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Pi Redis 프록시 URL (Cloudflare Tunnel)
const REDIS_PROXY_URL = process.env.REDIS_PROXY_URL;

// Vercel 환경에서는 /tmp 사용 (fallback)
const IS_VERCEL = process.env.VERCEL === '1';
const DATA_DIR = IS_VERCEL ? '/tmp' : path.join(process.cwd(), 'data');

// Pi Redis 프록시 헬퍼
async function proxyGet(email: string): Promise<User | null> {
  if (!REDIS_PROXY_URL) return null;
  try {
    const res = await fetch(`${REDIS_PROXY_URL}/user?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch (e) {
    console.error('Redis proxy get error:', e);
    return null;
  }
}

async function proxySet(email: string, user: User): Promise<boolean> {
  if (!REDIS_PROXY_URL) return false;
  try {
    const res = await fetch(`${REDIS_PROXY_URL}/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ...user }),
    });
    return res.ok;
  } catch (e) {
    console.error('Redis proxy set error:', e);
    return false;
  }
}

async function proxyExists(email: string): Promise<boolean | null> {
  if (!REDIS_PROXY_URL) return null;
  try {
    const res = await fetch(`${REDIS_PROXY_URL}/user/exists?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.exists;
  } catch (e) {
    console.error('Redis proxy exists error:', e);
    return null;
  }
}

// 파일 시스템 헬퍼
async function ensureDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readFile(filename: string): Promise<Record<string, unknown>> {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, filename), 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeFile(filename: string, data: Record<string, unknown>) {
  await ensureDir();
  await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

// 사용자 타입
export interface User {
  passwordHash: string;
  name: string;
  createdAt: string;
}

// 저장소 인터페이스 (우선순위: Upstash > Pi Proxy > 파일)
export const storage = {
  // 사용자 조회
  async getUser(email: string): Promise<User | null> {
    // 1. Upstash Redis
    if (redis) {
      return await redis.hget<User>('users', email);
    }
    // 2. Pi Redis 프록시
    if (REDIS_PROXY_URL) {
      return await proxyGet(email);
    }
    // 3. 파일 시스템
    const users = await readFile('users.json') as Record<string, User>;
    return users[email] || null;
  },

  // 사용자 저장
  async setUser(email: string, user: User): Promise<void> {
    // 1. Upstash Redis
    if (redis) {
      await redis.hset('users', { [email]: user });
      return;
    }
    // 2. Pi Redis 프록시
    if (REDIS_PROXY_URL) {
      const success = await proxySet(email, user);
      if (success) return;
      console.warn('Redis proxy failed, falling back to file');
    }
    // 3. 파일 시스템
    const users = await readFile('users.json') as Record<string, User>;
    users[email] = user;
    await writeFile('users.json', users);
  },

  // 사용자 존재 확인
  async userExists(email: string): Promise<boolean> {
    // 1. Upstash Redis
    if (redis) {
      const exists = await redis.hexists('users', email);
      return exists === 1;
    }
    // 2. Pi Redis 프록시
    if (REDIS_PROXY_URL) {
      const exists = await proxyExists(email);
      if (exists !== null) return exists;
    }
    // 3. 파일 시스템
    const user = await this.getUser(email);
    return user !== null;
  },

  // 모든 사용자 조회
  async getAllUsers(): Promise<Record<string, User>> {
    if (redis) {
      const users = await redis.hgetall<Record<string, User>>('users');
      return users || {};
    }
    // 프록시는 getAllUsers 미지원, 파일로 fallback
    return await readFile('users.json') as Record<string, User>;
  },

  // 저장소 타입 확인
  getStorageType(): string {
    if (redis) return 'Upstash Redis';
    if (REDIS_PROXY_URL) return 'Pi Redis (Cloudflare Tunnel)';
    return IS_VERCEL ? 'Vercel /tmp (임시)' : '로컬 파일';
  },
};
