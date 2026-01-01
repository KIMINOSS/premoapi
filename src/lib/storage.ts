/**
 * 영구 저장소 - Upstash Redis 또는 파일 시스템
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

// Vercel 환경에서는 /tmp 사용 (fallback)
const IS_VERCEL = process.env.VERCEL === '1';
const DATA_DIR = IS_VERCEL ? '/tmp' : path.join(process.cwd(), 'data');

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

// 저장소 인터페이스
export const storage = {
  // 사용자 관련
  async getUser(email: string): Promise<User | null> {
    if (redis) {
      return await redis.hget<User>('users', email);
    }
    const users = await readFile('users.json') as Record<string, User>;
    return users[email] || null;
  },

  async setUser(email: string, user: User): Promise<void> {
    if (redis) {
      await redis.hset('users', { [email]: user });
      return;
    }
    const users = await readFile('users.json') as Record<string, User>;
    users[email] = user;
    await writeFile('users.json', users);
  },

  async userExists(email: string): Promise<boolean> {
    const user = await this.getUser(email);
    return user !== null;
  },

  async getAllUsers(): Promise<Record<string, User>> {
    if (redis) {
      const users = await redis.hgetall<Record<string, User>>('users');
      return users || {};
    }
    return await readFile('users.json') as Record<string, User>;
  },

  // 저장소 타입 확인
  getStorageType(): string {
    return redis ? 'Upstash Redis' : (IS_VERCEL ? 'Vercel /tmp (임시)' : '로컬 파일');
  },
};
