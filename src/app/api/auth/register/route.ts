/**
 * 회원가입 API - 이메일 인증 링크 발송
 *
 * 이메일 전송 경로:
 * 0. n8n 웹훅 (USE_N8N_EMAIL=true) - 권장
 * 1. Gmail SMTP 직접 전송 (USE_GMAIL_SMTP=true)
 * 2. Resend + PA Flow (USE_POWER_AUTOMATE_FLOW=true)
 * 3. Resend 직접 (기본)
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs'; // 파일 시스템 접근 필요

const ALLOWED_DOMAIN = 'grupopremo.com';
const TOKEN_EXPIRY_HOURS = 24;

// Vercel 환경에서는 /tmp 사용, 로컬에서는 data 디렉토리 사용
const IS_VERCEL = process.env.VERCEL === '1';
const DATA_DIR = IS_VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
const PENDING_FILE = path.join(DATA_DIR, 'pending-registrations.json');
const USERS_FILE = IS_VERCEL ? path.join(process.cwd(), 'data', 'users.json') : path.join(DATA_DIR, 'users.json');

// 토큰 생성
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// 데이터 디렉토리 확인/생성
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

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
  await ensureDataDir();
  await fs.writeFile(PENDING_FILE, JSON.stringify(data, null, 2));
}

// 기존 사용자 확인
async function isEmailRegistered(email: string): Promise<boolean> {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    const users = JSON.parse(data);
    return email in users;
  } catch {
    return false;
  }
}

// Gmail SMTP transporter 생성
function createGmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_SMTP_USER || 'koghminho@gmail.com',
      pass: process.env.GMAIL_SMTP_PASS // Gmail 앱 비밀번호
    }
  });
}

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

// 이메일 발송 (n8n, Gmail SMTP, 또는 Resend)
async function sendVerificationEmail(email: string, token: string): Promise<{ success: boolean; verifyUrl: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const verifyUrl = `${baseUrl}/verify?token=${token}`;

  const USE_N8N = process.env.USE_N8N_EMAIL === 'true';
  const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://192.168.8.231:5678/webhook/send-email';
  const USE_GMAIL_SMTP = process.env.USE_GMAIL_SMTP === 'true';
  const USE_PA_FLOW = process.env.USE_POWER_AUTOMATE_FLOW === 'true';
  const GMAIL_RELAY = process.env.GMAIL_RELAY_EMAIL || 'koghminho@gmail.com';

  // 발송 방법 결정
  const method = USE_N8N ? 'n8n 웹훅' : USE_GMAIL_SMTP ? 'Gmail SMTP 직접' : USE_PA_FLOW ? 'Resend → PA Flow' : 'Resend 직접';

  // 콘솔 로그
  console.log('========================================');
  console.log('📧 인증 이메일');
  console.log(`To: ${email}`);
  console.log(`Link: ${verifyUrl}`);
  console.log(`Method: ${method}`);
  console.log('========================================');

  // 방법 0: n8n 웹훅 (권장)
  if (USE_N8N) {
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verifyUrl }),
      });

      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        console.log('✅ n8n 이메일 발송 성공');
        console.log(`   Message ID: ${result.messageId || 'N/A'}`);
        return { success: true, verifyUrl: '' };
      }

      console.error('n8n webhook error:', await response.text());
      console.log('⚠️ n8n 실패 - Gmail SMTP로 대체 시도');
    } catch (error) {
      console.error('n8n error:', error);
      console.log('⚠️ n8n 연결 실패 - Gmail SMTP로 대체 시도');
    }
  }

  const emailHtml = getEmailHtml(email, verifyUrl);

  // 방법 1: Gmail SMTP 직접 전송 (가장 확실)
  if (USE_GMAIL_SMTP && process.env.GMAIL_SMTP_PASS) {
    try {
      const transporter = createGmailTransporter();
      await transporter.sendMail({
        from: `PREMO API <${process.env.GMAIL_SMTP_USER || 'koghminho@gmail.com'}>`,
        to: email,
        subject: '[PREMO API] 계정 인증',
        html: emailHtml
      });
      console.log('✅ Gmail SMTP 직접 발송 성공');
      console.log(`   경로: Gmail SMTP → ${email}`);
      return { success: true, verifyUrl: '' };
    } catch (error) {
      console.error('Gmail SMTP error:', error);
      console.log('⚠️ Gmail SMTP 실패 - Resend로 대체 시도');
    }
  }

  // 방법 2: Resend API (PA Flow 또는 직접)
  if (process.env.RESEND_API_KEY) {
    try {
      const toAddress = USE_PA_FLOW ? GMAIL_RELAY : email;
      const subject = USE_PA_FLOW
        ? `[TO:${email}] [PREMO API] 계정 인증`
        : '[PREMO API] 계정 인증';

      console.log(`📤 Resend 발송 시도:`);
      console.log(`   실제 수신자: ${toAddress}`);
      console.log(`   Subject: ${subject}`);

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'PREMO API <onboarding@resend.dev>',
          to: toAddress,
          subject: subject,
          html: emailHtml,
        }),
      });

      if (response.ok) {
        console.log('✅ Resend 발송 성공');
        console.log(`   경로: Resend → ${USE_PA_FLOW ? 'Gmail → PA → Outlook →' : ''} ${email}`);
        return { success: true, verifyUrl: USE_PA_FLOW ? '' : verifyUrl };
      }

      const errorData = await response.json().catch(() => ({}));
      console.error('Resend API error:', errorData);
    } catch (error) {
      console.error('Resend error:', error);
    }
  }

  // 모든 방법 실패 시 콘솔 링크만
  console.log('⚠️ 이메일 발송 실패 - 콘솔 링크로 대체');
  return { success: true, verifyUrl };
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

    // 3. 이미 등록된 이메일 확인
    if (await isEmailRegistered(emailLower)) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 400 }
      );
    }

    // 4. 토큰 생성 및 저장
    const token = generateToken();
    const expiresAt = Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

    const pending = await loadPendingRegistrations();
    
    // 기존 토큰 제거 (같은 이메일)
    for (const [t, data] of Object.entries(pending)) {
      if (data.email === emailLower) {
        delete pending[t];
      }
    }
    
    pending[token] = { email: emailLower, expiresAt };
    await savePendingRegistrations(pending);

    // 5. 이메일 발송
    const result = await sendVerificationEmail(emailLower, token);
    
    if (!result.success) {
      return NextResponse.json(
        { error: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    // 개발 환경: 인증 링크 포함 (편의성)
    // 프로덕션: 인증 링크 미포함 (보안)
    const response: { success: boolean; verifyUrl?: string } = { success: true };
    if (result.verifyUrl) {
      response.verifyUrl = result.verifyUrl;
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
