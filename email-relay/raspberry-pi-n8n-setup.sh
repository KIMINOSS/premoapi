#!/bin/bash
#
# PREMO 라즈베리파이 n8n 자동 설치 스크립트
# 사용법: bash raspberry-pi-n8n-setup.sh
#

set -e

echo "🍓 PREMO 라즈베리파이 n8n 설치 시작"
echo "========================================"

# 시스템 업데이트
echo "[1/6] 시스템 업데이트..."
sudo apt-get update && sudo apt-get upgrade -y

# Docker 설치 확인 및 설치
echo "[2/6] Docker 설치..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "  ✓ Docker 설치 완료"
else
    echo "  ✓ Docker 이미 설치됨"
fi

# Docker Compose 설치
echo "[3/6] Docker Compose 설치..."
if ! command -v docker-compose &> /dev/null; then
    sudo apt-get install -y docker-compose
    echo "  ✓ Docker Compose 설치 완료"
else
    echo "  ✓ Docker Compose 이미 설치됨"
fi

# n8n 디렉토리 생성
echo "[4/6] n8n 디렉토리 설정..."
mkdir -p ~/n8n-premo
cd ~/n8n-premo

# Docker Compose 파일 생성
echo "[5/6] Docker Compose 설정 파일 생성..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: premo-n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=premo
      - N8N_BASIC_AUTH_PASSWORD=premo2025
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - WEBHOOK_URL=http://192.168.8.231:5678/
      - GENERIC_TIMEZONE=Asia/Seoul
      - TZ=Asia/Seoul
    volumes:
      - ./n8n-data:/home/node/.n8n
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:5678/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

volumes:
  n8n-data:
EOF

# n8n 이메일 릴레이 워크플로우 JSON 생성
mkdir -p workflows
cat > workflows/premo-email-relay.json << 'EOF'
{
  "name": "PREMO Email Relay",
  "nodes": [
    {
      "parameters": {
        "pollTimes": {
          "item": [
            {
              "mode": "everyMinute"
            }
          ]
        },
        "filters": {
          "readStatus": "unread",
          "receivedAfter": "={{ $now.minus(1, 'hour').toISO() }}"
        }
      },
      "id": "gmail-trigger",
      "name": "Gmail Trigger",
      "type": "n8n-nodes-base.gmailTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.subject }}",
              "operation": "contains",
              "value2": "[TO:"
            }
          ]
        }
      },
      "id": "if-has-to-tag",
      "name": "Has [TO:] Tag?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "mode": "runOnceForAllItems",
        "jsCode": "const items = $input.all();\nconst results = [];\n\nfor (const item of items) {\n  const subject = item.json.subject || '';\n  const match = subject.match(/\\[TO:([^\\]]+)\\]/);\n  \n  if (match) {\n    const actualRecipient = match[1].trim();\n    const cleanSubject = subject.replace(/\\[TO:[^\\]]+\\]\\s*/, '').trim();\n    \n    results.push({\n      json: {\n        ...item.json,\n        actualRecipient,\n        cleanSubject,\n        originalSubject: subject\n      }\n    });\n  }\n}\n\nreturn results;"
      },
      "id": "parse-recipient",
      "name": "Parse Recipient",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "sendTo": "={{ $json.actualRecipient }}",
        "subject": "={{ $json.cleanSubject }}",
        "emailType": "html",
        "message": "={{ $json.body }}",
        "options": {}
      },
      "id": "send-email",
      "name": "Send via Outlook",
      "type": "n8n-nodes-base.microsoftOutlook",
      "typeVersion": 2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "messageId": "={{ $json.id }}",
        "options": {
          "markAsRead": true
        }
      },
      "id": "mark-read",
      "name": "Mark as Read",
      "type": "n8n-nodes-base.gmail",
      "typeVersion": 2,
      "position": [1050, 300]
    }
  ],
  "connections": {
    "Gmail Trigger": {
      "main": [
        [
          {
            "node": "Has [TO:] Tag?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Has [TO:] Tag?": {
      "main": [
        [
          {
            "node": "Parse Recipient",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Parse Recipient": {
      "main": [
        [
          {
            "node": "Send via Outlook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Send via Outlook": {
      "main": [
        [
          {
            "node": "Mark as Read",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
EOF

# n8n 시작
echo "[6/6] n8n 컨테이너 시작..."
sudo docker-compose up -d

# 상태 확인
echo ""
echo "========================================"
echo "✅ n8n 설치 완료!"
echo ""
echo "📌 접속 정보:"
echo "   URL: http://192.168.8.231:5678"
echo "   사용자: premo"
echo "   비밀번호: premo2025"
echo ""
echo "📌 다음 단계:"
echo "   1. 브라우저에서 위 URL 접속"
echo "   2. Gmail OAuth 연결 설정"
echo "   3. Microsoft Outlook OAuth 연결 설정"
echo "   4. 워크플로우 활성화"
echo ""
echo "📌 관리 명령어:"
echo "   로그 확인: docker logs premo-n8n"
echo "   재시작: docker-compose restart"
echo "   중지: docker-compose down"
echo "========================================"
