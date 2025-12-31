#!/usr/bin/env python3
"""
라즈베리파이 OAuth 인증 완료 스크립트
인증 코드를 입력받아 credentials 생성 및 테스트
"""

import paramiko
import sys
import time

PI_HOST = "192.168.8.231"
PI_USER = "mino"
PI_PASS = "***REMOVED***"

def main():
    print("=" * 60)
    print("  라즈베리파이 OAuth 인증 완료")
    print("=" * 60)
    print()

    # 인증 코드 입력
    auth_code = input("인증 코드를 입력하세요: ").strip()

    if not auth_code:
        print("인증 코드가 입력되지 않았습니다.")
        sys.exit(1)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(PI_HOST, username=PI_USER, password=PI_PASS, timeout=10)

    print()
    print("[1/3] 인증 코드로 OAuth 완료 중...")

    # gcloud에 코드 입력
    cmd = f"""echo '{auth_code}' | ~/google-cloud-sdk/bin/gcloud auth application-default login --no-launch-browser --scopes='https://www.googleapis.com/auth/generative-language,https://www.googleapis.com/auth/cloud-platform' 2>&1"""

    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)
    output = stdout.read().decode()

    print(output[:500])

    # credentials 확인
    print()
    print("[2/3] Credentials 확인...")
    stdin, stdout, stderr = ssh.exec_command("ls -la ~/.config/gcloud/application_default_credentials.json")
    result = stdout.read().decode().strip()

    if "application_default_credentials.json" in result:
        print("      ✓ Credentials 저장됨!")
        print(f"      {result}")

        # Gemini API 테스트
        print()
        print("[3/3] Gemini API 테스트...")

        test_code = '''
from google import genai
from google.auth import default
try:
    creds, proj = default()
    client = genai.Client(credentials=creds)
    r = client.models.generate_content(model="gemini-2.0-flash", contents="안녕! 간단히 한국어로 인사해줘.")
    print(r.text)
except Exception as e:
    print(f"Error: {e}")
'''

        stdin, stdout, stderr = ssh.exec_command(f'python3 -c \'{test_code}\'', timeout=60)
        output = stdout.read().decode()
        error = stderr.read().decode()

        print()
        print("=" * 60)
        print("  Gemini API 응답")
        print("=" * 60)
        print(output if output else error)
    else:
        print("      ✗ Credentials 파일이 없습니다.")
        print(f"      결과: {result}")

    ssh.close()

    print()
    print("=" * 60)
    print("  OAuth 인증 프로세스 완료")
    print("=" * 60)

if __name__ == "__main__":
    main()
