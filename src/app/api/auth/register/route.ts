/**
 * 회원가입 API - Stateless 토큰 + Upstash Redis 영구 저장
 */

import { NextRequest, NextResponse } from 'next/server';
import { createVerificationToken } from '@/lib/crypto';
import { storage } from '@/lib/storage';

export const runtime = 'nodejs';

const ALLOWED_DOMAIN = 'grupopremo.com';
const IS_VERCEL = process.env.VERCEL === '1';

// 이메일 HTML 템플릿
function getEmailHtml(email: string, verifyUrl: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #ef4444;">PREMO API</h1>
      <p>안녕하세요, <strong>${email}</strong>님</p>
      <p>아래 버튼을 클릭하여 계정 등록을 완료해주세요.</p>
      <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
        계정 등록하기
      </a>
      <p style="color: #666; font-size: 14px;">이 링크는 24시간 동안 유효합니다.</p>
      <p style="color: #666; font-size: 14px;">본인이 요청하지 않았다면 이 이메일을 무시하세요.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">
        이 이메일은 PREMO API 시스템에서 자동 발송되었습니다.<br>
        문의: minho.kim@grupopremo.com
      </p>
    </div>
  `;
}

// 이메일 발송
async function sendVerificationEmail(email: string, verifyUrl: string): Promise<boolean> {
  const emailHtml = getEmailHtml(email, verifyUrl);

  console.log('========================================');
  console.log('📧 인증 이메일 발송');
  console.log(`To: ${email}`);
  console.log(`Link: ${verifyUrl}`);
  console.log(`Storage: ${storage.getStorageType()}`);
  console.log('========================================');

  // Resend API 직접 사용
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'PREMO API <onboarding@resend.dev>',
          to: email,
          subject: '[PREMO API] 계정 인증',
          html: emailHtml,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Resend 이메일 발송 성공:', result.id);
        return true;
      }

      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Resend 에러:', errorData);
    } catch (error) {
      console.error('❌ Resend 발송 실패:', error);
    }
  }

  // n8n 웹훅 (로컬 환경용)
  if (!IS_VERCEL && process.env.USE_N8N_EMAIL === 'true') {
    try {
      const n8nUrl = process.env.N8N_WEBHOOK_URL || 'http://192.168.8.231:5678/webhook/send-email';
      const response = await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verifyUrl }),
      });

      if (response.ok) {
        console.log('✅ n8n 이메일 발송 성공');
        return true;
      }
    } catch (error) {
      console.error('n8n 발송 실패:', error);
    }
  }

  console.log('⚠️ 이메일 발송 실패 - 콘솔 링크 사용');
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body as { email: string };

    // 1. 이메일 형식 검증
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: '이메일을 입력해주세요.' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // 2. 도메인 검증
    const domain = emailLower.split('@')[1];
    if (domain !== ALLOWED_DOMAIN) {
      return NextResponse.json(
        { error: `@${ALLOWED_DOMAIN} 이메일만 가입 가능합니다.` },
        { status: 400 }
      );
    }

    // 3. 이미 등록된 이메일 확인 (Upstash Redis 또는 파일)
    if (await storage.userExists(emailLower)) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 400 }
      );
    }

    // 4. Stateless 암호화 토큰 생성
    const token = await createVerificationToken(emailLower, 24);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/verify?token=${encodeURIComponent(token)}`;

    // 5. 이메일 발송
    await sendVerificationEmail(emailLower, verifyUrl);

    // 개발 환경에서는 인증 링크 포함
    const response: { success: boolean; verifyUrl?: string; storage?: string } = { success: true };
    if (!IS_VERCEL) {
      response.verifyUrl = verifyUrl;
      response.storage = storage.getStorageType();
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
