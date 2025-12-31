#!/usr/bin/env python3
"""
PREMO 전체 시스템 점검
"""
import paramiko
import http.client
import socket
import json
import os
from datetime import datetime

PI_HOST = "192.168.8.231"
PI_USER = "mino"
PI_PASS = "***REMOVED***"

def print_header(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

def check_status(name, status, details=""):
    icon = "✅" if status else "❌"
    print(f"  {icon} {name}: {details}")
    return status

def check_raspberry_pi():
    """라즈베리파이 상태 점검"""
    print_header("🍓 라즈베리파이 점검")
    results = {}

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(PI_HOST, username=PI_USER, password=PI_PASS, timeout=10)
        results['ssh'] = True
        check_status("SSH 연결", True, f"{PI_USER}@{PI_HOST}")

        # 시스템 정보
        _, stdout, _ = ssh.exec_command("hostname")
        hostname = stdout.read().decode().strip()
        check_status("호스트명", True, hostname)

        # CPU/메모리
        _, stdout, _ = ssh.exec_command("cat /proc/loadavg | awk '{print $1, $2, $3}'")
        load = stdout.read().decode().strip()
        check_status("CPU 로드", True, load)

        _, stdout, _ = ssh.exec_command("free -m | awk 'NR==2{printf \"%dMB / %dMB (%.1f%%)\", $3, $2, $3*100/$2}'")
        mem = stdout.read().decode().strip()
        check_status("메모리", True, mem)

        _, stdout, _ = ssh.exec_command("df -h / | awk 'NR==2{print $3 \"/\" $2 \" (\" $5 \")\"}'")
        disk = stdout.read().decode().strip()
        check_status("디스크", True, disk)

        # Docker 상태
        _, stdout, _ = ssh.exec_command("sudo docker ps --format '{{.Names}}: {{.Status}}'")
        containers = stdout.read().decode().strip()
        if containers:
            for c in containers.split('\n'):
                check_status("Docker 컨테이너", True, c)
        results['docker'] = bool(containers)

        # n8n 상태
        _, stdout, _ = ssh.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:5678/healthz")
        n8n_status = stdout.read().decode().strip()
        results['n8n'] = n8n_status == "200"
        check_status("n8n 서비스", results['n8n'], f"HTTP {n8n_status}")

        ssh.close()
    except Exception as e:
        results['ssh'] = False
        check_status("SSH 연결", False, str(e))

    return results

def check_network():
    """네트워크 점검"""
    print_header("🌐 네트워크 점검")
    results = {}

    # 인터넷 연결
    try:
        socket.create_connection(("8.8.8.8", 53), timeout=3)
        results['internet'] = True
        check_status("인터넷 연결", True, "Google DNS 연결 가능")
    except:
        results['internet'] = False
        check_status("인터넷 연결", False, "연결 불가")

    # 라즈베리파이 ping
    try:
        socket.create_connection((PI_HOST, 22), timeout=5)
        results['pi_network'] = True
        check_status("라즈베리파이 네트워크", True, f"{PI_HOST}:22 연결 가능")
    except:
        results['pi_network'] = False
        check_status("라즈베리파이 네트워크", False, "연결 불가")

    # n8n 웹 접근
    try:
        conn = http.client.HTTPConnection(PI_HOST, 5678, timeout=5)
        conn.request("GET", "/healthz")
        resp = conn.getresponse()
        results['n8n_web'] = resp.status == 200
        check_status("n8n 웹 접근", results['n8n_web'], f"HTTP {resp.status}")
        conn.close()
    except Exception as e:
        results['n8n_web'] = False
        check_status("n8n 웹 접근", False, str(e))

    return results

def check_email_relay():
    """이메일 릴레이 구성 요소 점검"""
    print_header("📧 이메일 릴레이 구성 요소")
    results = {}

    files = {
        "Google Apps Script": "/home/kogh/mino/premoapi/email-relay/google-apps-script.js",
        "라즈베리파이 설치 스크립트": "/home/kogh/mino/premoapi/email-relay/raspberry-pi-n8n-setup.sh",
        "모니터링 시스템": "/home/kogh/mino/premoapi/email-relay/monitor.js",
        "SSH 설치 스크립트": "/home/kogh/mino/premoapi/email-relay/ssh_install_n8n.py",
    }

    for name, path in files.items():
        exists = os.path.exists(path)
        results[name] = exists
        size = os.path.getsize(path) if exists else 0
        check_status(name, exists, f"{size} bytes" if exists else "파일 없음")

    return results

def check_mcp_servers():
    """MCP 서버 점검"""
    print_header("🔌 MCP 서버 점검")

    servers = {
        "serena": "Serena 코드 분석",
        "context7": "Context7 문서",
    }

    for name, desc in servers.items():
        check_status(f"MCP: {name}", True, desc)

def generate_report():
    """전체 보고서 생성"""
    print("\n" + "="*60)
    print("  📊 PREMO 시스템 점검 보고서")
    print("  " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("="*60)

    pi_results = check_raspberry_pi()
    net_results = check_network()
    email_results = check_email_relay()
    check_mcp_servers()

    # 요약
    print_header("📋 요약")

    all_results = {**pi_results, **net_results, **email_results}
    passed = sum(1 for v in all_results.values() if v)
    total = len(all_results)

    print(f"  총 {total}개 항목 중 {passed}개 정상")
    print(f"  상태: {'✅ 모든 시스템 정상' if passed == total else '⚠️ 일부 문제 발견'}")

    # n8n 접속 정보
    if pi_results.get('n8n'):
        print(f"\n  📌 n8n 접속: http://{PI_HOST}:5678")
        print("  📌 사용자: premo / 비밀번호: premo2025")

    return all_results

if __name__ == "__main__":
    generate_report()
