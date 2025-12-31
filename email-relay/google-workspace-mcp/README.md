# Google Workspace MCP Server

Google Workspace API(Gmail, Drive, Calendar, Sheets)를 Claude Code에서 직접 사용할 수 있게 해주는 MCP(Model Context Protocol) 서버입니다.

## 기능

### Gmail
- `gmail_send` - 이메일 발송
- `gmail_read` - 이메일 읽기
- `gmail_search` - 이메일 검색
- `gmail_list_labels` - 라벨 목록 조회
- `gmail_modify_labels` - 라벨 수정
- `gmail_trash` / `gmail_untrash` - 휴지통 관리

### Google Drive
- `drive_list` - 파일 목록 조회
- `drive_read` - 파일 내용 읽기
- `drive_upload` - 파일 업로드
- `drive_create_folder` - 폴더 생성
- `drive_delete` - 파일 삭제
- `drive_share` - 파일 공유
- `drive_get_file_info` - 파일 정보 조회

### Google Calendar
- `calendar_list` - 일정 목록 조회
- `calendar_create` - 일정 생성
- `calendar_update` - 일정 수정
- `calendar_delete` - 일정 삭제
- `calendar_get_event` - 일정 상세 조회
- `calendar_list_calendars` - 캘린더 목록 조회
- `calendar_quick_add` - 자연어 일정 추가
- `calendar_free_busy` - 바쁨/여유 조회

### Google Sheets
- `sheets_read` - 데이터 읽기
- `sheets_write` - 데이터 쓰기
- `sheets_append` - 데이터 추가
- `sheets_clear` - 데이터 지우기
- `sheets_get_info` - 스프레드시트 정보 조회
- `sheets_create` - 스프레드시트 생성
- `sheets_add_sheet` / `sheets_delete_sheet` - 시트 관리
- `sheets_batch_get` / `sheets_batch_update` - 일괄 처리
- `sheets_find_replace` - 찾기/바꾸기

### 인증
- `auth_status` - 인증 상태 확인
- `auth_login` - Google 로그인
- `auth_logout` - 로그아웃

## 설치

### 1. 프로젝트 클론 및 설치

```bash
cd /home/kogh/mino/premoapi/email-relay/google-workspace-mcp

# 가상환경 생성 및 활성화
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 패키지 설치
pip install -e .
```

### 2. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스** > **라이브러리**에서 다음 API 활성화:
   - Gmail API
   - Google Drive API
   - Google Calendar API
   - Google Sheets API

4. **API 및 서비스** > **사용자 인증 정보**:
   - **사용자 인증 정보 만들기** > **OAuth 클라이언트 ID**
   - 애플리케이션 유형: **데스크톱 앱**
   - 이름 입력 후 **만들기**

5. 생성된 클라이언트의 **JSON 다운로드** 클릭

6. 다운로드한 파일을 설정 디렉토리에 저장:
```bash
mkdir -p ~/.config/google-workspace-mcp
cp ~/Downloads/client_secret_*.json ~/.config/google-workspace-mcp/credentials.json
```

### 3. Claude Code 설정

`~/.claude.json` 또는 프로젝트의 `.claude/settings.local.json`에 추가:

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "/home/kogh/mino/premoapi/email-relay/google-workspace-mcp/.venv/bin/python",
      "args": ["-m", "google_workspace_mcp.server"],
      "cwd": "/home/kogh/mino/premoapi/email-relay/google-workspace-mcp"
    }
  }
}
```

또는 `uv`를 사용하는 경우:

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "uv",
      "args": ["run", "--directory", "/home/kogh/mino/premoapi/email-relay/google-workspace-mcp", "google-workspace-mcp"],
      "cwd": "/home/kogh/mino/premoapi/email-relay/google-workspace-mcp"
    }
  }
}
```

## 첫 사용

1. Claude Code 재시작
2. `auth_status` 도구로 인증 상태 확인
3. `auth_login` 도구 실행 (브라우저에서 Google 로그인)
4. 권한 승인 완료

## 사용 예시

### Gmail - 이메일 검색 및 발송
```
"지난주에 받은 중요한 이메일을 검색해줘"
-> gmail_search(query="is:important newer_than:7d")

"홍길동에게 회의 일정 확인 메일 보내줘"
-> gmail_send(to="hong@example.com", subject="회의 일정 확인", body="...")
```

### Drive - 파일 관리
```
"내 드라이브에서 PDF 파일 목록을 보여줘"
-> drive_list(file_type="pdf")

"프로젝트 폴더에 보고서를 업로드해줘"
-> drive_upload(name="report.txt", content="...", folder_id="...")
```

### Calendar - 일정 관리
```
"이번 주 일정을 보여줘"
-> calendar_list(time_min="2024-01-15T00:00:00Z", time_max="2024-01-21T23:59:59Z")

"내일 오후 3시에 팀 미팅 일정 추가해줘"
-> calendar_create(summary="팀 미팅", start="2024-01-16T15:00:00", end="2024-01-16T16:00:00")
```

### Sheets - 스프레드시트 작업
```
"매출 스프레드시트에서 A1:D10 범위 데이터를 읽어줘"
-> sheets_read(spreadsheet_id="...", range_notation="Sheet1!A1:D10")

"새 행에 판매 데이터를 추가해줘"
-> sheets_append(spreadsheet_id="...", range_notation="Sheet1", values=[["상품A", 100, 50000]])
```

## 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `GOOGLE_CREDENTIALS_PATH` | credentials.json 파일 경로 | `~/.config/google-workspace-mcp/credentials.json` |
| `GOOGLE_TOKEN_PATH` | token.json 파일 경로 | `~/.config/google-workspace-mcp/token.json` |

## 보안 참고사항

- `credentials.json`과 `token.json`은 절대 Git에 커밋하지 마세요
- 토큰에는 Google 계정에 대한 액세스 권한이 포함되어 있습니다
- 공유 컴퓨터에서는 `auth_logout`으로 로그아웃하세요

## 문제 해결

### "credentials.json 파일을 찾을 수 없습니다"
- Google Cloud Console에서 OAuth 클라이언트 자격 증명을 다운로드했는지 확인
- 파일이 올바른 위치에 있는지 확인: `~/.config/google-workspace-mcp/credentials.json`

### "인증 토큰이 만료되었습니다"
- `auth_logout` 후 `auth_login` 재실행
- 또는 `~/.config/google-workspace-mcp/token.json` 삭제 후 재인증

### "API가 활성화되지 않았습니다"
- Google Cloud Console에서 필요한 API가 모두 활성화되어 있는지 확인

## 라이선스

MIT License
