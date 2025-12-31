#!/usr/bin/env python3
"""
라즈베리파이 Google OAuth 인터랙티브 인증
단일 SSH 세션에서 OAuth URL 생성 → 브라우저 열기 → 코드 입력 처리
"""

import paramiko
import re
import subprocess
import time
import sys

PI_HOST = "192.168.8.231"
PI_USER = "mino"
PI_PASS = "***REMOVED***"
GCLOUD_PATH = "~/google-cloud-sdk/bin/gcloud"

def main():
    print("=" * 60)
    print("  라즈베리파이 Google OAuth 인증")
    print("=" * 60)
    print()

    # SSH 연결
    print("[1/4] 라즈베리파이 SSH 연결 중...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(PI_HOST, username=PI_USER, password=PI_PASS, timeout=10)
        print(f"      연결 성공: {PI_USER}@{PI_HOST}")
    except Exception as e:
        print(f"      SSH 연결 실패: {e}")
        sys.exit(1)

    # 인터랙티브 셸 시작
    print()
    print("[2/4] OAuth 인증 URL 생성 중...")

    # 채널 열기
    channel = ssh.invoke_shell()
    time.sleep(1)

    # gcloud auth 실행 (--no-launch-browser 모드)
    channel.send(f"{GCLOUD_PATH} auth application-default login --no-launch-browser\n")

    # 출력 수집 (URL 나올 때까지)
    output = ""
    start_time = time.time()
    url_found = False

    while time.time() - start_time < 30:
        if channel.recv_ready():
            chunk = channel.recv(4096).decode('utf-8', errors='ignore')
            output += chunk

            # URL 찾기
            if 'accounts.google.com' in output and not url_found:
                url_match = re.search(r'(https://accounts\.google\.com/o/oauth2/auth\?[^\s\n]+)', output)
                if url_match:
                    auth_url = url_match.group(1).strip()
                    url_found = True
                    print(f"      URL 생성 완료!")
                    break
        time.sleep(0.2)

    if not url_found:
        print("      OAuth URL을 찾을 수 없습니다.")
        print("      출력:", output[-500:])
        ssh.close()
        sys.exit(1)

    # 브라우저에서 URL 열기
    print()
    print("[3/4] 브라우저에서 Google 로그인 페이지 열기...")
    try:
        subprocess.run(
            ["powershell.exe", "-Command", f"Start-Process '{auth_url}'"],
            capture_output=True,
            timeout=5
        )
        print("      브라우저가 열렸습니다!")
    except:
        print("      브라우저 자동 열기 실패. 아래 URL을 직접 열어주세요:")
        print()
        print(auth_url)

    # 사용자로부터 코드 입력받기
    print()
    print("-" * 60)
    print("Google 계정으로 로그인 후, 표시되는 인증 코드를 입력하세요:")
    print("-" * 60)
    auth_code = input("인증 코드: ").strip()

    if not auth_code:
        print("코드가 입력되지 않았습니다.")
        ssh.close()
        sys.exit(1)

    # 코드 전송 (같은 세션에서!)
    print()
    print("[4/4] 인증 코드 전송 중...")
    channel.send(auth_code + "\n")

    # 결과 대기
    time.sleep(3)
    result = ""
    while channel.recv_ready():
        result += channel.recv(4096).decode('utf-8', errors='ignore')

    # 추가 대기
    time.sleep(2)
    while channel.recv_ready():
        result += channel.recv(4096).decode('utf-8', errors='ignore')

    print()
    if "Credentials saved" in result or "credentials" in result.lower():
        print("=" * 60)
        print("  ✓ OAuth 인증 성공!")
        print("=" * 60)
        print()
        print("이제 라즈베리파이에서 Gemini API를 OAuth로 사용할 수 있습니다.")

        # 테스트
        print()
        print("Gemini API 테스트 중...")
        stdin, stdout, stderr = ssh.exec_command(
            "python3 -c \"from google import genai; from google.auth import default; c,p=default(); client=genai.Client(credentials=c); r=client.models.generate_content(model='gemini-2.0-flash', contents='안녕! 간단히 인사해줘.'); print(r.text)\""
        )
        test_result = stdout.read().decode() + stderr.read().decode()
        print()
        print("[Gemini 응답]")
        print(test_result)

    else:
        print("인증 결과:")
        print(result[-1000:])

    ssh.close()

if __name__ == "__main__":
    main()
