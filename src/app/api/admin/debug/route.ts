/**
 * 관리자 환경변수 디버깅 (임시)
 * 배포 후 삭제 예정
 */

import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    env: {
      ADMIN_EMAIL: process.env.ADMIN_EMAIL ? 'SET' : 'NOT_SET',
      ADMIN_EMAIL_LENGTH: process.env.ADMIN_EMAIL?.length || 0,
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'SET' : 'NOT_SET',
      ADMIN_PASSWORD_LENGTH: process.env.ADMIN_PASSWORD?.length || 0,
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT_SET',
      JWT_SECRET_LENGTH: process.env.JWT_SECRET?.length || 0,
      JWT_SECRET_PREVIEW: process.env.JWT_SECRET?.substring(0, 5) || 'NONE',
    },
    timestamp: new Date().toISOString(),
  });
}
