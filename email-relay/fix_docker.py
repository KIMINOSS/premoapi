#!/usr/bin/env python3
"""
Docker 설치 수정 및 n8n 재시작
"""
import paramiko
import time

PI_HOST = "192.168.8.231"
PI_USER = "mino"
PI_PASS = "***REMOVED***"

def run_command(ssh, command, timeout=120):
    print(f"  $ {command}")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8').strip()
    error = stderr.read().decode('utf-8').strip()
    if output:
        for line in output.split('\n')[:5]:
            print(f"    {line}")
    return exit_code, output, error

def main():
    print("🔧 Docker 수정 및 n8n 재시작")
    print("=" * 50)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(PI_HOST, username=PI_USER, password=PI_PASS, timeout=30)
    print("✓ SSH 연결 성공")

    # apt로 Docker 설치 (Debian 방식)
    print("\n[1] Docker.io 설치 (apt)...")
    run_command(ssh, "sudo apt-get update -qq", timeout=60)
    run_command(ssh, "sudo apt-get install -y docker.io", timeout=180)

    # Docker 서비스 시작
    print("\n[2] Docker 서비스 시작...")
    run_command(ssh, "sudo systemctl enable docker")
    run_command(ssh, "sudo systemctl start docker")
    time.sleep(3)

    # Docker 상태 확인
    print("\n[3] Docker 상태 확인...")
    run_command(ssh, "sudo systemctl status docker --no-pager | head -5")
    run_command(ssh, "sudo docker --version")

    # 사용자를 docker 그룹에 추가
    print("\n[4] docker 그룹 설정...")
    run_command(ssh, "sudo usermod -aG docker $USER")

    # n8n 재시작
    print("\n[5] n8n 재시작...")
    run_command(ssh, "cd ~/n8n-premo && sudo docker-compose pull", timeout=300)
    run_command(ssh, "cd ~/n8n-premo && sudo docker-compose up -d", timeout=120)

    # 상태 확인
    print("\n[6] 컨테이너 상태...")
    time.sleep(5)
    run_command(ssh, "sudo docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'")

    print("\n✅ 완료!")
    print(f"📌 n8n: http://{PI_HOST}:5678")
    print("📌 사용자: premo / 비밀번호: premo2025")

    ssh.close()

if __name__ == "__main__":
    main()
