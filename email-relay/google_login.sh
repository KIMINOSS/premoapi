#!/bin/bash
# Google OAuth 로그인 스크립트
# 이 스크립트를 직접 실행하여 Google 계정으로 인증하세요

echo "=============================================="
echo "  Google OAuth 로그인"
echo "=============================================="
echo ""

GCLOUD_PATH="$HOME/google-cloud-sdk/bin/gcloud"

if [ ! -f "$GCLOUD_PATH" ]; then
    echo "gcloud CLI가 설치되어 있지 않습니다."
    echo "설치 중..."
    curl -sS https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-x86_64.tar.gz | tar -xz -C ~
    ~/google-cloud-sdk/install.sh --quiet
fi

echo "브라우저에서 Google 계정으로 로그인하세요."
echo ""

# OAuth 인증 실행
$GCLOUD_PATH auth application-default login

if [ $? -eq 0 ]; then
    echo ""
    echo "인증 성공!"
    echo "이제 Gemini CLI를 사용할 수 있습니다."
else
    echo ""
    echo "인증 실패. 다시 시도해주세요."
fi
