# n8n 이메일 통합 세션 컨텍스트

## 세션 날짜
2025-12-31

## 프로젝트 상태

### 완료된 작업
1. **premoapi 회원가입 이메일 시스템 분석**
   - /src/app/api/auth/register/route.ts - 이메일 발송 로직 확인
   - 현재: Gmail SMTP, Resend, Power Automate 방식 지원
   - 환경변수: RESEND_API_KEY, USE_POWER_AUTOMATE_FLOW

2. **n8n 환경 구축**
   - 라즈베리파이: 192.168.8.231
   - n8n 버전: 2.1.4
   - URL: http://192.168.8.231:5678
   - 계정: admin@premo.local / ***REMOVED***

3. **Claude API + n8n 통합 성공**
   - /webhook/ask-claude 웹훅 작동 확인
   - ANTHROPIC_API_KEY 환경변수 설정됨

### 진행 중인 작업
- n8n 이메일 발송 워크플로우 생성
- n8n 컨테이너 재시작으로 인한 재설정 필요

### 대기 중인 작업
- premoapi와 n8n 연동 구현
- 테스트 및 검증
- 텔레그램 봇 n8n 통합 (사용자 추가 요청)

## 중요 자격증명

### 라즈베리파이 SSH
- Host: 192.168.8.231
- User: mino
- Password: ***REMOVED***

### n8n
- URL: http://192.168.8.231:5678
- Email: admin@premo.local
- Password: ***REMOVED***

### API Keys
- RESEND_API_KEY: re_BfwLWQK4_5ZRZM3EqaxBXBBMbKurco1ip
- ANTHROPIC_API_KEY: (설정됨)

## 기술적 발견사항

### n8n 2.x API 주의사항
1. 워크플로우 활성화시 versionId 필수
2. 웹훅 응답: responseMode: "responseNode" + respondToWebhook 노드
3. Expression: {{ $json.field }} 형식

### 이메일 워크플로우 구조
Webhook → Set (데이터 준비) → HTTP Request (Resend API) → Response

## 다음 세션 TODO
1. n8n 로그인 문제 해결 (현재 400 에러)
2. PREMO Email Verification 워크플로우 생성
3. premoapi register/route.ts에 n8n 웹훅 호출 추가
4. End-to-end 테스트

## 관련 파일
- /home/kogh/mino/premoapi/src/app/api/auth/register/route.ts
- /home/kogh/mino/premoapi/.env.local
- /home/kogh/mino/premoapi/email-relay/n8n_claude_integration.py
