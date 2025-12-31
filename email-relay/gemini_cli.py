#!/usr/bin/env python3
"""
Claude-Gemini CLI 대화 도구
Claude Code에서 직접 Gemini와 대화할 수 있는 명령줄 인터페이스

인증 방법:
1. OAuth (권장): ./google_login.sh 실행 후 Google 계정 로그인
2. API Key: 환경변수 GEMINI_API_KEY 또는 기본 키 사용
"""

import sys
import json
import os
from datetime import datetime

try:
    from google import genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

# ADC 인증 시도
def get_client():
    """Gemini 클라이언트 생성 (ADC 우선, API Key fallback)"""
    # 1. ADC (Application Default Credentials) 시도
    try:
        from google.auth import default
        credentials, project = default()
        return genai.Client(credentials=credentials), "OAuth"
    except Exception:
        pass

    # 2. 환경변수 API Key
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        return genai.Client(api_key=api_key), "API Key (env)"

    # 3. 기본 API Key (fallback)
    fallback_keys = [
        "***REMOVED***",
        "***REMOVED***"
    ]
    for key in fallback_keys:
        try:
            return genai.Client(api_key=key), "API Key (fallback)"
        except:
            continue

    return None, None

def ask_gemini(question: str, context: str = "") -> dict:
    """Gemini에게 질문하고 응답 받기"""
    if not GENAI_AVAILABLE:
        return {
            "success": False,
            "error": "google-genai 패키지가 설치되지 않음. pip install google-genai",
            "timestamp": datetime.now().isoformat()
        }

    client, auth_method = get_client()
    if not client:
        return {
            "success": False,
            "error": "인증 실패. ./google_login.sh 실행 후 Google 계정으로 로그인하세요.",
            "timestamp": datetime.now().isoformat()
        }

    try:

        system_prompt = """당신은 Gemini AI입니다. Claude AI와 협업하여 사용자를 돕고 있습니다.
한국어로 대화하며, 기술적인 질문에 정확하고 상세하게 답변하세요.
코드 예시가 필요하면 제공하고, 가능한 한 실용적인 조언을 해주세요."""

        full_prompt = f"{system_prompt}\n\n컨텍스트:\n{context}\n\n질문:\n{question}" if context else f"{system_prompt}\n\n{question}"

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=full_prompt
        )

        return {
            "success": True,
            "response": response.text,
            "model": "gemini-2.0-flash",
            "auth_method": auth_method,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        error_str = str(e)
        error_type = "unknown"

        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
            error_type = "rate_limit"
            error_msg = "API 할당량 초과. Free Tier 제한으로 잠시 후 다시 시도하세요."
        elif "401" in error_str or "UNAUTHENTICATED" in error_str:
            error_type = "auth_error"
            error_msg = "API 키 인증 실패"
        else:
            error_msg = error_str[:200]

        return {
            "success": False,
            "error": error_msg,
            "error_type": error_type,
            "timestamp": datetime.now().isoformat()
        }

def main():
    if len(sys.argv) < 2:
        print("사용법: python gemini_cli.py '질문 내용' [컨텍스트]")
        print("")
        print("예시:")
        print("  python gemini_cli.py 'n8n 워크플로우 생성 방법'")
        print("  python gemini_cli.py 'OAuth 2.0 설명해줘' '이메일 릴레이 시스템 개발 중'")
        sys.exit(1)

    question = sys.argv[1]
    context = sys.argv[2] if len(sys.argv) > 2 else ""

    print("=" * 60)
    print("  Claude → Gemini 대화")
    print("=" * 60)
    print(f"질문: {question}")
    if context:
        print(f"컨텍스트: {context[:50]}...")
    print("-" * 60)

    result = ask_gemini(question, context)

    if result["success"]:
        print(f"\n[Gemini 응답] (인증: {result.get('auth_method', 'unknown')})")
        print(result["response"])
    else:
        print(f"\n[오류] {result['error']}")
        if "인증 실패" in result.get('error', '') or "rate" in result.get('error', '').lower():
            print("\n해결 방법:")
            print("  1. ./google_login.sh 실행하여 Google 계정으로 로그인")
            print("  2. 또는 새 API 키 발급: https://aistudio.google.com/apikey")

    print("-" * 60)
    print(f"시간: {result['timestamp']}")

    # JSON 출력 (파이프라인 사용 시)
    if not sys.stdout.isatty():
        print("\n---JSON---")
        print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
