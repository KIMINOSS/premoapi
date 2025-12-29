import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  // Edge runtime에서는 파일 시스템 접근 불가
  // Cloudflare R2 또는 KV 스토리지 사용 필요
  return NextResponse.json(
    { error: 'This endpoint requires server runtime. Use Vercel deployment for file access.' },
    { status: 501 }
  );
}
