#!/usr/bin/env python3
"""
PREMO Claude-Gemini 실시간 대화 서버
Flask 기반 웹 서버로 Gemini API와 통신
"""

from flask import Flask, request, jsonify, send_file
from google import genai
import os
import json
from datetime import datetime

app = Flask(__name__)

# Gemini API 설정 (환경변수 필수)
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY 환경변수가 설정되지 않았습니다")
client = genai.Client(api_key=API_KEY)

# 대화 히스토리 저장
conversation_history = []

def ask_gemini(message: str, context: str = "") -> str:
    """Gemini에게 질문하고 응답 받기"""
    try:
        system_context = """당신은 Gemini AI입니다. Claude AI와 협업하여 사용자를 돕고 있습니다.
한국어로 대화하며, 친근하고 도움이 되는 방식으로 응답하세요.
Claude가 먼저 분석한 내용이 있다면 그것을 보완하거나 다른 관점을 제시하세요."""

        full_prompt = f"{system_context}\n\n대화 맥락:\n{context}\n\n질문:\n{message}" if context else f"{system_context}\n\n{message}"

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=full_prompt
        )
        return response.text
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
            return "[Gemini] API 할당량 초과. 잠시 후 다시 시도해주세요. (Free Tier 제한)"
        elif "401" in error_str or "UNAUTHENTICATED" in error_str:
            return "[Gemini] API 키 인증 실패. API 키를 확인해주세요."
        return f"[Gemini 오류] {error_str[:100]}"

def claude_analyze(message: str) -> str:
    """Claude의 분석 시뮬레이션 (실제로는 Claude Code가 응답)"""
    # 이 함수는 실제 Claude Code에서 직접 호출됨
    return f"[Claude 분석] {message}에 대한 초기 분석을 수행했습니다."

@app.route('/')
def index():
    """대시보드 HTML 반환"""
    return send_file('realtime_dashboard.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    """사용자 메시지 처리 및 AI 응답"""
    data = request.json
    user_message = data.get('message', '')

    if not user_message:
        return jsonify({'error': '메시지가 비어있습니다'}), 400

    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # 대화 히스토리에 사용자 메시지 추가
    conversation_history.append({
        'role': 'user',
        'content': user_message,
        'timestamp': timestamp
    })

    # 최근 대화 컨텍스트 생성 (최대 5개)
    context = "\n".join([
        f"[{h['role']}] {h['content']}"
        for h in conversation_history[-5:]
    ])

    # Gemini 응답 받기
    gemini_response = ask_gemini(user_message, context)

    # Gemini 응답 저장
    conversation_history.append({
        'role': 'gemini',
        'content': gemini_response,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    })

    return jsonify({
        'user_message': user_message,
        'gemini_response': gemini_response,
        'timestamp': timestamp
    })

@app.route('/api/gemini-direct', methods=['POST'])
def gemini_direct():
    """Claude가 직접 Gemini에게 질문"""
    data = request.json
    question = data.get('question', '')
    context = data.get('context', '')

    response = ask_gemini(question, context)

    return jsonify({
        'question': question,
        'response': response,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    })

@app.route('/api/history')
def get_history():
    """대화 히스토리 반환"""
    return jsonify(conversation_history)

@app.route('/api/clear', methods=['POST'])
def clear_history():
    """대화 히스토리 초기화"""
    conversation_history.clear()
    return jsonify({'status': 'cleared'})

@app.route('/api/status')
def status():
    """시스템 상태 확인"""
    return jsonify({
        'status': 'online',
        'gemini_model': 'gemini-2.0-flash',
        'conversation_count': len(conversation_history),
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    })

if __name__ == '__main__':
    print("=" * 60)
    print("  PREMO Claude-Gemini 대화 서버")
    print("  http://localhost:5000")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)
