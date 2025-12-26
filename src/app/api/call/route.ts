import { NextRequest, NextResponse } from 'next/server';

const HMC_API_URL = "https://stg-apigw-kr.hmg-corp.io/HGERPVENDOR/apiGERPAPIGW/GERPVENDOR/Receive";
const KMC_API_URL = "https://stg-apigw-kr.hmg-corp.io/KGERPVENDOR/apiGERPAPIGW/GERPVENDOR/Receive";

export async function POST(request: NextRequest) {
  try {
    const { company, token, payload } = await request.json();

    const apiUrl = company === 'HMC' ? HMC_API_URL : KMC_API_URL;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accToken': token
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // outData 구조 처리
    const result = data.outData || data;

    return NextResponse.json(result);
  } catch (error) {
    console.error('API call error:', error);
    return NextResponse.json({ error: 'API 호출 실패' }, { status: 500 });
  }
}
