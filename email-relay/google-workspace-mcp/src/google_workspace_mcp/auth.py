"""Google OAuth 2.0 인증 모듈.

이 모듈은 Google Workspace API에 접근하기 위한 OAuth 2.0 인증을 처리합니다.
credentials.json 파일과 token.json 파일을 관리합니다.
"""

import json
import os
from pathlib import Path
from typing import Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

# Google API 스코프 정의
SCOPES = [
    # Gmail
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
    # Drive
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
    # Calendar
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    # Sheets
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/spreadsheets",
]


def get_config_dir() -> Path:
    """설정 디렉토리 경로를 반환합니다."""
    config_dir = Path.home() / ".config" / "google-workspace-mcp"
    config_dir.mkdir(parents=True, exist_ok=True)
    return config_dir


def get_credentials_path() -> Path:
    """credentials.json 파일 경로를 반환합니다."""
    # 환경 변수 확인
    env_path = os.environ.get("GOOGLE_CREDENTIALS_PATH")
    if env_path:
        return Path(env_path)
    return get_config_dir() / "credentials.json"


def get_token_path() -> Path:
    """token.json 파일 경로를 반환합니다."""
    # 환경 변수 확인
    env_path = os.environ.get("GOOGLE_TOKEN_PATH")
    if env_path:
        return Path(env_path)
    return get_config_dir() / "token.json"


def get_credentials() -> Optional[Credentials]:
    """유효한 Google API 자격 증명을 반환합니다.

    Returns:
        Credentials: 유효한 자격 증명 또는 None
    """
    creds = None
    token_path = get_token_path()
    credentials_path = get_credentials_path()

    # 기존 토큰 로드
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)

    # 토큰이 없거나 유효하지 않은 경우
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            # 토큰 갱신
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"토큰 갱신 실패: {e}")
                creds = None

        if not creds:
            # 새 인증 필요
            if not credentials_path.exists():
                raise FileNotFoundError(
                    f"credentials.json 파일을 찾을 수 없습니다: {credentials_path}\n"
                    "Google Cloud Console에서 OAuth 2.0 클라이언트 ID를 생성하고 "
                    "credentials.json 파일을 다운로드하세요."
                )

            flow = InstalledAppFlow.from_client_secrets_file(
                str(credentials_path), SCOPES
            )
            creds = flow.run_local_server(port=0)

        # 토큰 저장
        if creds:
            with open(token_path, "w") as token_file:
                token_file.write(creds.to_json())

    return creds


def check_auth_status() -> dict:
    """인증 상태를 확인합니다.

    Returns:
        dict: 인증 상태 정보
    """
    token_path = get_token_path()
    credentials_path = get_credentials_path()

    status = {
        "credentials_exists": credentials_path.exists(),
        "credentials_path": str(credentials_path),
        "token_exists": token_path.exists(),
        "token_path": str(token_path),
        "authenticated": False,
        "scopes": SCOPES,
    }

    if token_path.exists():
        try:
            creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
            status["authenticated"] = creds.valid
            status["expired"] = creds.expired if creds else None
            if creds and creds.token:
                status["has_access_token"] = True
            if creds and creds.refresh_token:
                status["has_refresh_token"] = True
        except Exception as e:
            status["error"] = str(e)

    return status


def clear_credentials() -> bool:
    """저장된 토큰을 삭제합니다.

    Returns:
        bool: 삭제 성공 여부
    """
    token_path = get_token_path()
    if token_path.exists():
        token_path.unlink()
        return True
    return False


def save_credentials_from_json(credentials_json: str) -> bool:
    """JSON 문자열로부터 credentials.json 파일을 저장합니다.

    Args:
        credentials_json: OAuth 클라이언트 자격 증명 JSON 문자열

    Returns:
        bool: 저장 성공 여부
    """
    try:
        # JSON 유효성 검사
        creds_data = json.loads(credentials_json)

        # 필수 필드 확인
        if "installed" not in creds_data and "web" not in creds_data:
            raise ValueError("유효하지 않은 credentials 형식입니다.")

        credentials_path = get_credentials_path()
        with open(credentials_path, "w") as f:
            json.dump(creds_data, f, indent=2)

        return True
    except Exception as e:
        print(f"credentials 저장 실패: {e}")
        return False
