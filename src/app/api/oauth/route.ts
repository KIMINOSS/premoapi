import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const OAUTH_URL = "https://stg-apigw-kr.hmg-corp.io/oauth/token";

export async function POST(request: NextRequest) {
  try {
    const { company } = await request.json();

    const clientId = company === 'HMC' 
      ? process.env.HMC_CLIENT_ID! 
      : process.env.KMC_CLIENT_ID!;
    const secretKey = company === 'HMC' 
      ? process.env.HMC_SECRET_KEY! 
      : process.env.KMC_SECRET_KEY!;

    const credentials = btoa(`${clientId}:${secretKey}`);

    const response = await fetch(OAUTH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'OAuth 실패' }, { status: response.status });
    }

    const data = await response.json();
    const token = data.accToken || data.access_token;

    return NextResponse.json({ token, company });
  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.json({ error: '토큰 발급 실패' }, { status: 500 });
  }
}
