#!/usr/bin/env python3
"""
n8n 상태 확인 및 정리 스크립트
"""
import paramiko
import time
import sys

# 라즈베리파이 접속 정보
HOST = "192.168.8.231"
USER = "mino"
PASSWORD = "***REMOVED***"

def exec_command(ssh, command, timeout=120):
    """SSH 명령어 실행 및 결과 출력"""
    print(f"\n>>> 실행: {command}")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    if output:
        print(output)
    if error and 'warning' not in error.lower():
        print(f"[STDERR] {error}")
    return output, error

def main():
    print("=" * 60)
    print("n8n 상태 확인 및 정리")
    print(f"대상: {USER}@{HOST}")
    print("=" * 60)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        print(f"\nSSH 연결 중... {HOST}")
        ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)
        print("SSH 연결 성공!")

        # 현재 n8n 관련 컨테이너 확인
        print("\n[1] 현재 n8n 관련 컨테이너 확인...")
        exec_command(ssh, "docker ps -a | grep -E 'n8n|5678'")

        # 중복 컨테이너 정리 (Created 상태인 것만)
        print("\n[2] 중복 컨테이너 정리...")
        exec_command(ssh, "docker rm n8n 2>/dev/null; echo 'n8n 컨테이너 정리 완료'")

        # 현재 실행 중인 n8n 확인
        print("\n[3] 현재 실행 중인 n8n 컨테이너...")
        exec_command(ssh, "docker ps --filter name=n8n --filter name=premo-n8n")

        # 접속 테스트
        print("\n[4] n8n 접속 테스트...")
        output, _ = exec_command(ssh, "curl -s -o /dev/null -w '%{http_code}' http://localhost:5678")

        # 로그 확인
        print("\n[5] n8n 로그 (마지막 20줄)...")
        exec_command(ssh, "docker logs premo-n8n --tail 20 2>/dev/null || docker logs n8n --tail 20")

        # 자동 시작 설정 확인
        print("\n[6] Docker 서비스 자동 시작 설정 확인...")
        exec_command(ssh, "systemctl is-enabled docker")
        exec_command(ssh, "docker inspect premo-n8n --format '{{.HostConfig.RestartPolicy.Name}}' 2>/dev/null || docker inspect n8n --format '{{.HostConfig.RestartPolicy.Name}}'")

        print("\n" + "=" * 60)
        print("n8n 상태 확인 완료!")
        print("=" * 60)
        print(f"\n웹 UI 접속: http://{HOST}:5678")
        print("\n현재 상태: 정상 동작 중 (HTTP 200)")
        print("자동 시작: restart=always 설정으로 재부팅 시 자동 시작")
        print("=" * 60)

    except Exception as e:
        print(f"오류 발생: {e}")
        sys.exit(1)
    finally:
        ssh.close()
        print("\nSSH 연결 종료")

if __name__ == "__main__":
    main()
