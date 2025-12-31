#!/usr/bin/env python3
"""
Google OAuth 인증 - WSLg Chrome 사용
WSL2의 WSLg를 통해 Linux Chrome으로 OAuth 진행
"""

import json
import os
import subprocess
import re
import urllib.parse
import paramiko
import requests
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

# 설정
PI_HOST = "192.168.8.231"
PI_USER = "mino"
PI_PASS = "***REMOVED***"
CREDENTIALS_PATH = os.path.expanduser("~/.config/gcloud/application_default_credentials.json")

# OAuth 설정
CLIENT_ID = "764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com"
CLIENT_SECRET = "***REMOVED***"
PORT = 8086

SCOPES = [
    "https://www.googleapis.com/auth/generative-language",
    "https://www.googleapis.com/auth/cloud-platform"
]

auth_code = None
server = None


class OAuthHandler(BaseHTTPRequestHandler):
    """OAuth 콜백 핸들러"""

    def do_GET(self):
        global auth_code

        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)

        if 'code' in params:
            auth_code = params['code'][0]
            response = """
            <html><body style='font-family: sans-serif; text-align: center; padding-top: 50px;'>
            <h1 style='color: green;'>인증 성공!</h1>
            <p>이 창을 닫아도 됩니다.</p>
            <script>window.close();</script>
            </body></html>
            """
        else:
            response = "<html><body>인증 오류</body></html>"

        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(response.encode('utf-8'))

    def log_message(self, format, *args):
        pass


def get_auth_url():
    """OAuth 인증 URL 생성"""
    params = {
        'client_id': CLIENT_ID,
        'redirect_uri': f'http://localhost:{PORT}',
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
        'redirect_uri': f'http://localhost:{PORT}',
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
    global auth_code, server

    print("=" * 60)
    print("  Google OAuth 인증 (WSLg Chrome)")
    print("=" * 60)
    print()

    # 1. HTTP 서버 시작
    print("[1/5] OAuth 서버 시작...")
    server = HTTPServer(('0.0.0.0', PORT), OAuthHandler)
    server_thread = threading.Thread(target=lambda: server.handle_request())
    server_thread.start()
    print(f"      서버 시작됨 (localhost:{PORT})")

    # 2. OAuth URL 생성 및 브라우저 열기
    print()
    print("[2/5] 브라우저 열기...")
    auth_url = get_auth_url()

    # WSLg Chrome으로 열기
    try:
        subprocess.Popen([
            'google-chrome',
            '--new-window',
            auth_url
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("      Chrome이 열렸습니다. Google 로그인을 진행하세요.")
    except Exception as e:
        print(f"      Chrome 실행 오류: {e}")
        print("      아래 URL을 브라우저에서 열어주세요:")
        print()
        print(auth_url)

    # 3. 콜백 대기
    print()
    print("[3/5] 인증 대기 중...")
    server_thread.join(timeout=180)  # 3분 대기

    if not auth_code:
        print("      타임아웃 - 인증이 완료되지 않았습니다.")
        return

    print("      인증 코드 수신!")

    # 4. 토큰 교환
    print()
    print("[4/5] 토큰 교환 중...")
    tokens = exchange_code(auth_code)

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

    # 5. 라즈베리파이로 복사
    print()
    print("[5/5] 라즈베리파이로 복사 중...")

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
