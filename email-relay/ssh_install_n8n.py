#!/usr/bin/env python3
"""
PREMO 라즈베리파이 n8n 원격 설치
paramiko를 사용한 SSH 연결
"""
import paramiko
import time
import sys

# 설정
PI_HOST = "192.168.8.231"
PI_USER = "mino"
PI_PASS = "***REMOVED***"
PI_PORT = 22

def run_command(ssh, command, timeout=120):
    """SSH 명령 실행"""
    print(f"  $ {command}")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8').strip()
    error = stderr.read().decode('utf-8').strip()

    if output:
        for line in output.split('\n')[:10]:  # 최대 10줄만 출력
            print(f"    {line}")
    if error and exit_code != 0:
        print(f"    [ERROR] {error[:200]}")

    return exit_code, output, error

def main():
    print("🍓 PREMO 라즈베리파이 n8n 원격 설치")
    print("=" * 50)
    print(f"대상: {PI_USER}@{PI_HOST}")
    print()

    # SSH 클라이언트 생성
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        # 연결
        print("[1/7] SSH 연결 중...")
        ssh.connect(PI_HOST, port=PI_PORT, username=PI_USER, password=PI_PASS, timeout=30)
        print("  ✓ 연결 성공!")

        # 시스템 정보
        print("\n[2/7] 시스템 정보 확인...")
        run_command(ssh, "hostname && uname -a")

        # Docker 설치 확인
        print("\n[3/7] Docker 확인...")
        exit_code, output, _ = run_command(ssh, "docker --version 2>/dev/null || echo 'not_installed'")

        if "not_installed" in output or exit_code != 0:
            print("  Docker 설치 중... (몇 분 소요)")
            run_command(ssh, "curl -fsSL https://get.docker.com -o /tmp/get-docker.sh", timeout=60)
            run_command(ssh, "sudo sh /tmp/get-docker.sh", timeout=300)
            run_command(ssh, "sudo usermod -aG docker $USER")
            print("  ✓ Docker 설치 완료")
        else:
            print("  ✓ Docker 이미 설치됨")

        # Docker Compose 확인
        print("\n[4/7] Docker Compose 확인...")
        exit_code, _, _ = run_command(ssh, "docker-compose --version 2>/dev/null || docker compose version 2>/dev/null")
        if exit_code != 0:
            run_command(ssh, "sudo apt-get install -y docker-compose", timeout=120)

        # n8n 디렉토리 생성
        print("\n[5/7] n8n 디렉토리 설정...")
        run_command(ssh, "mkdir -p ~/n8n-premo")

        # docker-compose.yml 생성
        print("\n[6/7] Docker Compose 파일 생성...")
        compose_content = '''version: '3.8'
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
'''
        escaped_content = compose_content.replace("'", "'\\''")
        run_command(ssh, f"echo '{escaped_content}' > ~/n8n-premo/docker-compose.yml")

        # n8n 시작
        print("\n[7/7] n8n 컨테이너 시작...")
        run_command(ssh, "cd ~/n8n-premo && sudo docker-compose pull", timeout=300)
        run_command(ssh, "cd ~/n8n-premo && sudo docker-compose up -d", timeout=120)

        # 상태 확인
        print("\n" + "=" * 50)
        time.sleep(5)
        run_command(ssh, "sudo docker ps --filter name=premo-n8n --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'")

        print("\n✅ 설치 완료!")
        print()
        print("📌 접속 정보:")
        print(f"   URL: http://{PI_HOST}:5678")
        print("   사용자: premo")
        print("   비밀번호: premo2025")

    except paramiko.AuthenticationException:
        print("❌ 인증 실패: 비밀번호를 확인하세요")
        sys.exit(1)
    except paramiko.SSHException as e:
        print(f"❌ SSH 오류: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 오류: {e}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
