# Power Automate 이메일 인증 플로우 가이드

## 개요

PREMO API의 사용자 등록 시 이메일 인증을 Power Automate를 통해 처리하는 시스템입니다.

```
┌─────────────────────────────────────────────────────────────────┐
│                    이메일 인증 플로우                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌────────┐    ┌────────┐    ┌─────────┐       │
│  │ 사용자   │───▶│ PREMO  │───▶│ Resend │───▶│  Gmail  │       │
│  │ 등록요청 │    │  API   │    │        │    │ (중계)  │       │
│  └──────────┘    └────────┘    └────────┘    └────┬────┘       │
│                                                    │            │
│                                                    ▼            │
│  ┌──────────┐    ┌─────────┐    ┌──────────────────────┐       │
│  │ 최종     │◀───│ Outlook │◀───│  Power Automate      │       │
│  │ 사용자   │    │         │    │  (태그 파싱/라우팅)   │       │
│  └──────────┘    └─────────┘    └──────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 왜 이런 구조인가?

1. **Resend 제한**: Resend 무료 플랜은 발신 도메인 인증 필요
2. **기업 메일 수신**: grupopremo.com 도메인은 외부 메일 수신 제한
3. **해결책**: Gmail 중계 → Power Automate → Outlook 내부 발송

## 환경 변수 설정

`.env.local` 파일에 다음 설정 추가:

```bash
# Power Automate 플로우 활성화
USE_POWER_AUTOMATE_FLOW=true

# Gmail 중계 주소
GMAIL_RELAY_EMAIL=koghminho@gmail.com

# Resend API 키
RESEND_API_KEY=re_xxxxxxxxxxxx
```

## Power Automate 플로우 설정

### 방법 1: 자동 설정 스크립트

```bash
# 1. Edge 브라우저를 원격 디버깅 모드로 실행
msedge --remote-debugging-port=9222

# 2. 브라우저에서 Power Automate 로그인
# https://make.powerautomate.com

# 3. 설정 스크립트 실행
cd /home/kogh/mino/premoapi
node setup-pa-email-flow.js
```

### 방법 2: 수동 설정

1. **Power Automate 접속**: https://make.powerautomate.com
2. **새 플로우 생성**: Create → Automated cloud flow
3. **플로우 이름**: `PREMO-Email-Auth-Flow`
4. **트리거 설정**:
   - 트리거: `When a new email arrives` (Gmail)
   - From: `onboarding@resend.dev`
   - Label: `INBOX`

5. **Condition 추가**:
   - 조건: `Subject contains [TO:`

6. **If yes 브랜치에 액션 추가**:
   - **Initialize variable (ActualRecipient)**:
     ```
     substring(triggerOutputs()?['body/Subject'], 
       add(indexOf(triggerOutputs()?['body/Subject'], '[TO:'), 4), 
       sub(indexOf(triggerOutputs()?['body/Subject'], ']'), 
         add(indexOf(triggerOutputs()?['body/Subject'], '[TO:'), 4)))
     ```
   
   - **Initialize variable (CleanSubject)**:
     ```
     trim(substring(triggerOutputs()?['body/Subject'], 
       add(indexOf(triggerOutputs()?['body/Subject'], ']'), 2)))
     ```
   
   - **Send an email (V2)** (Office 365 Outlook):
     - To: `@variables('ActualRecipient')`
     - Subject: `@variables('CleanSubject')`
     - Body: `@triggerOutputs()?['body/Body']`
     - From: `minho.kim@grupopremo.com`

7. **저장 및 활성화**

### 방법 3: JSON 플로우 가져오기

1. Power Automate → My flows → Import
2. `power-automate-email-auth-flow.json` 파일 업로드
3. 연결 설정 (Gmail, Office 365)
4. 저장 및 활성화

## 이메일 Subject 형식

```
[TO:user@grupopremo.com] [PREMO API] 계정 인증
```

- `[TO:...]`: 실제 수신자 이메일 (Power Automate가 파싱)
- 나머지: 실제 이메일 제목

## 테스트 방법

```bash
# 1. 개발 서버 실행
npm run dev

# 2. 회원가입 API 테스트
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@grupopremo.com"}'

# 3. 콘솔에서 인증 링크 확인 (개발 환경)
# 4. Power Automate 실행 기록 확인
```

## 문제 해결

### Gmail 연결 오류
- Gmail API 접근 권한 확인
- Power Automate에서 Gmail 연결 재설정

### Outlook 발송 실패
- Office 365 라이센스 확인
- 발신자 이메일 권한 확인

### 플로우가 트리거되지 않음
- Gmail 라벨 설정 확인
- Resend 발신자 주소 확인
- 플로우 활성화 상태 확인

## 관련 파일

| 파일 | 설명 |
|------|------|
| `src/app/api/auth/register/route.ts` | 회원가입 API (Resend 발송) |
| `setup-pa-email-flow.js` | PA 자동 설정 스크립트 |
| `power-automate-email-auth-flow.json` | PA 플로우 정의 |
| `.env.example` | 환경 변수 템플릿 |
| `DNS_RECORDS_FOR_RESEND.md` | Resend DNS 설정 |
