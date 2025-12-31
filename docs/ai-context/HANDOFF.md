# AI Session Handoff Document

> 마지막 업데이트: 2025-12-31 (세션 종료)
> 세션 상태: HANDOFF READY

---

## n8n 이메일 통합 - IN PROGRESS

### Current Status
premoapi 회원가입 이메일 발송을 n8n 워크플로우로 마이그레이션 중. n8n 환경 구축 완료, Claude API 통합 성공. 이메일 워크플로우 생성 중 n8n 재시작으로 인한 재설정 필요.

### What Was Accomplished

**환경 구축:**
- n8n Docker 컨테이너 설치 (라즈베리파이 192.168.8.231)
- n8n 버전: 2.1.4, URL: http://192.168.8.231:5678
- Owner 계정 생성: admin@premo.local / ***REMOVED***
- ANTHROPIC_API_KEY 환경변수 설정

**Claude API 통합:**
- `/webhook/ask-claude` 웹훅 생성 및 테스트 성공
- 한국어 응답 정상 동작 확인

**코드 분석:**
- `/src/app/api/auth/register/route.ts` - 현재 이메일 발송 로직 분석
- Gmail SMTP, Resend, Power Automate 3가지 방식 지원 확인
- `.env.local` 환경변수 구조 파악

### Current Issue
n8n 컨테이너가 재시작되면서 로그인 400 에러 발생. Owner 계정은 존재하나 인증 실패 상태.

```
로그인: 400
설정: 200
Setup 완료: False (불일치 상태)
```

### Next Steps to Complete Email Integration

1. **n8n 인증 문제 해결**
   - Docker 컨테이너 볼륨 마운트 확인
   - 필요시 컨테이너 재생성 및 owner 재설정

2. **PREMO Email Verification 워크플로우 생성**
   ```
   Webhook(/send-verification)
   → Set(데이터 준비)
   → HTTP Request(Resend API)
   → Response
   ```

3. **premoapi 연동**
   - `register/route.ts`에 n8n 웹훅 호출 추가
   - 환경변수: `N8N_WEBHOOK_URL` 추가

4. **End-to-end 테스트**
   - 회원가입 → 이메일 발송 → 인증 완료 플로우 검증

### Key Files to Review

**premoapi 소스:**
- `/src/app/api/auth/register/route.ts` - 이메일 발송 로직 (수정 필요)
- `/src/app/api/auth/verify/route.ts` - 토큰 검증
- `/.env.local` - 환경변수

**n8n 관련:**
- `/email-relay/n8n_claude_integration.py` - n8n API 클라이언트 참조

### Context for Next Session

**중요 자격증명:**
| 항목 | 값 |
|------|-----|
| Pi SSH | 192.168.8.231 / mino / ***REMOVED*** |
| n8n | http://192.168.8.231:5678 |
| n8n 계정 | admin@premo.local / ***REMOVED*** |
| RESEND_API_KEY | re_BfwLWQK4_5ZRZM3EqaxBXBBMbKurco1ip |

**n8n 2.x API 주의사항:**
1. 워크플로우 활성화시 `versionId` 필수
2. 웹훅 응답: `responseMode: "responseNode"` 사용
3. Expression: `{{ $json.field }}` 형식

**Serena 메모리:**
- `session-n8n-email-integration` - 상세 세션 컨텍스트 저장됨

---

## 추가 요청사항 - PENDING

### 텔레그램 봇 n8n 통합
사용자 요청: "현재 설치되어있으나 오류로 사용안하는 텔레그램봇 프로젝트를 n8n을 통해 더 깔끔하게 구현하시오"

- 현재 상태: 미착수 (이메일 통합 완료 후 진행 예정)
- 기존 텔레그램 봇 프로젝트 위치 확인 필요

---

## 세션 분석

```
Session Analysis:
- Primary work area: n8n + premoapi 이메일 통합
- Main accomplishments: n8n 환경 구축, Claude API 통합 성공, 코드 분석 완료
- Files modified: 없음 (분석 및 외부 시스템 설정 작업)
- Status: in-progress (n8n 인증 문제로 중단)
- Blocker: n8n 로그인 400 에러
```
