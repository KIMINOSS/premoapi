# PREMOAPI 코드 스타일 가이드

## TypeScript 설정
- **Strict Mode**: 활성화 (`"strict": true`)
- **Target**: ES2017
- **Module Resolution**: Bundler
- **Path Alias**: `@/*` → `./src/*`

## 네이밍 컨벤션

### 파일명
- **컴포넌트**: PascalCase (예: `DataTable.tsx`)
- **유틸리티**: camelCase (예: `format.ts`)
- **타입 정의**: `index.ts` 또는 `types.ts`
- **설정 파일**: camelCase (예: `interfaces.ts`)

### 변수/함수
- **상수**: UPPER_SNAKE_CASE (예: `HMC_INTERFACES`)
- **함수**: camelCase (예: `validateRequiredParams`)
- **컴포넌트**: PascalCase (예: `DashboardPage`)

### 타입
- **Interface**: PascalCase + 접미사 (예: `InterfaceDefinition`)
- **Type Alias**: PascalCase (예: `CompanyCode`)

## 코드 구조

### 컴포넌트 구조
```typescript
// 1. imports
import { useState } from 'react';
import type { MyType } from './types';

// 2. 타입/상수
type Props = { ... };
const CONSTANTS = ...;

// 3. 컴포넌트
export default function Component({ props }: Props) {
  // 3.1 상태
  const [state, setState] = useState();
  
  // 3.2 핸들러
  const handleClick = () => { ... };
  
  // 3.3 렌더링
  return <div>...</div>;
}
```

### API Route 구조
```typescript
// Edge Runtime 선언
export const runtime = 'edge';

// HTTP 메서드별 핸들러
export async function POST(request: Request) {
  // 1. 입력 검증
  // 2. 비즈니스 로직
  // 3. 응답 반환
}
```

## 스타일링

### TailwindCSS 4
- 유틸리티 클래스 우선
- 커스텀 CSS 최소화
- 다크 모드: `dark:` 접두사

### 컬러 팔레트
- Primary: `blue-500/600`
- Success: `green-500`
- Error: `red-500`
- Background: `gray-50` / `dark:gray-900`

## 린팅 규칙

### ESLint 설정
- `next/core-web-vitals`
- `next/typescript`

### 주요 규칙
- 미사용 변수 경고
- any 타입 지양
- React Hooks 규칙 준수

## 모범 사례
1. **타입 안전성**: 모든 함수/변수에 타입 명시
2. **불변성**: 상태 업데이트 시 새 객체 생성
3. **에러 처리**: try-catch로 API 호출 감싸기
4. **입력 검증**: 필수 파라미터 체크 (`validateRequiredParams`)
