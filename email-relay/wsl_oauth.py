#!/usr/bin/env python3
"""
WSL에서 Google OAuth 인증 후 라즈베리파이로 credentials 복사
pexpect 사용으로 인터랙티브 gcloud 지원
"""

import pexpect
import subprocess
import re
import os
import sys

GCLOUD = os.path.expanduser("~/google-cloud-sdk/bin/gcloud")
CREDENTIALS_PATH = os.path.expanduser("~/.config/gcloud/application_default_credentials.json")

PI_HOST = "192.168.8.231"
PI_USER = "mino"
PI_PASS = os.environ.get("PI_PASS")
if not PI_PASS: raise ValueError("PI_PASS 환경변수 필요")

def main():
    print("=" * 60)
    print("  Google OAuth 인증 (WSL → Raspberry Pi)")
    print("=" * 60)
    print()

    # 1. gcloud 실행
    print("[1/4] OAuth URL 생성 중...")
    child = pexpect.spawn(f"{GCLOUD} auth application-default login --no-launch-browser", encoding='utf-8', timeout=120)

    # URL 추출
    child.expect(r'(https://accounts\.google\.com/o/oauth2/auth\?[^\s]+)')
    auth_url = child.match.group(1)
    print("      URL 생성 완료!")

    # 2. 브라우저 열기
    print()
    print("[2/4] 브라우저에서 Google 로그인 페이지 열기...")
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

    # 3. 코드 입력 대기 (gcloud가 기다리는 동안)
    print()
    print("-" * 60)
    print("Google 계정으로 로그인 후, 표시되는 인증 코드를 입력하세요.")
    print("-" * 60)

    # gcloud가 코드 입력을 기다림
    try:
        child.expect("verification code:", timeout=120)
    except:
        pass  # 이미 프롬프트가 나왔을 수 있음

    # 사용자 입력 받기
    auth_code = input("인증 코드: ").strip()

    if not auth_code:
        print("코드가 입력되지 않았습니다.")
        child.close()
        sys.exit(1)

    # 4. 코드 전송
    print()
    print("[3/4] 인증 코드 전송 중...")
    child.sendline(auth_code)

    # 결과 대기
    try:
        child.expect(["Credentials saved", "error", pexpect.EOF], timeout=30)
        output = child.before + child.after if child.after else child.before
    except:
        output = child.before if child.before else ""

    if "Credentials saved" in str(output):
        print("      OAuth 인증 성공!")

        # credentials 파일 확인
        if os.path.exists(CREDENTIALS_PATH):
            print(f"      Credentials 저장됨: {CREDENTIALS_PATH}")

            # 5. 라즈베리파이로 복사
            print()
            print("[4/4] 라즈베리파이로 credentials 복사 중...")

            # sshpass 사용해서 scp
            try:
                # 먼저 디렉토리 생성
                ssh_cmd = f"sshpass -p '{PI_PASS}' ssh -o StrictHostKeyChecking=no {PI_USER}@{PI_HOST} 'mkdir -p ~/.config/gcloud'"
                subprocess.run(ssh_cmd, shell=True, capture_output=True, timeout=10)

                # 파일 복사
                scp_cmd = f"sshpass -p '{PI_PASS}' scp -o StrictHostKeyChecking=no {CREDENTIALS_PATH} {PI_USER}@{PI_HOST}:~/.config/gcloud/"
                result = subprocess.run(scp_cmd, shell=True, capture_output=True, timeout=30, text=True)

                if result.returncode == 0:
                    print("      복사 완료!")

                    # 테스트
                    print()
                    print("=" * 60)
                    print("  Gemini API 테스트 (라즈베리파이)")
                    print("=" * 60)

                    test_cmd = f"""sshpass -p '{PI_PASS}' ssh -o StrictHostKeyChecking=no {PI_USER}@{PI_HOST} 'python3 -c "
from google import genai
from google.auth import default
try:
    creds, proj = default()
    client = genai.Client(credentials=creds)
    r = client.models.generate_content(model=\"gemini-2.0-flash\", contents=\"안녕! 간단히 자기소개 해줘.\")
    print(r.text)
except Exception as e:
    print(f\"오류: {{e}}\")
"'"""
                    test_result = subprocess.run(test_cmd, shell=True, capture_output=True, timeout=60, text=True)
                    print()
                    print("[Gemini 응답]")
                    print(test_result.stdout if test_result.stdout else test_result.stderr)
                else:
                    print(f"      SCP 실패: {result.stderr}")
            except Exception as e:
                print(f"      복사 오류: {e}")
        else:
            print("      Credentials 파일을 찾을 수 없습니다.")
    else:
        print("      인증 실패")
        print(str(output)[-500:])

    child.close()

if __name__ == "__main__":
    main()
