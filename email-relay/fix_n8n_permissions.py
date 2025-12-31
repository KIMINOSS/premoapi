#!/usr/bin/env python3
import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("192.168.8.231", username="mino", password="***REMOVED***")

commands = [
    "cd ~/n8n-premo && sudo docker-compose down",
    "sudo chown -R 1000:1000 ~/n8n-premo/n8n-data || sudo mkdir -p ~/n8n-premo/n8n-data && sudo chown -R 1000:1000 ~/n8n-premo/n8n-data",
    "sudo chmod -R 755 ~/n8n-premo/n8n-data",
    "cd ~/n8n-premo && sudo docker-compose up -d",
    "sleep 10",
    "sudo docker ps --format '{{.Names}}: {{.Status}}'"
]

for cmd in commands:
    print(f"$ {cmd}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=60)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(f"  {out}")
    if err and "warning" not in err.lower(): print(f"  [!] {err[:100]}")
    print()

ssh.close()
print("✅ 완료!")
