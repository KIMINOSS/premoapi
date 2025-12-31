#!/usr/bin/env python3
"""
Google OAuth 인증 플로우
브라우저에서 인증 후 코드를 입력하면 credentials 저장
"""

import subprocess
import os
import sys
import re

GCLOUD = os.path.expanduser("~/google-cloud-sdk/bin/gcloud")

def main():
    print("=" * 60)
    print("  Google OAuth 인증")
    print("=" * 60)
    print()

    # gcloud 명령 실행하여 URL 추출
    result = subprocess.run(
        [GCLOUD, "auth", "application-default", "login", "--no-launch-browser"],
        capture_output=True,
        text=True,
        timeout=10
    )

    output = result.stdout + result.stderr

    # URL 추출
    url_match = re.search(r'(https://accounts\.google\.com/o/oauth2/auth\?[^\s]+)', output)
    if url_match:
        auth_url = url_match.group(1)
        print("아래 URL을 브라우저에서 열어 Google 계정으로 로그인하세요:")
        print()
        print(auth_url)
        print()

        # Windows에서 브라우저 열기 시도
        try:
            subprocess.run(
                ["powershell.exe", "-Command", f"Start-Process '{auth_url}'"],
                capture_output=True,
                timeout=5
            )
            print("(브라우저가 자동으로 열렸습니다)")
        except:
            print("(브라우저에서 위 URL을 직접 열어주세요)")

        print()
        print("-" * 60)
        code = input("인증 후 표시되는 코드를 입력하세요: ").strip()

        if code:
            # 코드로 인증 완료
            auth_result = subprocess.run(
                [GCLOUD, "auth", "application-default", "login", "--no-launch-browser"],
                input=code + "\n",
                capture_output=True,
                text=True,
                timeout=30
            )

            if "Credentials saved" in auth_result.stdout + auth_result.stderr:
                print()
                print("인증 성공! Credentials가 저장되었습니다.")
                print()

                # 테스트
                test_gemini()
            else:
                print()
                print("인증 결과:")
                print(auth_result.stdout)
                print(auth_result.stderr)
    else:
        print("인증 URL을 찾을 수 없습니다.")
        print(output)

def test_gemini():
    """Gemini API 테스트"""
    print("=" * 60)
    print("  Gemini API 테스트")
    print("=" * 60)

    try:
        from google import genai
        from google.auth import default

        credentials, project = default()
        client = genai.Client(credentials=credentials)

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents="안녕! 나는 Claude야. 간단히 자기소개 해줘."
        )

        print()
        print("[Gemini 응답]")
        print(response.text)

    except Exception as e:
        print(f"테스트 오류: {e}")

if __name__ == "__main__":
    main()
