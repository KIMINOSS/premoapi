# n8n + Claude API Integration Guide

n8n에서 Claude API를 통합하는 방법을 설명합니다.

## 현재 환경
- **n8n 서버**: http://192.168.8.231:5678
- **로그인**: admin@premo.local / ***REMOVED***
- **컨테이너**: premo-n8n

## 통합 방법

### 방법 1: HTTP Request 노드 (권장)
Anthropic Credential 없이 API 키를 직접 전달하는 방식입니다.

**장점:**
- Credential 설정 불필요
- 요청마다 다른 API 키 사용 가능
- 더 유연한 파라미터 제어

**워크플로우 파일:** `claude-webhook-simple.json`

### 방법 2: Anthropic 노드
n8n 내장 Anthropic 노드를 사용하는 방식입니다.

**장점:**
- 더 간단한 설정
- n8n UI에서 직관적인 설정

**필요 조건:**
1. n8n에서 Anthropic Credentials 설정
2. Settings > Credentials > Add Credential > Anthropic API
3. API Key 입력

**워크플로우 파일:** `claude-with-anthropic-node.json`

## 생성된 워크플로우

### 1. Claude API - Webhook Trigger
Webhook으로 메시지를 받아 Claude API 호출 후 응답 반환

**엔드포인트:** `POST http://192.168.8.231:5678/webhook/claude-chat`

**요청 예시:**
```bash
curl -X POST 'http://192.168.8.231:5678/webhook/claude-chat' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "안녕하세요! 오늘 날씨 어때요?",
    "api_key": "sk-ant-api03-..."
  }'
```

**응답 예시:**
```json
{
  "response": "안녕하세요! 저는 AI 어시스턴트라 실제 날씨 정보에 접근할 수 없습니다...",
  "model": "claude-sonnet-4-20250514",
  "usage": {
    "input_tokens": 15,
    "output_tokens": 50
  },
  "timestamp": "2025-12-31T05:30:00.000Z"
}
```

### 2. Claude API - Email Analyzer
이메일 내용을 분석하고 긴급도, 카테고리, 요약 등을 반환

**엔드포인트:** `POST http://192.168.8.231:5678/webhook/analyze-email`

**요청 예시:**
```bash
curl -X POST 'http://192.168.8.231:5678/webhook/analyze-email' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "ceo@company.com",
    "subject": "긴급: 내일 회의 일정 변경",
    "content": "안녕하세요, 내일 예정된 전략 회의가 오후 2시에서 오전 10시로 변경되었습니다. 중요한 발표가 있으니 꼭 참석 부탁드립니다.",
    "api_key": "sk-ant-api03-..."
  }'
```

**응답 예시:**
```json
{
  "analysis": "1. 긴급도: 상\n2. 카테고리: 업무\n3. 요약: CEO로부터 내일 전략 회의 시간이 오후 2시에서 오전 10시로 변경되었음을 알림\n4. 필요한 조치: 캘린더 업데이트, 회의 준비 확인",
  "analyzed_at": "2025-12-31T05:30:00.000Z",
  "model_used": "claude-sonnet-4-20250514"
}
```

## Anthropic Credentials 설정 방법

n8n UI에서 Anthropic 노드를 사용하려면:

1. **n8n UI 접속**: http://192.168.8.231:5678
2. **Settings** > **Credentials** > **Add Credential**
3. **Anthropic API** 선택
4. API Key 입력:
   - Anthropic Console (console.anthropic.com)에서 API Key 생성
   - 형식: `sk-ant-api03-...`

## 환경 변수 설정 (선택)

n8n 컨테이너에 ANTHROPIC_API_KEY 환경 변수를 설정하면 워크플로우에서 기본값으로 사용할 수 있습니다.

```bash
# docker-compose.yml에 추가
environment:
  - ANTHROPIC_API_KEY=sk-ant-api03-...
```

또는 n8n UI에서:
1. **Settings** > **Variables**
2. **Add Variable**
3. Name: `ANTHROPIC_API_KEY`, Value: API 키

## 사용 가능한 Claude 모델

| 모델 | 설명 | 용도 |
|------|------|------|
| claude-opus-4-20250514 | 가장 강력한 모델 | 복잡한 추론, 코딩 |
| claude-sonnet-4-20250514 | 균형 잡힌 모델 (기본값) | 일반 용도 |
| claude-haiku-3-20240307 | 가장 빠른 모델 | 간단한 작업, 비용 효율 |

## 파일 구조

```
n8n_claude_workflows/
├── README.md                       # 이 파일
├── claude-webhook-simple.json      # HTTP Request 방식 워크플로우
└── claude-with-anthropic-node.json # Anthropic 노드 방식 워크플로우
```

## 관련 스크립트

- `n8n_claude_integration.py`: 워크플로우 자동 생성 스크립트
- `n8n_activate_workflows.py`: 워크플로우 활성화 스크립트

## 참고 자료

- [n8n Anthropic 문서](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.anthropic/)
- [n8n Anthropic Credentials 설정](https://docs.n8n.io/integrations/builtin/credentials/anthropic/)
- [Anthropic API 문서](https://docs.anthropic.com/en/api/messages)
- [Claude 모델 가격](https://www.anthropic.com/pricing)
