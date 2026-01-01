/**
 * 이메일 검증 및 계정 생성 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// Vercel 환경에서는 /tmp 사용
const IS_VERCEL = process.env.VERCEL === '1';
const DATA_DIR = IS_VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
const PENDING_FILE = path.join(DATA_DIR, 'pending-registrations.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// 대기 중인 등록 목록 로드
async function loadPendingRegistrations(): Promise<Record<string, { email: string; expiresAt: number }>> {
  try {
    const data = await fs.readFile(PENDING_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// 대기 중인 등록 목록 저장
async function savePendingRegistrations(data: Record<string, { email: string; expiresAt: number }>) {
  await fs.writeFile(PENDING_FILE, JSON.stringify(data, null, 2));
}

// 사용자 목록 로드
async function loadUsers(): Promise<Record<string, { passwordHash: string; name: string; createdAt: string }>> {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// 사용자 목록 저장
async function saveUsers(data: Record<string, { passwordHash: string; name: string; createdAt: string }>) {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
  await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
}

// 간단한 비밀번호 해시 (4자리 PIN용)
function hashPassword(password: string): string {
  // 개발용 간단 해시 (실제로는 더 강력한 해시 사용)
  return Buffer.from(password + '_premo_salt').toString('base64');
}

// GET: 토큰 검증
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: '토큰이 없습니다.' },
      { status: 400 }
    );
  }

  const pending = await loadPendingRegistrations();
  const registration = pending[token];

  if (!registration) {
    return NextResponse.json(
      { error: '유효하지 않은 링크입니다.' },
      { status: 400 }
    );
  }

  if (Date.now() > registration.expiresAt) {
    // 만료된 토큰 삭제
    delete pending[token];
    await savePendingRegistrations(pending);
    
    return NextResponse.json(
      { error: '링크가 만료되었습니다. 다시 가입해주세요.' },
      { status: 400 }
    );
  }

  return NextResponse.json({ email: registration.email });
}

// POST: 계정 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body as { token: string; password: string };

    // 1. 입력 검증
    if (!token || !password) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 2. 비밀번호 형식 검증 (4자리 숫자)
    if (!/^\d{4}$/.test(password)) {
      return NextResponse.json(
        { error: '비밀번호는 숫자 4자리여야 합니다.' },
        { status: 400 }
      );
    }

    // 3. 토큰 검증
    const pending = await loadPendingRegistrations();
    const registration = pending[token];

    if (!registration) {
      return NextResponse.json(
        { error: '유효하지 않은 링크입니다.' },
        { status: 400 }
      );
    }

    if (Date.now() > registration.expiresAt) {
      delete pending[token];
      await savePendingRegistrations(pending);
      
      return NextResponse.json(
        { error: '링크가 만료되었습니다.' },
        { status: 400 }
      );
    }

    // 4. 사용자 생성
    const users = await loadUsers();
    const email = registration.email;

    if (users[email]) {
      return NextResponse.json(
        { error: '이미 등록된 계정입니다.' },
        { status: 400 }
      );
    }

    // 이름은 이메일 앞부분에서 추출
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    users[email] = {
      passwordHash: hashPassword(password),
      name,
      createdAt: new Date().toISOString(),
    };

    await saveUsers(users);

    // 5. 대기 목록에서 제거
    delete pending[token];
    await savePendingRegistrations(pending);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
