# PREMOAPI 명령어 가이드

## 개발 명령어

### 개발 서버 실행
```bash
npm run dev
```
- URL: http://localhost:3000
- Hot Reload 지원

### 프로덕션 빌드
```bash
npm run build
```
- `.next/` 디렉토리에 출력

### 프로덕션 서버 실행
```bash
npm run start
```

### 린트 검사
```bash
npm run lint
```
- ESLint + Next.js 규칙 적용

## Cloudflare Pages 배포

### 빌드
```bash
npm run pages:build
```
- `@cloudflare/next-on-pages` 사용
- `.vercel/output/static` 에 출력

### 배포
```bash
npm run pages:deploy
```
- 프로젝트명: `premoapi`

### 로컬 테스트
```bash
npm run pages:dev
```
- Cloudflare Workers 호환 테스트

## 시스템 유틸리티 (Linux)

### 파일 탐색
```bash
ls -la src/app/dashboard/
find . -name "*.ts" -type f
```

### 코드 검색
```bash
grep -r "MMPM8009" src/
grep -rn "I_LIFNR" --include="*.ts"
```

### Git 명령어
```bash
git status
git add .
git commit -m "메시지"
git push origin main
```

### 의존성 관리
```bash
npm install            # 전체 설치
npm install <패키지>   # 패키지 추가
npm update             # 업데이트
```
