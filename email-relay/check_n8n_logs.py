#!/usr/bin/env python3
import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("192.168.8.231", username="mino", password="***REMOVED***")
_, stdout, _ = ssh.exec_command("sudo docker logs premo-n8n --tail 30 2>&1")
print(stdout.read().decode())
ssh.close()
