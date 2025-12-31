#!/usr/bin/env python3
"""
Google OAuth 인증 - 로컬 서버 콜백 방식
1. 로컬 HTTP 서버 시작 (콜백 수신용)
2. gcloud로 OAuth URL 생성
3. Windows 기본 브라우저로 URL 열기
4. 사용자가 로그인하면 콜백으로 코드 수신
5. gcloud에 코드 전송
"""

import subprocess
import os
import re
import time
import sys
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

GCLOUD = os.path.expanduser("~/google-cloud-sdk/bin/gcloud")

# 전역 변수로 코드 저장
auth_code_received = None
server_should_stop = False

class OAuthCallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global auth_code_received

        # URL에서 코드 파라미터 추출
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        if 'code' in params:
            auth_code_received = params['code'][0]

            # 성공 페이지 표시
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(b"""
<!DOCTYPE html>
<html>
<head><title>OAuth Success</title></head>
<body style="font-family: sans-serif; text-align: center; padding: 50px;">
    <h1 style="color: #4CAF50;">&#10004; OAuth Authorized!</h1>
    <p>You can close this window and return to the terminal.</p>
    <p style="color: #666;">Code received successfully.</p>
</body>
</html>
            """)
        else:
            # 에러 또는 다른 요청
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b"Waiting for OAuth callback...")

    def log_message(self, format, *args):
        pass  # 로그 숨기기

def run_server(port=8085):
    global server_should_stop
    server = HTTPServer(('localhost', port), OAuthCallbackHandler)
    server.timeout = 1
    while not server_should_stop and auth_code_received is None:
        server.handle_request()
    server.server_close()

def main():
    global auth_code_received, server_should_stop

    print("=" * 60)
    print("  Google OAuth 인증")
    print("=" * 60)
    print()

    # 1. 로컬 서버 시작
    print("[1/5] 로컬 콜백 서버 시작...")
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    print("      http://localhost:8085 에서 대기 중")

    # 2. OAuth URL 생성
    print()
    print("[2/5] OAuth URL 생성 중...")

    process = subprocess.Popen(
        [GCLOUD, "auth", "application-default", "login", "--no-launch-browser"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )

    # URL 읽기
    output = ""
    auth_url = None
    for _ in range(30):
        line = process.stdout.readline()
        if not line:
            break
        output += line
        if "accounts.google.com" in line:
            match = re.search(r'(https://accounts\.google\.com/o/oauth2/auth\?[^\s]+)', line)
            if match:
                auth_url = match.group(1).strip()
                print("      URL 생성 완료!")
                break

    if not auth_url:
        print("OAuth URL을 찾을 수 없습니다.")
        print(output)
        server_should_stop = True
        process.terminate()
        sys.exit(1)

    # 3. Windows 기본 브라우저로 열기
    print()
    print("[3/5] 브라우저에서 Google 로그인 페이지 열기...")
    try:
        subprocess.run(
            ["powershell.exe", "-Command", f"Start-Process '{auth_url}'"],
            capture_output=True,
            timeout=5
        )
        print("      브라우저가 열렸습니다!")
    except:
        print("      자동 열기 실패. 아래 URL을 브라우저에서 열어주세요:")
        print()
        print(auth_url)

    # 4. 코드 수신 대기
    print()
    print("[4/5] Google 로그인 후 인증 코드 대기 중...")
    print("      (로그인 완료 후 자동으로 코드가 수신됩니다)")

    # gcloud는 콜백이 아닌 수동 입력을 기다림
    # 따라서 페이지에서 코드를 복사해서 입력해야 함

    # 콜백 페이지에서 코드가 표시되면 사용자가 복사
    # 하지만 gcloud의 redirect_uri는 sdk.cloud.google.com이므로 로컬 서버로 오지 않음

    # 대안: 결과 페이지에서 코드 추출을 위해 파일 모니터링
    code_file = "/tmp/oauth_code.txt"

    print()
    print("-" * 60)
    print("Google 로그인 완료 후, 표시되는 인증 코드를 아래 명령으로 입력:")
    print()
    print(f"  echo '인증코드' > {code_file}")
    print("-" * 60)

    # 파일에서 코드 읽기 대기
    max_wait = 300  # 5분
    start_time = time.time()

    while time.time() - start_time < max_wait:
        if os.path.exists(code_file):
            with open(code_file, 'r') as f:
                code = f.read().strip()
            if code and len(code) > 10:
                auth_code_received = code
                os.remove(code_file)
                print("      코드 수신 완료!")
                break
        time.sleep(1)

    server_should_stop = True

    if not auth_code_received:
        print("      코드 수신 시간 초과.")
        process.terminate()
        sys.exit(1)

    # 5. gcloud에 코드 전송
    print()
    print("[5/5] 인증 코드 전송 중...")
    process.stdin.write(auth_code_received + "\n")
    process.stdin.flush()

    # 결과 대기
    try:
        remaining_output, _ = process.communicate(timeout=30)
        output += remaining_output
    except:
        pass

    # 결과 확인
    if "Credentials saved" in output:
        print()
        print("=" * 60)
        print("  ✓ OAuth 인증 성공!")
        print("=" * 60)

        # 라즈베리파이로 복사
        print()
        copy_to_pi()
    else:
        print()
        print("인증 결과:")
        print(output[-500:])

def copy_to_pi():
    """Credentials를 라즈베리파이로 복사"""
    creds_path = os.path.expanduser("~/.config/gcloud/application_default_credentials.json")

    if not os.path.exists(creds_path):
        print("Credentials 파일을 찾을 수 없습니다.")
        return

    print("라즈베리파이로 credentials 복사 중...")

    # 디렉토리 생성
    subprocess.run(
        "sshpass -p '***REMOVED***' ssh -o StrictHostKeyChecking=no mino@192.168.8.231 'mkdir -p ~/.config/gcloud'",
        shell=True, capture_output=True
    )

    # 파일 복사
    result = subprocess.run(
        f"sshpass -p '***REMOVED***' scp -o StrictHostKeyChecking=no {creds_path} mino@192.168.8.231:~/.config/gcloud/",
        shell=True, capture_output=True
    )

    if result.returncode == 0:
        print("      복사 완료!")

        # 테스트
        print()
        print("Gemini API 테스트 중...")
        test_cmd = """sshpass -p '***REMOVED***' ssh -o StrictHostKeyChecking=no mino@192.168.8.231 'python3 -c "
from google import genai
from google.auth import default
creds, proj = default()
client = genai.Client(credentials=creds)
r = client.models.generate_content(model=\\\"gemini-2.0-flash\\\", contents=\\\"안녕! 간단히 자기소개 해줘.\\\")
print(r.text)
"'"""
        test_result = subprocess.run(test_cmd, shell=True, capture_output=True, text=True, timeout=60)
        print()
        print("[Gemini 응답]")
        print(test_result.stdout if test_result.stdout else test_result.stderr)
    else:
        print(f"      복사 실패: {result.stderr.decode()}")

if __name__ == "__main__":
    main()
