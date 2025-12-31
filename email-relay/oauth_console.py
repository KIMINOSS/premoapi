#!/usr/bin/env python3
"""
Google OAuth 인증 - Console 방식
URL을 출력하고 콜백 URL을 입력받아 처리
"""

import json
import os
import subprocess
import re
import urllib.parse
import paramiko
import requests

# 설정
PI_HOST = "192.168.8.231"
PI_USER = "mino"
PI_PASS = "***REMOVED***"
CREDENTIALS_PATH = os.path.expanduser("~/.config/gcloud/application_default_credentials.json")

# OAuth 설정 - gcloud CLI 기본 클라이언트
CLIENT_ID = "764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com"
CLIENT_SECRET = "***REMOVED***"
REDIRECT_URI = "http://localhost:1"  # 존재하지 않는 포트로 리다이렉트

SCOPES = [
    "https://www.googleapis.com/auth/generative-language",
    "https://www.googleapis.com/auth/cloud-platform"
]


def get_auth_url():
    """OAuth 인증 URL 생성"""
    params = {
        'client_id': CLIENT_ID,
        'redirect_uri': REDIRECT_URI,
        'response_type': 'code',
        'scope': ' '.join(SCOPES),
        'access_type': 'offline',
        'prompt': 'consent'
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"


def exchange_code(code):
    """인증 코드를 토큰으로 교환"""
    response = requests.post('https://oauth2.googleapis.com/token', data={
        'code': code,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'redirect_uri': REDIRECT_URI,
        'grant_type': 'authorization_code'
    })
    return response.json()


def copy_to_pi(local_path, remote_path):
    """라즈베리파이로 파일 복사"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(PI_HOST, username=PI_USER, password=PI_PASS, timeout=10)

    ssh.exec_command(f'mkdir -p {os.path.dirname(remote_path)}')

    sftp = ssh.open_sftp()
    sftp.put(local_path, remote_path)
    sftp.close()
    ssh.close()


def test_gemini_on_pi():
    """라즈베리파이에서 Gemini API 테스트"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(PI_HOST, username=PI_USER, password=PI_PASS, timeout=10)

    test_code = """
from google import genai
from google.auth import default
try:
    creds, proj = default()
    client = genai.Client(credentials=creds)
    r = client.models.generate_content(model='gemini-2.0-flash', contents='Hi! Say hello in Korean briefly.')
    print(r.text)
except Exception as e:
    print(f'Error: {e}')
"""

    stdin, stdout, stderr = ssh.exec_command(f'python3 -c "{test_code}"', timeout=60)
    output = stdout.read().decode()
    error = stderr.read().decode()
    ssh.close()

    return output if output else error


def main():
    print("=" * 60)
    print("  Google OAuth 인증 (Console 방식)")
    print("=" * 60)
    print()

    # 1. OAuth URL 생성
    auth_url = get_auth_url()

    print("[1/4] 아래 URL을 브라우저에서 열어주세요:")
    print()
    print(auth_url)
    print()

    # Windows 브라우저 열기 시도
    try:
        subprocess.run(
            ["powershell.exe", "-Command", f"Start-Process '{auth_url}'"],
            capture_output=True,
            timeout=5
        )
        print("(브라우저가 자동으로 열렸습니다)")
    except:
        pass

    print()
    print("-" * 60)
    print("Google 로그인 후 '이 사이트에 연결할 수 없음' 페이지가 나타나면")
    print("주소창의 전체 URL을 복사해서 아래에 붙여넣으세요.")
    print()
    print("예: http://localhost:1?code=4/0AQSTgQ...&scope=...")
    print("-" * 60)
    print()

    callback_url = input("콜백 URL: ").strip()

    if not callback_url:
        print("URL이 입력되지 않았습니다.")
        return

    # 2. 코드 추출
    print()
    print("[2/4] 인증 코드 추출 중...")

    match = re.search(r'code=([^&]+)', callback_url)
    if not match:
        print("      인증 코드를 찾을 수 없습니다.")
        return

    code = urllib.parse.unquote(match.group(1))
    print("      코드 추출 완료!")

    # 3. 토큰 교환
    print()
    print("[3/4] 토큰 교환 중...")

    tokens = exchange_code(code)

    if 'refresh_token' not in tokens:
        print(f"      토큰 오류: {tokens}")
        return

    print("      토큰 획득 성공!")

    # credentials 저장
    cred_data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": tokens['refresh_token'],
        "type": "authorized_user"
    }

    os.makedirs(os.path.dirname(CREDENTIALS_PATH), exist_ok=True)
    with open(CREDENTIALS_PATH, 'w') as f:
        json.dump(cred_data, f, indent=2)

    print(f"      Credentials 저장됨: {CREDENTIALS_PATH}")

    # 4. 라즈베리파이로 복사
    print()
    print("[4/4] 라즈베리파이로 복사 중...")

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
