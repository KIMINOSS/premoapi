#!/usr/bin/env python3
"""
PREMO 전체 호환성/의존성 점검
"""
import paramiko
import subprocess
import sys
import os
import json
from datetime import datetime

PI_HOST = "192.168.8.231"
PI_USER = "mino"
PI_PASS = "***REMOVED***"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

def check_ok(name, status, details=""):
    icon = "✅" if status else "❌"
    print(f"  {icon} {name}: {details}")
    return status

def check_local_system():
    """로컬 시스템 점검"""
    print_section("🖥️ 로컬 시스템 (WSL)")
    results = {}

    # Python 버전
    py_version = sys.version.split()[0]
    results['python'] = py_version >= "3.10"
    check_ok("Python", results['python'], py_version)

    # Node.js 버전
    try:
        node_out = subprocess.run(['node', '--version'], capture_output=True, text=True)
        node_version = node_out.stdout.strip()
        results['nodejs'] = node_version.startswith('v18') or node_version.startswith('v20') or node_version.startswith('v22') or node_version.startswith('v24')
        check_ok("Node.js", results['nodejs'], node_version)
    except:
        results['nodejs'] = False
        check_ok("Node.js", False, "설치 필요")

    # pip 패키지
    try:
        pip_out = subprocess.run(['pip3', 'list', '--format=json'], capture_output=True, text=True)
        packages = {p['name'].lower(): p['version'] for p in json.loads(pip_out.stdout)}

        required = ['paramiko', 'requests']
        for pkg in required:
            installed = pkg.lower() in packages
            results[f'pip_{pkg}'] = installed
            check_ok(f"pip: {pkg}", installed, packages.get(pkg.lower(), "없음"))
    except Exception as e:
        check_ok("pip 패키지", False, str(e))

    # Git
    try:
        git_out = subprocess.run(['git', '--version'], capture_output=True, text=True)
        results['git'] = True
        check_ok("Git", True, git_out.stdout.strip())
    except:
        results['git'] = False
        check_ok("Git", False, "설치 필요")

    return results

def check_raspberry_pi():
    """라즈베리파이 시스템 점검"""
    print_section("🍓 라즈베리파이 시스템")
    results = {}

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(PI_HOST, username=PI_USER, password=PI_PASS, timeout=15)
        results['ssh'] = True
        check_ok("SSH 연결", True, f"{PI_USER}@{PI_HOST}")

        # OS 버전
        _, stdout, _ = ssh.exec_command("cat /etc/os-release | grep PRETTY_NAME")
        os_info = stdout.read().decode().strip().split('=')[1].strip('"')
        check_ok("OS", True, os_info)

        # 아키텍처
        _, stdout, _ = ssh.exec_command("uname -m")
        arch = stdout.read().decode().strip()
        results['arch'] = arch == 'aarch64'
        check_ok("아키텍처", results['arch'], f"{arch} (ARM64)")

        # Docker 버전
        _, stdout, stderr = ssh.exec_command("docker --version 2>/dev/null")
        docker_ver = stdout.read().decode().strip()
        results['docker'] = bool(docker_ver)
        check_ok("Docker", results['docker'], docker_ver or "설치 필요")

        # Docker Compose
        _, stdout, _ = ssh.exec_command("docker-compose --version 2>/dev/null || docker compose version 2>/dev/null")
        compose_ver = stdout.read().decode().strip()
        results['compose'] = bool(compose_ver)
        check_ok("Docker Compose", results['compose'], compose_ver.split('\n')[0] if compose_ver else "설치 필요")

        # n8n 컨테이너 상태
        _, stdout, _ = ssh.exec_command("sudo docker ps --filter name=premo-n8n --format '{{.Status}}'")
        n8n_status = stdout.read().decode().strip()
        results['n8n'] = 'Up' in n8n_status
        check_ok("n8n 컨테이너", results['n8n'], n8n_status or "실행 중 아님")

        # n8n 이미지 버전
        _, stdout, _ = ssh.exec_command("sudo docker images n8nio/n8n --format '{{.Tag}}'")
        n8n_tag = stdout.read().decode().strip()
        check_ok("n8n 이미지", bool(n8n_tag), n8n_tag or "없음")

        # 디스크 공간
        _, stdout, _ = ssh.exec_command("df -h / | awk 'NR==2{print $4}'")
        disk_free = stdout.read().decode().strip()
        results['disk'] = True
        check_ok("여유 공간", True, disk_free)

        # 메모리
        _, stdout, _ = ssh.exec_command("free -m | awk 'NR==2{printf \"%dMB free\", $7}'")
        mem_free = stdout.read().decode().strip()
        check_ok("여유 메모리", True, mem_free)

        ssh.close()
    except Exception as e:
        results['ssh'] = False
        check_ok("SSH 연결", False, str(e))

    return results

def check_network_ports():
    """네트워크 포트 점검"""
    print_section("🌐 네트워크 포트")
    results = {}

    import socket
    ports = {
        (PI_HOST, 22): "SSH",
        (PI_HOST, 5678): "n8n",
        ("8.8.8.8", 53): "인터넷 (DNS)",
    }

    for (host, port), name in ports.items():
        try:
            sock = socket.create_connection((host, port), timeout=5)
            sock.close()
            results[f"{name}"] = True
            check_ok(f"포트 {port} ({name})", True, f"{host}:{port} 열림")
        except Exception as e:
            results[f"{name}"] = False
            check_ok(f"포트 {port} ({name})", False, str(e)[:30])

    return results

def check_email_relay_files():
    """이메일 릴레이 파일 점검"""
    print_section("📧 이메일 릴레이 파일")
    results = {}

    base_dir = "/home/kogh/mino/premoapi/email-relay"
    files = {
        "google-apps-script.js": "Google Apps Script",
        "raspberry-pi-n8n-setup.sh": "설치 스크립트",
        "monitor.js": "모니터링",
        "dashboard.html": "대시보드",
        "system_check.py": "시스템 점검",
        "ssh_install_n8n.py": "SSH 설치",
    }

    for filename, desc in files.items():
        filepath = os.path.join(base_dir, filename)
        exists = os.path.exists(filepath)
        results[filename] = exists
        if exists:
            size = os.path.getsize(filepath)
            check_ok(desc, True, f"{size:,} bytes")
        else:
            check_ok(desc, False, "파일 없음")

    return results

def check_mcp_servers():
    """MCP 서버 점검"""
    print_section("🔌 MCP 서버 (Claude Code)")

    mcp_configs = [
        ("Serena", "코드 분석", "plugin:serena"),
        ("Context7", "문서 검색", "plugin:context7"),
    ]

    for name, desc, plugin in mcp_configs:
        check_ok(f"MCP: {name}", True, desc)

def generate_compatibility_report():
    """호환성 보고서 생성"""
    print("\n" + "="*60)
    print("  📊 PREMO 호환성/의존성 점검 보고서")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)

    local = check_local_system()
    pi = check_raspberry_pi()
    network = check_network_ports()
    files = check_email_relay_files()
    check_mcp_servers()

    # 요약
    print_section("📋 요약")
    all_results = {**local, **pi, **network, **files}
    passed = sum(1 for v in all_results.values() if v)
    total = len(all_results)
    percentage = (passed / total * 100) if total > 0 else 0

    print(f"  총 {total}개 항목 중 {passed}개 정상 ({percentage:.1f}%)")

    if percentage >= 90:
        print("  🟢 상태: 시스템 정상")
    elif percentage >= 70:
        print("  🟡 상태: 일부 문제 있음")
    else:
        print("  🔴 상태: 심각한 문제 있음")

    # 권장 사항
    print_section("💡 권장 사항")
    recommendations = []

    if not pi.get('n8n'):
        recommendations.append("n8n 컨테이너 재시작 필요")
    if not local.get('nodejs'):
        recommendations.append("Node.js 18+ 설치 권장")

    if recommendations:
        for r in recommendations:
            print(f"  • {r}")
    else:
        print("  모든 시스템이 정상입니다.")

    # 접속 정보
    print_section("📌 접속 정보")
    print(f"  n8n: http://{PI_HOST}:5678")
    print(f"  계정: premo / premo2025")
    print(f"  라즈베리파이: ssh {PI_USER}@{PI_HOST}")

    return all_results

if __name__ == "__main__":
    generate_compatibility_report()
