#!/bin/bash
#
# PREMO 원격 설치 스크립트
# 라즈베리파이에 SSH로 접속하여 n8n 자동 설치
#

PI_HOST="192.168.8.231"
PI_USER="mino"
PI_PASS="***REMOVED***"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 PREMO 라즈베리파이 원격 설치"
echo "================================"
echo "대상: ${PI_USER}@${PI_HOST}"
echo ""

# 연결 테스트
echo "[1/4] 연결 테스트..."
if ping -c 1 -W 3 ${PI_HOST} > /dev/null 2>&1; then
    echo "  ✓ 라즈베리파이 연결 가능"
else
    echo "  ✗ 라즈베리파이 연결 불가"
    echo ""
    echo "🔧 확인 사항:"
    echo "  1. 라즈베리파이 전원이 켜져 있는지 확인"
    echo "  2. 같은 네트워크에 연결되어 있는지 확인"
    echo "  3. IP 주소가 ${PI_HOST}가 맞는지 확인"
    exit 1
fi

# sshpass 확인
echo "[2/4] sshpass 확인..."
if ! command -v sshpass &> /dev/null; then
    echo "  sshpass 설치 필요"
    echo "  Ubuntu/Debian: sudo apt-get install sshpass"
    echo "  macOS: brew install hudochenkov/sshpass/sshpass"
    exit 1
fi
echo "  ✓ sshpass 사용 가능"

# 설치 스크립트 전송
echo "[3/4] 설치 스크립트 전송..."
sshpass -p "${PI_PASS}" scp -o StrictHostKeyChecking=no \
    "${SCRIPT_DIR}/raspberry-pi-n8n-setup.sh" \
    ${PI_USER}@${PI_HOST}:~/n8n-setup.sh

if [ $? -eq 0 ]; then
    echo "  ✓ 스크립트 전송 완료"
else
    echo "  ✗ 스크립트 전송 실패"
    exit 1
fi

# 원격 실행
echo "[4/4] 원격 설치 실행..."
sshpass -p "${PI_PASS}" ssh -o StrictHostKeyChecking=no \
    ${PI_USER}@${PI_HOST} \
    "chmod +x ~/n8n-setup.sh && bash ~/n8n-setup.sh"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 원격 설치 완료!"
    echo ""
    echo "📌 n8n 접속: http://${PI_HOST}:5678"
    echo "📌 사용자: premo / 비밀번호: premo2025"
else
    echo ""
    echo "⚠️ 설치 중 오류 발생"
    echo "수동 설치: ssh ${PI_USER}@${PI_HOST}"
fi
