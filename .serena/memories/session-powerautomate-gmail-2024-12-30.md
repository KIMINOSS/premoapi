# Power Automate Gmail 연결 세션 - 2024-12-30

## 세션 목표
- Power Automate에서 Gmail/Outlook 이메일 트리거 플로우 생성
- 이메일 인증 플로우: Resend → Gmail → Power Automate → Outlook → 사용자

## 완료된 작업

### 1. 플로우 생성 완료
- **플로우명**: PREMO-Gmail-Auth
- **URL**: `https://make.powerautomate.com/environments/Default-ef30448f-b0ea-4625-99b6-991583884a18/flows/new`
- **트리거**: "When a new email arrives (V2)" - Outlook

### 2. CDP 브라우저 자동화
- Windows Edge + CDP (port 9222) 연결 성공
- PowerShell에서 Node.js 스크립트 실행으로 WSL-Windows 연동
- 패턴: `powershell.exe -Command "cd '\\\\wsl.localhost\\Ubuntu-24.04\\home\\kogh\\mino\\premoapi'; node script.js"`

### 3. 연결 설정 진행 중
- Outlook 연결 시도 중
- Microsoft 계정 선택 필요
- minho.kim@grupopremo.com 계정 없음 → 새 계정 생성 진행 중

## 미완료 작업

### 1. Microsoft 계정 생성
- 개인정보 동의 화면에서 체크박스 선택 필요
- 동의 후 계정 생성 완료 필요

### 2. 플로우 연결 완료
- Outlook 연결 완료 후 트리거 설정
- From 필터: onboarding@resend.dev
- Condition 액션 추가 ([TO:] 태그 파싱)

### 3. 플로우 테스트
- 저장 및 활성화
- 테스트 이메일 발송으로 확인

## 기술적 발견

### CDP 연결 방법
```javascript
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const context = browser.contexts()[0];
const page = context.pages()[0];
```

### WSL에서 Windows Edge 제어
- localhost:9222는 WSL 내부 → 연결 불가
- PowerShell에서 스크립트 실행 → Windows에서 CDP 접근 가능

### Power Automate 다이얼로그 처리
- Create 버튼 클릭이 까다로움
- JavaScript evaluate로 직접 클릭 필요
- 트리거 선택 후 버튼 활성화 확인 필요

## 관련 파일
- `/home/kogh/mino/premoapi/.playwright-mcp/` - 스크린샷
- `create-pa-flow-cdp.js`, `fix-gmail-connection.js` 등 자동화 스크립트

## 다음 세션 시작점
Microsoft 계정 생성 페이지에서 체크박스 선택 후 동의 진행
