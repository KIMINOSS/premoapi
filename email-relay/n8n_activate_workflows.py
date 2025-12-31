#!/usr/bin/env python3
"""
n8n Workflow Activator
Activates Claude API workflows in n8n
"""

import requests

N8N_BASE_URL = "http://192.168.8.231:5678"
N8N_EMAIL = "admin@premo.local"
N8N_PASSWORD = "***REMOVED***"

def main():
    session = requests.Session()

    # Login
    print("[INFO] n8n 로그인 중...")
    response = session.post(
        f"{N8N_BASE_URL}/rest/login",
        json={"emailOrLdapLoginId": N8N_EMAIL, "password": N8N_PASSWORD}
    )
    if response.status_code != 200:
        print(f"[ERROR] 로그인 실패: {response.text}")
        return

    auth_cookie = response.cookies.get("n8n-auth")
    print(f"[OK] 로그인 성공")

    headers = {"Cookie": f"n8n-auth={auth_cookie}"}

    # Get workflows
    print("\n[INFO] 워크플로우 목록 조회...")
    response = session.get(f"{N8N_BASE_URL}/rest/workflows", headers=headers)
    workflows = response.json().get("data", [])

    print(f"\n총 {len(workflows)}개 워크플로우:")
    for wf in workflows:
        status = "활성" if wf.get("active") else "비활성"
        print(f"  - [{status}] {wf['name']} (ID: {wf['id']})")

    # Find and activate Claude workflows
    claude_workflows = [wf for wf in workflows if "Claude" in wf.get("name", "") and not wf.get("active")]

    if not claude_workflows:
        print("\n[INFO] 활성화할 Claude 워크플로우가 없습니다.")
        return

    print(f"\n[INFO] {len(claude_workflows)}개 워크플로우 활성화 시도...")

    for wf in claude_workflows:
        wf_id = wf["id"]
        wf_name = wf["name"]
        print(f"\n[INFO] '{wf_name}' 활성화 중...")

        # Try POST /activate endpoint
        response = session.post(
            f"{N8N_BASE_URL}/rest/workflows/{wf_id}/activate",
            headers=headers
        )

        if response.status_code == 200:
            print(f"[OK] 활성화 성공!")
        else:
            print(f"[WARN] POST activate 실패, PATCH 시도...")
            # Try PATCH with active: true
            response = session.patch(
                f"{N8N_BASE_URL}/rest/workflows/{wf_id}",
                json={"active": True},
                headers={**headers, "Content-Type": "application/json"}
            )
            if response.status_code == 200:
                data = response.json().get("data", {})
                if data.get("active"):
                    print(f"[OK] 활성화 성공!")
                else:
                    print(f"[WARN] 활성화 요청 완료, 하지만 상태 확인 필요")
            else:
                print(f"[ERROR] 활성화 실패: {response.status_code}")

    # Final status
    print("\n[INFO] 최종 워크플로우 상태 확인...")
    response = session.get(f"{N8N_BASE_URL}/rest/workflows", headers=headers)
    workflows = response.json().get("data", [])

    print(f"\n워크플로우 상태:")
    for wf in workflows:
        status = "활성" if wf.get("active") else "비활성"
        print(f"  - [{status}] {wf['name']}")

if __name__ == "__main__":
    main()
