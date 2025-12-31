#!/usr/bin/env python3
"""
n8n + Claude Integration Script
Creates workflows for Claude API integration in n8n
"""

import requests
import json
import os
from datetime import datetime

# n8n Configuration
N8N_BASE_URL = "http://192.168.8.231:5678"
N8N_EMAIL = "admin@premo.local"
N8N_PASSWORD = "***REMOVED***"

class N8nClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_cookie = None

    def login(self, email: str, password: str) -> bool:
        """Login to n8n and get auth cookie"""
        response = self.session.post(
            f"{self.base_url}/rest/login",
            json={"emailOrLdapLoginId": email, "password": password}
        )
        if response.status_code == 200:
            self.auth_cookie = response.cookies.get("n8n-auth")
            # 쿠키를 세션에 명시적으로 설정
            if self.auth_cookie:
                self.session.cookies.set("n8n-auth", self.auth_cookie)
            print(f"[OK] n8n 로그인 성공 (Cookie: {self.auth_cookie[:20] if self.auth_cookie else 'None'}...)")
            return True
        print(f"[ERROR] 로그인 실패: {response.text}")
        return False

    def get_workflows(self) -> list:
        """Get all workflows"""
        headers = {"Cookie": f"n8n-auth={self.auth_cookie}"} if self.auth_cookie else {}
        response = self.session.get(f"{self.base_url}/rest/workflows", headers=headers)
        print(f"[DEBUG] get_workflows status: {response.status_code}")
        if response.status_code == 200:
            return response.json().get("data", [])
        print(f"[DEBUG] get_workflows error: {response.text}")
        return []

    def create_workflow(self, workflow_data: dict) -> dict:
        """Create a new workflow"""
        headers = {
            "Content-Type": "application/json",
            "Cookie": f"n8n-auth={self.auth_cookie}"
        } if self.auth_cookie else {"Content-Type": "application/json"}

        response = self.session.post(
            f"{self.base_url}/rest/workflows",
            json=workflow_data,
            headers=headers
        )
        if response.status_code in [200, 201]:
            print(f"[OK] 워크플로우 생성 성공: {workflow_data.get('name')}")
            return response.json()
        print(f"[ERROR] 워크플로우 생성 실패: {response.status_code} - {response.text[:200]}")
        return {}

    def activate_workflow(self, workflow_id: str) -> bool:
        """Activate a workflow"""
        headers = {
            "Content-Type": "application/json",
            "Cookie": f"n8n-auth={self.auth_cookie}"
        } if self.auth_cookie else {"Content-Type": "application/json"}

        response = self.session.post(
            f"{self.base_url}/rest/workflows/{workflow_id}/activate",
            headers=headers
        )
        if response.status_code == 200:
            print(f"[OK] 워크플로우 활성화 완료: {workflow_id}")
            return True
        print(f"[ERROR] 활성화 실패: {response.status_code} - {response.text[:200]}")
        return False

    def create_credential(self, credential_data: dict) -> dict:
        """Create a credential"""
        response = self.session.post(
            f"{self.base_url}/rest/credentials",
            json=credential_data
        )
        if response.status_code in [200, 201]:
            print(f"[OK] Credential 생성 성공: {credential_data.get('name')}")
            return response.json()
        print(f"[ERROR] Credential 생성 실패: {response.status_code} - {response.text}")
        return {}


def create_claude_webhook_workflow() -> dict:
    """
    Claude API를 HTTP Request로 호출하는 Webhook 워크플로우
    Webhook 수신 -> Claude API 호출 -> 응답 반환
    """
    return {
        "name": "Claude API - Webhook Trigger",
        "nodes": [
            {
                "id": "webhook-trigger",
                "name": "Webhook",
                "type": "n8n-nodes-base.webhook",
                "typeVersion": 2,
                "position": [250, 300],
                "webhookId": "claude-api-webhook",
                "parameters": {
                    "path": "claude-chat",
                    "httpMethod": "POST",
                    "responseMode": "responseNode",
                    "options": {}
                }
            },
            {
                "id": "http-claude",
                "name": "Claude API Call",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.2,
                "position": [500, 300],
                "parameters": {
                    "method": "POST",
                    "url": "https://api.anthropic.com/v1/messages",
                    "authentication": "genericCredentialType",
                    "genericAuthType": "httpHeaderAuth",
                    "sendHeaders": True,
                    "headerParameters": {
                        "parameters": [
                            {
                                "name": "x-api-key",
                                "value": "={{$json.api_key || $env.ANTHROPIC_API_KEY}}"
                            },
                            {
                                "name": "anthropic-version",
                                "value": "2023-06-01"
                            },
                            {
                                "name": "Content-Type",
                                "value": "application/json"
                            }
                        ]
                    },
                    "sendBody": True,
                    "specifyBody": "json",
                    "jsonBody": """{
                        "model": "claude-sonnet-4-20250514",
                        "max_tokens": 1024,
                        "messages": [
                            {
                                "role": "user",
                                "content": "={{$json.body.message || $json.body.prompt || 'Hello, Claude!'}}"
                            }
                        ]
                    }""",
                    "options": {
                        "timeout": 60000
                    }
                }
            },
            {
                "id": "format-response",
                "name": "Format Response",
                "type": "n8n-nodes-base.set",
                "typeVersion": 3.4,
                "position": [750, 300],
                "parameters": {
                    "mode": "manual",
                    "duplicateItem": False,
                    "assignments": {
                        "assignments": [
                            {
                                "id": "response",
                                "name": "response",
                                "value": "={{ $json.content[0].text }}",
                                "type": "string"
                            },
                            {
                                "id": "model",
                                "name": "model",
                                "value": "={{ $json.model }}",
                                "type": "string"
                            },
                            {
                                "id": "usage",
                                "name": "usage",
                                "value": "={{ $json.usage }}",
                                "type": "object"
                            },
                            {
                                "id": "timestamp",
                                "name": "timestamp",
                                "value": "={{ $now.toISO() }}",
                                "type": "string"
                            }
                        ]
                    },
                    "options": {}
                }
            },
            {
                "id": "respond-webhook",
                "name": "Respond to Webhook",
                "type": "n8n-nodes-base.respondToWebhook",
                "typeVersion": 1.1,
                "position": [1000, 300],
                "parameters": {
                    "respondWith": "json",
                    "responseBody": "={{ $json }}",
                    "options": {
                        "responseHeaders": {
                            "entries": [
                                {
                                    "name": "Content-Type",
                                    "value": "application/json"
                                }
                            ]
                        }
                    }
                }
            }
        ],
        "connections": {
            "Webhook": {
                "main": [
                    [{"node": "Claude API Call", "type": "main", "index": 0}]
                ]
            },
            "Claude API Call": {
                "main": [
                    [{"node": "Format Response", "type": "main", "index": 0}]
                ]
            },
            "Format Response": {
                "main": [
                    [{"node": "Respond to Webhook", "type": "main", "index": 0}]
                ]
            }
        },
        "settings": {
            "executionOrder": "v1"
        },
        "staticData": None,
        "tags": [],
        "active": False
    }


def create_claude_scheduled_workflow() -> dict:
    """
    정기적으로 Claude에게 질문하고 결과를 저장하는 워크플로우
    Schedule Trigger -> Claude API -> Save to File/DB
    """
    return {
        "name": "Claude API - Scheduled Task",
        "nodes": [
            {
                "id": "schedule-trigger",
                "name": "Schedule Trigger",
                "type": "n8n-nodes-base.scheduleTrigger",
                "typeVersion": 1.2,
                "position": [250, 300],
                "parameters": {
                    "rule": {
                        "interval": [
                            {
                                "field": "hours",
                                "hoursInterval": 1
                            }
                        ]
                    }
                }
            },
            {
                "id": "set-prompt",
                "name": "Set Prompt",
                "type": "n8n-nodes-base.set",
                "typeVersion": 3.4,
                "position": [450, 300],
                "parameters": {
                    "mode": "manual",
                    "duplicateItem": False,
                    "assignments": {
                        "assignments": [
                            {
                                "id": "prompt",
                                "name": "prompt",
                                "value": "현재 시간은 {{ $now.format('yyyy-MM-dd HH:mm:ss') }}입니다. 오늘의 기술 트렌드에 대해 간단히 요약해주세요.",
                                "type": "string"
                            }
                        ]
                    },
                    "options": {}
                }
            },
            {
                "id": "claude-api",
                "name": "Claude API",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.2,
                "position": [650, 300],
                "parameters": {
                    "method": "POST",
                    "url": "https://api.anthropic.com/v1/messages",
                    "sendHeaders": True,
                    "headerParameters": {
                        "parameters": [
                            {
                                "name": "x-api-key",
                                "value": "={{$env.ANTHROPIC_API_KEY}}"
                            },
                            {
                                "name": "anthropic-version",
                                "value": "2023-06-01"
                            },
                            {
                                "name": "Content-Type",
                                "value": "application/json"
                            }
                        ]
                    },
                    "sendBody": True,
                    "specifyBody": "json",
                    "jsonBody": """{
                        "model": "claude-sonnet-4-20250514",
                        "max_tokens": 1024,
                        "messages": [
                            {
                                "role": "user",
                                "content": "={{$json.prompt}}"
                            }
                        ]
                    }""",
                    "options": {
                        "timeout": 60000
                    }
                }
            },
            {
                "id": "log-result",
                "name": "Log Result",
                "type": "n8n-nodes-base.set",
                "typeVersion": 3.4,
                "position": [850, 300],
                "parameters": {
                    "mode": "manual",
                    "duplicateItem": False,
                    "assignments": {
                        "assignments": [
                            {
                                "id": "result",
                                "name": "result",
                                "value": "={{ $json.content[0].text }}",
                                "type": "string"
                            },
                            {
                                "id": "executed_at",
                                "name": "executed_at",
                                "value": "={{ $now.toISO() }}",
                                "type": "string"
                            }
                        ]
                    },
                    "options": {}
                }
            }
        ],
        "connections": {
            "Schedule Trigger": {
                "main": [
                    [{"node": "Set Prompt", "type": "main", "index": 0}]
                ]
            },
            "Set Prompt": {
                "main": [
                    [{"node": "Claude API", "type": "main", "index": 0}]
                ]
            },
            "Claude API": {
                "main": [
                    [{"node": "Log Result", "type": "main", "index": 0}]
                ]
            }
        },
        "settings": {
            "executionOrder": "v1"
        },
        "staticData": None,
        "tags": [],
        "active": False
    }


def create_claude_email_analyzer_workflow() -> dict:
    """
    이메일 수신 -> Claude로 분석 -> 알림 전송 워크플로우
    """
    return {
        "name": "Claude API - Email Analyzer",
        "nodes": [
            {
                "id": "webhook-email",
                "name": "Email Webhook",
                "type": "n8n-nodes-base.webhook",
                "typeVersion": 2,
                "position": [250, 300],
                "webhookId": "email-analyzer-webhook",
                "parameters": {
                    "path": "analyze-email",
                    "httpMethod": "POST",
                    "responseMode": "responseNode",
                    "options": {}
                }
            },
            {
                "id": "prepare-analysis",
                "name": "Prepare Analysis",
                "type": "n8n-nodes-base.set",
                "typeVersion": 3.4,
                "position": [450, 300],
                "parameters": {
                    "mode": "manual",
                    "duplicateItem": False,
                    "assignments": {
                        "assignments": [
                            {
                                "id": "analysis_prompt",
                                "name": "analysis_prompt",
                                "value": """다음 이메일을 분석해주세요:

발신자: {{ $json.body.from || 'unknown' }}
제목: {{ $json.body.subject || 'no subject' }}
내용: {{ $json.body.content || $json.body.body || 'no content' }}

다음 형식으로 분석 결과를 제공해주세요:
1. 긴급도 (상/중/하)
2. 카테고리 (업무/개인/스팸/기타)
3. 요약 (1-2문장)
4. 필요한 조치 사항""",
                                "type": "string"
                            }
                        ]
                    },
                    "options": {}
                }
            },
            {
                "id": "claude-analyze",
                "name": "Claude Analyze",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.2,
                "position": [650, 300],
                "parameters": {
                    "method": "POST",
                    "url": "https://api.anthropic.com/v1/messages",
                    "sendHeaders": True,
                    "headerParameters": {
                        "parameters": [
                            {
                                "name": "x-api-key",
                                "value": "={{$json.body?.api_key || $env.ANTHROPIC_API_KEY}}"
                            },
                            {
                                "name": "anthropic-version",
                                "value": "2023-06-01"
                            },
                            {
                                "name": "Content-Type",
                                "value": "application/json"
                            }
                        ]
                    },
                    "sendBody": True,
                    "specifyBody": "json",
                    "jsonBody": """{
                        "model": "claude-sonnet-4-20250514",
                        "max_tokens": 1024,
                        "messages": [
                            {
                                "role": "user",
                                "content": "={{$json.analysis_prompt}}"
                            }
                        ]
                    }""",
                    "options": {
                        "timeout": 60000
                    }
                }
            },
            {
                "id": "format-analysis",
                "name": "Format Analysis",
                "type": "n8n-nodes-base.set",
                "typeVersion": 3.4,
                "position": [850, 300],
                "parameters": {
                    "mode": "manual",
                    "duplicateItem": False,
                    "assignments": {
                        "assignments": [
                            {
                                "id": "analysis",
                                "name": "analysis",
                                "value": "={{ $json.content[0].text }}",
                                "type": "string"
                            },
                            {
                                "id": "analyzed_at",
                                "name": "analyzed_at",
                                "value": "={{ $now.toISO() }}",
                                "type": "string"
                            },
                            {
                                "id": "model_used",
                                "name": "model_used",
                                "value": "={{ $json.model }}",
                                "type": "string"
                            }
                        ]
                    },
                    "options": {}
                }
            },
            {
                "id": "respond",
                "name": "Respond",
                "type": "n8n-nodes-base.respondToWebhook",
                "typeVersion": 1.1,
                "position": [1050, 300],
                "parameters": {
                    "respondWith": "json",
                    "responseBody": "={{ $json }}",
                    "options": {}
                }
            }
        ],
        "connections": {
            "Email Webhook": {
                "main": [
                    [{"node": "Prepare Analysis", "type": "main", "index": 0}]
                ]
            },
            "Prepare Analysis": {
                "main": [
                    [{"node": "Claude Analyze", "type": "main", "index": 0}]
                ]
            },
            "Claude Analyze": {
                "main": [
                    [{"node": "Format Analysis", "type": "main", "index": 0}]
                ]
            },
            "Format Analysis": {
                "main": [
                    [{"node": "Respond", "type": "main", "index": 0}]
                ]
            }
        },
        "settings": {
            "executionOrder": "v1"
        },
        "staticData": None,
        "tags": [],
        "active": False
    }


def main():
    print("=" * 60)
    print("n8n + Claude API Integration Setup")
    print("=" * 60)
    print()

    # Initialize client
    client = N8nClient(N8N_BASE_URL)

    # Login
    if not client.login(N8N_EMAIL, N8N_PASSWORD):
        print("[ERROR] n8n 로그인 실패. 스크립트 종료.")
        return

    # List existing workflows
    print("\n[INFO] 기존 워크플로우 확인...")
    workflows = client.get_workflows()
    print(f"[INFO] 기존 워크플로우 수: {len(workflows)}")
    for wf in workflows:
        print(f"  - {wf['name']} (ID: {wf['id']}, Active: {wf['active']})")

    # Create workflows
    print("\n[INFO] Claude 워크플로우 생성 시작...")

    workflows_to_create = [
        ("Webhook Trigger", create_claude_webhook_workflow),
        ("Email Analyzer", create_claude_email_analyzer_workflow),
    ]

    created_workflows = []

    for name, creator_func in workflows_to_create:
        print(f"\n[INFO] {name} 워크플로우 생성 중...")
        workflow_data = creator_func()
        result = client.create_workflow(workflow_data)
        if result:
            created_workflows.append(result)
            # 워크플로우 활성화 시도
            wf_id = result.get("data", {}).get("id")
            if wf_id:
                client.activate_workflow(wf_id)

    # Summary
    print("\n" + "=" * 60)
    print("워크플로우 생성 완료!")
    print("=" * 60)
    print(f"\n생성된 워크플로우: {len(created_workflows)}개")

    if created_workflows:
        print("\n사용 방법:")
        print("-" * 40)
        print("\n1. n8n UI에서 ANTHROPIC_API_KEY 환경변수 설정")
        print("   Settings > Variables > Add Variable")
        print("   Name: ANTHROPIC_API_KEY")
        print("   Value: sk-ant-xxx...")
        print("\n2. 또는 Webhook 호출 시 api_key 파라미터 전달:")
        print(f"   curl -X POST '{N8N_BASE_URL}/webhook/claude-chat' \\")
        print("        -H 'Content-Type: application/json' \\")
        print("        -d '{\"message\": \"Hello!\", \"api_key\": \"sk-ant-xxx\"}'")
        print("\n3. Email Analyzer 사용:")
        print(f"   curl -X POST '{N8N_BASE_URL}/webhook/analyze-email' \\")
        print("        -H 'Content-Type: application/json' \\")
        print("        -d '{\"from\": \"test@example.com\", \"subject\": \"Meeting\", \"content\": \"...\"}'")


if __name__ == "__main__":
    main()
