# Google OAuth 설정 가이드 (라즈베리파이 Gemini API)

## 문제 상황
- 라즈베리파이에서 Gemini API 사용을 위해 OAuth 인증 필요
- API 키는 rate limit 초과

## 해결 방법

### 방법 1: WSL 터미널에서 수동 인증 (권장)

```bash
cd /home/kogh/mino/premoapi/email-relay
python3 wsl_oauth_new.py
```

이 스크립트는:
1. gcloud OAuth URL 생성
2. Windows 브라우저 자동 열기
3. 사용자가 Google 로그인 후 인증 코드 입력
4. Credentials를 라즈베리파이로 자동 복사
5. Gemini API 테스트

### 방법 2: Console 방식 인증

```bash
python3 oauth_console.py
```

이 스크립트는:
1. OAuth URL을 출력하고 브라우저 열기
2. 로그인 후 "사이트에 연결할 수 없음" 페이지의 URL 복사
3. 복사한 URL 입력
4. 자동으로 토큰 교환 및 라즈베리파이 복사

### 방법 3: Playwright 자동화

```bash
python3 oauth_playwright.py
```

브라우저 자동화로 OAuth 수행 (처음 실행 시 로그인 필요)

## 스크립트 목록

| 스크립트 | 설명 |
|---------|------|
| `wsl_oauth_new.py` | pexpect 사용, 인증 코드 입력 방식 |
| `oauth_console.py` | 콜백 URL 입력 방식 |
| `oauth_playwright.py` | Playwright 브라우저 자동화 |
| `oauth_wslg.py` | WSLg Chrome + HTTP 서버 |

## 라즈베리파이 정보

- Host: 192.168.8.231
- User: mino
- Password: ***REMOVED***
- gcloud 경로: ~/google-cloud-sdk/bin/gcloud

## Credentials 위치

- WSL: ~/.config/gcloud/application_default_credentials.json
- Raspberry Pi: /home/mino/.config/gcloud/application_default_credentials.json

## Gemini API 테스트

라즈베리파이에서:
```bash
python3 -c "
from google import genai
from google.auth import default
creds, proj = default()
client = genai.Client(credentials=creds)
r = client.models.generate_content(model='gemini-2.0-flash', contents='Hello!')
print(r.text)
"
```
