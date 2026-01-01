#!/usr/bin/env python3
"""
완전 자동화된 Google OAuth 인증
로컬 HTTP 서버로 콜백을 받아 credentials 생성 후 라즈베리파이로 복사
"""

import json
import os
import subprocess
import socket
import urllib.parse
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import paramiko
import requests

# 설정
PI_HOST = "192.168.8.231"
PI_USER = "mino"
PI_PASS = os.environ.get("PI_PASS")
if not PI_PASS: raise ValueError("PI_PASS 환경변수 필요")
CREDENTIALS_PATH = os.path.expanduser("~/.config/gcloud/application_default_credentials.json")

# Google OAuth 설정 (gcloud CLI 기본 클라이언트 ID)
CLIENT_ID = "32555940559.apps.googleusercontent.com"
CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
if not CLIENT_SECRET: raise ValueError('GOOGLE_CLIENT_SECRET 환경변수 필요')
REDIRECT_URI = "http://localhost:8085"
SCOPES = [
    "https://www.googleapis.com/auth/generative-language",
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid"
]

auth_code = None
auth_error = None


class OAuthHandler(BaseHTTPRequestHandler):
    """OAuth 콜백 핸들러"""

    def do_GET(self):
        global auth_code, auth_error

        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)

        if 'code' in params:
            auth_code = params['code'][0]
            response = """
            <html><body style='font-family: sans-serif; text-align: center; padding-top: 50px;'>
            <h1 style='color: green;'>인증 성공!</h1>
            <p>이 창을 닫아도 됩니다.</p>
            </body></html>
            """
        elif 'error' in params:
            auth_error = params.get('error_description', params['error'])[0]
            response = f"""
            <html><body style='font-family: sans-serif; text-align: center; padding-top: 50px;'>
            <h1 style='color: red;'>인증 실패</h1>
            <p>{auth_error}</p>
            </body></html>
            """
        else:
            response = "<html><body>Unknown request</body></html>"

        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(response.encode())

    def log_message(self, format, *args):
        pass  # 로그 숨기기


def find_free_port():
    """사용 가능한 포트 찾기"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]


def exchange_code_for_tokens(code):
    """인증 코드를 토큰으로 교환"""
    token_url = "https://oauth2.googleapis.com/token"

    data = {
        'code': code,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'redirect_uri': REDIRECT_URI,
        'grant_type': 'authorization_code'
    }

    response = requests.post(token_url, data=data)
    return response.json()


def save_credentials(tokens):
    """credentials 파일 저장"""
    credentials = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": tokens.get("refresh_token"),
        "type": "authorized_user"
    }

    os.makedirs(os.path.dirname(CREDENTIALS_PATH), exist_ok=True)

    with open(CREDENTIALS_PATH, 'w') as f:
        json.dump(credentials, f, indent=2)

    return CREDENTIALS_PATH


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
    global auth_code, auth_error

    print("=" * 60)
    print("  Google OAuth 자동 인증")
    print("=" * 60)
    print()

    # 1. 로컬 HTTP 서버 시작
    print("[1/4] OAuth 서버 시작...")
    server = HTTPServer(('localhost', 8085), OAuthHandler)
    server_thread = threading.Thread(target=server.handle_request)
    server_thread.start()
    print("      서버 시작됨 (localhost:8085)")

    # 2. OAuth URL 생성 및 브라우저 열기
    print()
    print("[2/4] Google 로그인 페이지 열기...")

    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={CLIENT_ID}&"
        f"redirect_uri={urllib.parse.quote(REDIRECT_URI)}&"
        "response_type=code&"
        f"scope={urllib.parse.quote(' '.join(SCOPES))}&"
        "access_type=offline&"
        "prompt=consent"
    )

    try:
        subprocess.run(
            ["powershell.exe", "-Command", f"Start-Process '{auth_url}'"],
            capture_output=True,
            timeout=5
        )
        print("      브라우저가 열렸습니다. Google 계정으로 로그인하세요...")
    except:
        print("      브라우저 자동 열기 실패. 아래 URL을 열어주세요:")
        print()
        print(auth_url)

    # 3. 콜백 대기
    print()
    print("[3/4] 인증 대기 중...")
    server_thread.join(timeout=120)  # 2분 대기

    if auth_code:
        print("      인증 코드 수신!")

        # 토큰 교환
        print()
        print("      토큰 교환 중...")
        tokens = exchange_code_for_tokens(auth_code)

        if 'refresh_token' in tokens:
            print("      토큰 획득 성공!")

            # credentials 저장
            cred_path = save_credentials(tokens)
            print(f"      Credentials 저장됨: {cred_path}")

            # 4. 라즈베리파이로 복사
            print()
            print("[4/4] 라즈베리파이로 복사...")

            try:
                copy_to_pi(cred_path, "/home/mino/.config/gcloud/application_default_credentials.json")
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
                print(f"      복사 오류: {e}")
        else:
            print(f"      토큰 오류: {tokens}")
    elif auth_error:
        print(f"      인증 오류: {auth_error}")
    else:
        print("      타임아웃 - 120초 내에 인증을 완료하지 못했습니다.")

    server.server_close()


if __name__ == "__main__":
    main()
