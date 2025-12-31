#!/usr/bin/env python3
"""
Google OAuth 인증 - Playwright 자동 코드 추출
1. gcloud로 OAuth URL 생성
2. Playwright로 브라우저 열기
3. 사용자가 Google 로그인 (수동)
4. 콜백 페이지에서 코드 자동 추출
5. gcloud에 코드 전송
"""

import subprocess
import os
import re
import time
import sys

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("playwright 설치 중...")
    subprocess.run([sys.executable, "-m", "pip", "install", "playwright", "--break-system-packages", "-q"])
    subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"])
    from playwright.sync_api import sync_playwright

GCLOUD = os.path.expanduser("~/google-cloud-sdk-temp/google-cloud-sdk/bin/gcloud")

# Raspberry Pi 설정
PI_HOST = "192.168.8.231"
PI_USER = "mino"
PI_PASS = "***REMOVED***"

def main():
    print("=" * 60)
    print("  Google OAuth 인증 (Playwright 자동화)")
    print("=" * 60)
    print()

    # 1. OAuth URL 생성
    print("[1/5] OAuth URL 생성 중...")

    # Popen으로 gcloud 실행 (stdin/stdout 파이프)
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
    while True:
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
        process.terminate()
        sys.exit(1)

    # 2. Playwright로 브라우저 열기
    print()
    print("[2/5] 브라우저 열기...")

    auth_code = None

    with sync_playwright() as p:
        # 사용자 데이터 디렉토리 사용 (로그인 상태 유지)
        user_data_dir = os.path.expanduser("~/.playwright_chrome_data")
        os.makedirs(user_data_dir, exist_ok=True)

        browser = p.chromium.launch_persistent_context(
            user_data_dir,
            headless=False,
            args=["--start-maximized"]
        )

        page = browser.new_page()

        print("      Google 로그인 페이지로 이동 중...")
        page.goto(auth_url)

        # 3. 사용자가 로그인할 때까지 대기
        print()
        print("[3/5] Google 계정으로 로그인하세요...")
        print("      (브라우저에서 로그인 완료 후 자동으로 코드가 추출됩니다)")

        # 콜백 페이지 또는 코드가 표시될 때까지 대기
        max_wait = 180  # 3분
        start_time = time.time()

        while time.time() - start_time < max_wait:
            try:
                # 페이지 로딩 대기
                page.wait_for_load_state("domcontentloaded", timeout=3000)
            except:
                pass

            try:
                current_url = page.url
                content = page.content()
            except Exception as e:
                time.sleep(1)
                continue

            # 콜백 페이지 확인
            if "applicationdefaultauthcode" in current_url or "code=" in current_url:
                # 코드 추출 시도
                # 방법 1: URL에서 code 파라미터
                code_match = re.search(r'[?&]code=([^&]+)', current_url)
                if code_match:
                    auth_code = code_match.group(1)
                    print(f"      코드 추출 완료! (URL)")
                    break

                # 방법 2: 페이지 내용에서 추출
                # "4/" 또는 코드 형식 찾기
                code_patterns = [
                    r'<code[^>]*>([^<]+)</code>',
                    r'authorization.*?code.*?[:\s]+([4/][^\s<"\']+)',
                    r'value="([4/][^"]+)"',
                    r'>([4/][A-Za-z0-9_-]{20,})<',
                ]
                for pattern in code_patterns:
                    match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
                    if match:
                        potential_code = match.group(1).strip()
                        if len(potential_code) > 20 and potential_code.startswith("4/"):
                            auth_code = potential_code
                            print(f"      코드 추출 완료! (페이지)")
                            break

                if auth_code:
                    break

                # 텍스트 입력 필드에서 코드 찾기
                try:
                    code_input = page.query_selector('input[readonly], textarea[readonly], input[value*="4/"]')
                    if code_input:
                        auth_code = code_input.get_attribute('value')
                        if auth_code and auth_code.startswith("4/"):
                            print(f"      코드 추출 완료! (input)")
                            break
                except:
                    pass

            time.sleep(1)

        browser.close()

    if not auth_code:
        print("      코드 추출 실패. 시간 초과.")
        process.terminate()
        sys.exit(1)

    # 4. gcloud에 코드 전송
    print()
    print("[4/5] 인증 코드 전송 중...")
    process.stdin.write(auth_code + "\n")
    process.stdin.flush()

    # 결과 대기
    try:
        remaining_output, _ = process.communicate(timeout=30)
        output += remaining_output
    except:
        output += process.stdout.read()

    # 5. 결과 확인
    print()
    if "Credentials saved" in output:
        print("[5/5] OAuth 인증 성공!")
        print()
        print("=" * 60)
        print("  ✓ Credentials 저장 완료!")
        print("=" * 60)

        # 라즈베리파이로 복사 (paramiko 사용)
        print()
        print("라즈베리파이로 credentials 복사 중...")
        creds_path = os.path.expanduser("~/.config/gcloud/application_default_credentials.json")
        if os.path.exists(creds_path):
            try:
                import paramiko
                ssh = paramiko.SSHClient()
                ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                ssh.connect(PI_HOST, username=PI_USER, password=PI_PASS, timeout=10)

                # 디렉토리 생성
                ssh.exec_command('mkdir -p ~/.config/gcloud')

                # 파일 복사
                sftp = ssh.open_sftp()
                sftp.put(creds_path, '/home/mino/.config/gcloud/application_default_credentials.json')
                sftp.close()

                print("      복사 완료!")

                # 테스트
                print()
                print("Gemini API 테스트 중...")
                test_code = '''
from google import genai
from google.auth import default
creds, proj = default()
client = genai.Client(credentials=creds)
r = client.models.generate_content(model="gemini-2.0-flash", contents="Hi! Introduce yourself briefly in Korean.")
print(r.text)
'''
                stdin, stdout, stderr = ssh.exec_command(f'python3 -c "{test_code}"', timeout=60)
                result = stdout.read().decode()
                error = stderr.read().decode()
                ssh.close()

                print()
                print("[Gemini 응답]")
                print(result if result else error)
            except Exception as e:
                print(f"      오류: {e}")
    else:
        print("[5/5] 인증 결과:")
        print(output[-500:])

if __name__ == "__main__":
    main()
