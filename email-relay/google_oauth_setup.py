#!/usr/bin/env python3
"""
Google OAuth 인증 설정 스크립트
Gemini API를 사용하기 위한 Google 계정 인증
"""

import os
import json
import subprocess
import sys

GCLOUD_PATH = os.path.expanduser("~/google-cloud-sdk/bin/gcloud")
CREDENTIALS_PATH = os.path.expanduser("~/.config/gcloud/application_default_credentials.json")

def check_gcloud():
    """gcloud CLI 설치 확인"""
    if not os.path.exists(GCLOUD_PATH):
        print("gcloud CLI가 설치되어 있지 않습니다.")
        return False
    return True

def check_credentials():
    """기존 인증 확인"""
    if os.path.exists(CREDENTIALS_PATH):
        try:
            with open(CREDENTIALS_PATH) as f:
                creds = json.load(f)
                if 'client_id' in creds:
                    print(f"기존 인증 발견: {CREDENTIALS_PATH}")
                    return True
        except:
            pass
    return False

def run_auth():
    """OAuth 인증 실행"""
    print("=" * 60)
    print("  Google OAuth 인증")
    print("=" * 60)
    print()
    print("브라우저에서 Google 계정으로 로그인하세요.")
    print()

    # 인증 실행
    result = subprocess.run(
        [GCLOUD_PATH, "auth", "application-default", "login"],
        capture_output=False
    )

    if result.returncode == 0:
        print()
        print("인증 성공!")
        return True
    else:
        print()
        print("인증 실패. 다시 시도해주세요.")
        return False

def test_gemini():
    """Gemini API 테스트"""
    print()
    print("=" * 60)
    print("  Gemini API 테스트")
    print("=" * 60)

    try:
        from google import genai
        from google.auth import default

        # ADC 사용
        credentials, project = default()
        client = genai.Client(credentials=credentials)

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents="안녕! 간단히 자기소개 해줘."
        )

        print()
        print("[Gemini 응답]")
        print(response.text)
        return True

    except Exception as e:
        print(f"오류: {e}")
        return False

def main():
    if not check_gcloud():
        print("먼저 gcloud CLI를 설치하세요:")
        print("  curl -sS https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-x86_64.tar.gz | tar -xz -C ~")
        print("  ~/google-cloud-sdk/install.sh")
        sys.exit(1)

    if check_credentials():
        print("기존 인증이 있습니다. 테스트를 진행합니다.")
    else:
        print("인증이 필요합니다.")
        if not run_auth():
            sys.exit(1)

    test_gemini()

if __name__ == "__main__":
    main()
