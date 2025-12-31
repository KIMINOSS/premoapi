#!/usr/bin/env python3
"""
Google OAuth 인증 - InstalledAppFlow 사용
google-auth-oauthlib의 로컬 서버 방식
"""

import json
import os
import subprocess
import paramiko
from google_auth_oauthlib.flow import InstalledAppFlow

# 설정
PI_HOST = "192.168.8.231"
PI_USER = "mino"
PI_PASS = "***REMOVED***"
CREDENTIALS_PATH = os.path.expanduser("~/.config/gcloud/application_default_credentials.json")

# OAuth 설정 - gcloud CLI 기본 클라이언트
CLIENT_CONFIG = {
    "installed": {
        "client_id": "764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com",
        "client_secret": "***REMOVED***",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": ["http://localhost"]
    }
}

SCOPES = [
    "https://www.googleapis.com/auth/generative-language",
    "https://www.googleapis.com/auth/cloud-platform"
]


def copy_to_pi(local_path, remote_path):
    """paramiko를 사용하여 라즈베리파이로 파일 복사"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(PI_HOST, username=PI_USER, password=PI_PASS, timeout=10)

    # 디렉토리 생성
    ssh.exec_command(f'mkdir -p {os.path.dirname(remote_path)}')

    # SFTP로 파일 복사
    sftp = ssh.open_sftp()
    sftp.put(local_path, remote_path)
    sftp.close()
    ssh.close()


def test_gemini_on_pi():
    """라즈베리파이에서 Gemini API 테스트"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(PI_HOST, username=PI_USER, password=PI_PASS, timeout=10)

    test_code = '''
from google import genai
from google.auth import default
try:
    creds, proj = default()
    client = genai.Client(credentials=creds)
    r = client.models.generate_content(model="gemini-2.0-flash", contents="Hi! Introduce yourself briefly in Korean.")
    print(r.text)
except Exception as e:
    print(f"Error: {e}")
'''

    stdin, stdout, stderr = ssh.exec_command(f"python3 -c '{test_code}'", timeout=60)
    output = stdout.read().decode()
    error = stderr.read().decode()
    ssh.close()

    return output if output else error


def main():
    print("=" * 60)
    print("  Google OAuth 인증 (InstalledAppFlow)")
    print("=" * 60)
    print()

    # 1. OAuth 플로우 실행
    print("[1/3] OAuth 인증 시작...")
    print("      브라우저가 열리면 Google 계정으로 로그인하세요.")
    print()

    flow = InstalledAppFlow.from_client_config(CLIENT_CONFIG, SCOPES)

    # 로컬 서버 방식으로 실행 (자동으로 브라우저 열림)
    credentials = flow.run_local_server(
        port=0,  # 자동으로 사용 가능한 포트 선택
        success_message="인증 성공! 이 창을 닫아도 됩니다.",
        open_browser=True
    )

    print()
    print("      OAuth 인증 완료!")

    # 2. credentials 저장
    print()
    print("[2/3] Credentials 저장 중...")

    cred_data = {
        "client_id": CLIENT_CONFIG["installed"]["client_id"],
        "client_secret": CLIENT_CONFIG["installed"]["client_secret"],
        "refresh_token": credentials.refresh_token,
        "type": "authorized_user"
    }

    os.makedirs(os.path.dirname(CREDENTIALS_PATH), exist_ok=True)
    with open(CREDENTIALS_PATH, 'w') as f:
        json.dump(cred_data, f, indent=2)

    print(f"      저장됨: {CREDENTIALS_PATH}")

    # 3. 라즈베리파이로 복사
    print()
    print("[3/3] 라즈베리파이로 복사 중...")

    try:
        copy_to_pi(CREDENTIALS_PATH, "/home/mino/.config/gcloud/application_default_credentials.json")
        print("      복사 완료!")

        # Gemini 테스트
        print()
        print("=" * 60)
        print("  Gemini API 테스트 (라즈베리파이)")
        print("=" * 60)

        result = test_gemini_on_pi()
        print()
        print("[Gemini 응답]")
        print(result)

    except Exception as e:
        print(f"      오류: {e}")


if __name__ == "__main__":
    main()
