#!/bin/bash
# Google OAuth 인증 스크립트 (tmux 세션 사용)
# 자동으로 URL 추출하고 브라우저 열기

GCLOUD="$HOME/google-cloud-sdk/bin/gcloud"
URL_FILE="/tmp/oauth_url.txt"
CODE_FILE="/tmp/oauth_code.txt"

echo "============================================================"
echo "  Google OAuth 인증"
echo "============================================================"
echo ""

# 기존 코드 파일 삭제
rm -f "$URL_FILE" "$CODE_FILE"

# tmux 세션에서 gcloud 실행
tmux kill-session -t oauth 2>/dev/null
tmux new-session -d -s oauth "$GCLOUD auth application-default login --no-launch-browser 2>&1 | tee /tmp/oauth_output.txt"

# URL이 나올 때까지 대기
echo "[1/4] OAuth URL 생성 대기 중..."
for i in {1..30}; do
    if [ -f /tmp/oauth_output.txt ]; then
        URL=$(grep -oP 'https://accounts\.google\.com/o/oauth2/auth\?[^\s]+' /tmp/oauth_output.txt 2>/dev/null | head -1)
        if [ -n "$URL" ]; then
            echo "      URL 생성 완료!"
            echo "$URL" > "$URL_FILE"
            break
        fi
    fi
    sleep 1
done

if [ ! -f "$URL_FILE" ]; then
    echo "URL 생성 실패"
    tmux kill-session -t oauth 2>/dev/null
    exit 1
fi

# 브라우저 열기
echo ""
echo "[2/4] 브라우저에서 Google 로그인 페이지 열기..."
URL=$(cat "$URL_FILE")
powershell.exe -Command "Start-Process '$URL'" 2>/dev/null

echo "      브라우저가 열렸습니다!"
echo ""
echo "------------------------------------------------------------"
echo "Google 계정으로 로그인 후, 표시되는 인증 코드를"
echo "아래 파일에 저장하세요:"
echo ""
echo "  echo '코드' > $CODE_FILE"
echo "------------------------------------------------------------"

# 코드 파일 대기
echo ""
echo "[3/4] 인증 코드 대기 중..."
for i in {1..300}; do
    if [ -f "$CODE_FILE" ]; then
        CODE=$(cat "$CODE_FILE" | tr -d '\n')
        if [ -n "$CODE" ]; then
            echo "      코드 감지됨!"
            break
        fi
    fi
    sleep 1
done

if [ ! -f "$CODE_FILE" ] || [ -z "$(cat "$CODE_FILE")" ]; then
    echo "코드 입력 시간 초과"
    tmux kill-session -t oauth 2>/dev/null
    exit 1
fi

# tmux 세션에 코드 전송
echo ""
echo "[4/4] 코드 전송 중..."
tmux send-keys -t oauth "$CODE" Enter

# 결과 대기
sleep 5

# 결과 확인
if grep -q "Credentials saved" /tmp/oauth_output.txt 2>/dev/null; then
    echo ""
    echo "============================================================"
    echo "  ✓ OAuth 인증 성공!"
    echo "============================================================"
else
    echo ""
    echo "결과:"
    tail -10 /tmp/oauth_output.txt 2>/dev/null
fi

tmux kill-session -t oauth 2>/dev/null
rm -f "$URL_FILE" "$CODE_FILE" /tmp/oauth_output.txt
