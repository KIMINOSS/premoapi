#!/usr/bin/env python3
"""
WSL에서 Google OAuth 인증 후 라즈베리파이로 credentials 복사
pexpect + paramiko 사용
"""

import pexpect
import subprocess
import re
import os
import sys
import paramiko

GCLOUD = os.path.expanduser("~/google-cloud-sdk-temp/google-cloud-sdk/bin/gcloud")
CREDENTIALS_PATH = os.path.expanduser("~/.config/gcloud/application_default_credentials.json")

PI_HOST = "192.168.8.231"
PI_USER = "mino"
PI_PASS = "***REMOVED***"

def copy_to_pi(local_path, remote_path):
    """paramiko를 사용하여 파일 복사"""
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
    r = client.models.generate_content(model="gemini-2.0-flash", contents="Hi! Say hello in Korean.")
    print(r.text)
except Exception as e:
    print(f"Error: {e}")
'''

    stdin, stdout, stderr = ssh.exec_command(f'python3 -c "{test_code}"', timeout=60)
    output = stdout.read().decode()
    error = stderr.read().decode()
    ssh.close()

    return output if output else error

def main():
    print("=" * 60)
    print("  Google OAuth (WSL -> Raspberry Pi)")
    print("=" * 60)
    print()

    # gcloud 존재 확인
    if not os.path.exists(GCLOUD):
        print(f"ERROR: gcloud not found at {GCLOUD}")
        sys.exit(1)

    # 1. gcloud 실행
    print("[1/4] OAuth URL...")
    cmd = f"{GCLOUD} auth application-default login --no-launch-browser --scopes=https://www.googleapis.com/auth/generative-language,https://www.googleapis.com/auth/cloud-platform"
    child = pexpect.spawn(cmd, encoding='utf-8', timeout=120)

    # URL 추출
    try:
        child.expect(r'(https://accounts\.google\.com[^\s]+)', timeout=30)
        auth_url = child.match.group(1)
        print("      URL OK!")
    except Exception as e:
        print(f"      URL Error: {e}")
        print(child.before if child.before else "")
        sys.exit(1)

    # 2. 브라우저 열기
    print()
    print("[2/4] Opening browser...")
    try:
        subprocess.run(
            ["powershell.exe", "-Command", f"Start-Process '{auth_url}'"],
            capture_output=True,
            timeout=5
        )
        print("      Browser opened!")
    except:
        print("      Browser failed. Open manually:")
        print()
        print(auth_url)

    # 3. 코드 입력 대기
    print()
    print("-" * 60)
    print("Login with Google, then enter the verification code.")
    print("-" * 60)

    auth_code = input("Code: ").strip()

    if not auth_code:
        print("No code entered.")
        child.close()
        sys.exit(1)

    # 4. 코드 전송
    print()
    print("[3/4] Sending code...")
    child.sendline(auth_code)

    # 결과 대기
    try:
        child.expect(["Credentials saved", "error", "Error", pexpect.EOF], timeout=30)
        output = child.before + (child.after if isinstance(child.after, str) else "")
    except:
        output = child.before if child.before else ""

    child.close()

    if "Credentials saved" in str(output):
        print("      OAuth SUCCESS!")

        if os.path.exists(CREDENTIALS_PATH):
            print(f"      Saved: {CREDENTIALS_PATH}")

            # 5. 라즈베리파이로 복사
            print()
            print("[4/4] Copying to Raspberry Pi...")

            try:
                copy_to_pi(CREDENTIALS_PATH, "/home/mino/.config/gcloud/application_default_credentials.json")
                print("      Copy complete!")

                # 테스트
                print()
                print("=" * 60)
                print("  Testing Gemini API on Raspberry Pi")
                print("=" * 60)

                result = test_gemini_on_pi()
                print()
                print("[Gemini Response]")
                print(result)

            except Exception as e:
                print(f"      Copy error: {e}")
        else:
            print("      Credentials file not found.")
    else:
        print("      OAuth FAILED")
        print(str(output)[-500:])

if __name__ == "__main__":
    main()
