import { NextRequest, NextResponse } from 'next/server';

const OAUTH_URL = "https://stg-apigw-kr.hmg-corp.io/oauth/token";
const HMC_CLIENT_ID = process.env.HMC_CLIENT_ID!;
const HMC_SECRET_KEY = process.env.HMC_SECRET_KEY!;
const KMC_CLIENT_ID = process.env.KMC_CLIENT_ID!;
const KMC_SECRET_KEY = process.env.KMC_SECRET_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { company } = await request.json();

    const clientId = company === 'HMC' ? HMC_CLIENT_ID : KMC_CLIENT_ID;
    const secretKey = company === 'HMC' ? HMC_SECRET_KEY : KMC_SECRET_KEY;

    const credentials = Buffer.from(`${clientId}:${secretKey}`).toString('base64');

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
