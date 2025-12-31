#!/usr/bin/env python3
"""
라즈베리파이에 n8n Docker 환경 설치 스크립트
"""
import paramiko
import time
import sys

# 라즈베리파이 접속 정보
HOST = "192.168.8.231"
USER = "mino"
PASSWORD = "***REMOVED***"

# docker-compose.yml 내용
DOCKER_COMPOSE_CONTENT = """version: '3'
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - N8N_SECURE_COOKIE=false
      - WEBHOOK_URL=http://192.168.8.231:5678/
      - TZ=Asia/Seoul
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n_data:
"""

def exec_command(ssh, command, timeout=120):
    """SSH 명령어 실행 및 결과 출력"""
    print(f"\n>>> 실행: {command}")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)

    # 결과 읽기
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')

    if output:
        print(output)
    if error:
        print(f"[STDERR] {error}")

    return output, error

def main():
    print("=" * 60)
    print("n8n Docker 설치 스크립트")
    print(f"대상: {USER}@{HOST}")
    print("=" * 60)

    # SSH 클라이언트 생성
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        # SSH 연결
        print(f"\n[1/8] SSH 연결 중... {HOST}")
        ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)
        print("SSH 연결 성공!")

        # Docker 버전 확인
        print("\n[2/8] Docker 버전 확인...")
        exec_command(ssh, "docker --version")
        exec_command(ssh, "docker compose version")

        # n8n 디렉토리 생성
        print("\n[3/8] n8n 디렉토리 생성...")
        exec_command(ssh, "mkdir -p ~/n8n-docker")

        # 기존 컨테이너 정리
        print("\n[4/8] 기존 n8n 컨테이너 정리...")
        exec_command(ssh, "docker stop n8n 2>/dev/null; docker rm n8n 2>/dev/null; echo 'cleanup done'")

        # docker-compose.yml 생성
        print("\n[5/8] docker-compose.yml 생성...")
        # 파일 내용을 이스케이프하여 전달
        escaped_content = DOCKER_COMPOSE_CONTENT.replace("'", "'\\''")
        exec_command(ssh, f"cat > ~/n8n-docker/docker-compose.yml << 'COMPOSE_EOF'\n{DOCKER_COMPOSE_CONTENT}COMPOSE_EOF")

        # 파일 확인
        exec_command(ssh, "cat ~/n8n-docker/docker-compose.yml")

        # Docker 이미지 풀
        print("\n[6/8] n8n Docker 이미지 풀 중... (시간이 걸릴 수 있습니다)")
        exec_command(ssh, "cd ~/n8n-docker && docker compose pull", timeout=300)

        # n8n 컨테이너 시작
        print("\n[7/8] n8n 컨테이너 시작...")
        exec_command(ssh, "cd ~/n8n-docker && docker compose up -d", timeout=120)

        # 잠시 대기
        print("\n컨테이너 시작 대기 중... (10초)")
        time.sleep(10)

        # 상태 확인
        print("\n[8/8] 설치 완료 확인...")
        exec_command(ssh, "docker ps -a --filter name=n8n")
        exec_command(ssh, "docker logs n8n --tail 30")

        # 접속 테스트
        print("\n접속 테스트 중...")
        output, _ = exec_command(ssh, "curl -s -o /dev/null -w '%{http_code}' http://localhost:5678 2>/dev/null || echo 'starting'")

        print("\n" + "=" * 60)
        print("n8n 설치 완료!")
        print("=" * 60)
        print(f"\n웹 UI 접속: http://{HOST}:5678")
        print("\n관리 명령어:")
        print(f"  - 로그 확인: ssh {USER}@{HOST} 'docker logs -f n8n'")
        print(f"  - 재시작: ssh {USER}@{HOST} 'cd ~/n8n-docker && docker compose restart'")
        print(f"  - 중지: ssh {USER}@{HOST} 'cd ~/n8n-docker && docker compose down'")
        print(f"  - 업데이트: ssh {USER}@{HOST} 'cd ~/n8n-docker && docker compose pull && docker compose up -d'")
        print("=" * 60)

    except paramiko.AuthenticationException:
        print(f"인증 실패: 사용자명 또는 비밀번호 확인 필요")
        sys.exit(1)
    except paramiko.SSHException as e:
        print(f"SSH 연결 오류: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"오류 발생: {e}")
        sys.exit(1)
    finally:
        ssh.close()
        print("\nSSH 연결 종료")

if __name__ == "__main__":
    main()
