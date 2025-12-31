/**
 * 로그아웃 API
 * POST /api/auth/logout
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken, verifyAccessToken } from '../../_lib/auth';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // 1. 토큰 추출 (헤더 또는 쿠키)
    const authHeader = request.headers.get('Authorization');
    const cookieToken = request.cookies.get('access_token')?.value;
    const token = extractBearerToken(authHeader) || cookieToken;

    if (token) {
      // 2. 토큰 검증 (선택적, 만료된 토큰으로도 로그아웃 가능)
      const result = await verifyAccessToken(token);
      
      if (result.valid) {
        // TODO: 토큰을 블랙리스트에 추가 (KV Store)
        // await kv.set(`blacklist:${result.payload.sub}:${token.slice(-10)}`, '1', { ex: result.payload.exp - Math.floor(Date.now() / 1000) });
        
        console.log(`User ${result.payload.sub} logged out`);
      }
    }

    // 3. 응답 생성 및 쿠키 삭제
    const res = NextResponse.json({
      success: true,
      message: '로그아웃 되었습니다.'
    });

    // Access Token 쿠키 삭제
    res.cookies.set('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    // Refresh Token 쿠키 삭제
    res.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/api/auth'
    });

    return res;
  } catch (error) {
    console.error('Logout error:', error instanceof Error ? error.message : error);
    // 로그아웃은 실패해도 쿠키는 삭제
    const res = NextResponse.json({
      success: true,
      message: '로그아웃 되었습니다.'
    });
    
    res.cookies.set('access_token', '', { maxAge: 0, path: '/' });
    res.cookies.set('refresh_token', '', { maxAge: 0, path: '/api/auth' });
    
    return res;
  }
}
