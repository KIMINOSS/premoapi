# PREMOAPI 작업 완료 체크리스트

## 코드 변경 후 필수 검증

### 1. 타입 검사
```bash
# TypeScript 컴파일 확인
npx tsc --noEmit
```

### 2. 린트 검사
```bash
npm run lint
```

### 3. 빌드 테스트
```bash
npm run build
```
- 빌드 오류 없음 확인
- 번들 사이즈 확인 (dashboard < 20KB 권장)

### 4. 개발 서버 테스트
```bash
npm run dev
```
- http://localhost:3000/dashboard 접속
- 콘솔 에러 확인
- 기능 동작 확인

## 배포 전 체크리스트

### Cloudflare Pages 배포
```bash
# 1. 빌드
npm run pages:build

# 2. 로컬 테스트
npm run pages:dev

# 3. 배포
npm run pages:deploy
```

## 코드 리뷰 항목

### 보안
- [ ] 입력 검증 적용 여부
- [ ] OAuth 토큰 노출 방지
- [ ] 환경 변수 사용 여부

### 성능
- [ ] 불필요한 리렌더링 없음
- [ ] 큰 데이터 페이지네이션 적용
- [ ] 이미지/자산 최적화

### 코드 품질
- [ ] 타입 정의 완료
- [ ] 중복 코드 제거
- [ ] 적절한 에러 처리

## 커밋 메시지 형식
```
feat: 새 기능 추가
fix: 버그 수정
refactor: 코드 개선
docs: 문서 수정
style: 포맷팅/코드 스타일
chore: 빌드/설정 변경
```

## 성능 기준
| 항목 | 목표 |
|------|------|
| First Load JS (dashboard) | < 130KB |
| 번들 사이즈 (dashboard) | < 20KB |
| Cold Start (API) | < 200ms |
| Warm Response (API) | < 30ms |
