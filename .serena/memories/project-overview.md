# PREMOAPI 프로젝트 개요

## 프로젝트 정보
- **이름**: PREMOAPI (HKMC/KMC MM Module API Caller)
- **위치**: `/home/kogh/mino/premoapi-local`
- **목적**: 현대자동차(HMC)와 기아(KMC)의 MM 모듈 REST API 테스트 및 호출 대시보드

## 기술 스택
- **프레임워크**: Next.js 15.5.9 (App Router)
- **UI**: React 19.2.3 + TailwindCSS 4
- **언어**: TypeScript 5 (strict mode)
- **데이터 테이블**: @tanstack/react-table 8.x
- **엑셀 처리**: xlsx 0.18.5
- **런타임**: Edge Runtime (Cloudflare Workers 호환)
- **배포**: Cloudflare Pages + Vercel

## 핵심 기능
1. **OAuth 인증**: HMC/KMC API Gateway OAuth 2.0 토큰 발급
2. **API 호출**: 15개 인터페이스(MMPM8001~MMPM8015) 지원
3. **데이터 조회**: 품목 정보, 입고 실적, 소요량, 재고 등
4. **데이터 생성/조정**: ASN 출하 생성(8009), 재고 조정(8012, 8015)

## API 인터페이스 목록
| ID | 기능 | 비고 |
|----|------|------|
| MMPM8001 | 품목 정보 | 조회 |
| MMPM8002 | 검수 합격 통보서 | 조회 |
| MMPM8003 | 입고 실적 조회 | 조회 |
| MMPM8004 | 월 검수 정보 | 조회 |
| MMPM8005 | 사급 매출 현황 | 조회 |
| MMPM8006 | 일별 소요량 | 조회 |
| MMPM8007 | 주별 소요량 | 조회 |
| MMPM8008 | 부품 출하 조회 | 조회 |
| MMPM8009 | 부품 출하 생성 | 생성 (HMC Only) |
| MMPM8010 | 부품 소급 정산 | 조회 |
| MMPM8011 | 유상사급 재고 조회 | 조회 |
| MMPM8012 | 유상사급 재고 조정 | 조정 |
| MMPM8013 | 전주공장 간판발주 | 조회 (HMC Only) |
| MMPM8014 | 업체자율 재고 조회 | 조회 |
| MMPM8015 | 업체자율 재고 조정 | 조정 |

## 프로젝트 구조
```
src/app/
├── page.tsx                 # 랜딩 페이지
├── layout.tsx               # 루트 레이아웃
├── globals.css              # 글로벌 스타일
├── dashboard/
│   ├── page.tsx             # 메인 대시보드 (798줄)
│   ├── types/index.ts       # TypeScript 타입 정의
│   ├── config/
│   │   ├── interfaces.ts    # 인터페이스 설정
│   │   ├── plants.ts        # 공장 목록 (HMC/KMC)
│   │   ├── labels.ts        # 필드/파라미터 라벨
│   │   ├── codes.ts         # 코드 정의
│   │   └── fieldOrder.ts    # 필드 순서/필수값
│   └── utils/
│       └── format.ts        # 유틸리티 함수
└── api/
    ├── oauth/route.ts       # OAuth 토큰 발급
    ├── call/route.ts        # API 호출 프록시
    └── responses/[filename]/route.ts  # 응답 파일 다운로드
```

## 환경 설정
- `.env.local`: 환경 변수 (OAuth 자격 증명)
- `wrangler.toml`: Cloudflare Pages 설정
