"""Google Workspace MCP Server.

Google Workspace API(Gmail, Drive, Calendar, Sheets)를 MCP 도구로 제공하는 서버입니다.
"""

import sys
from typing import Dict, Any

from mcp.server.fastmcp import FastMCP

from .auth import check_auth_status, clear_credentials, get_credentials
from .tools import (
    register_gmail_tools,
    register_drive_tools,
    register_calendar_tools,
    register_sheets_tools,
)

# MCP 서버 생성
mcp = FastMCP("Google Workspace MCP")


# 인증 관련 도구 등록
@mcp.tool()
def auth_status() -> Dict[str, Any]:
    """Google OAuth 인증 상태를 확인합니다.

    Returns:
        인증 상태 정보 (credentials 파일 존재 여부, 토큰 유효성 등)
    """
    return check_auth_status()


@mcp.tool()
def auth_login() -> Dict[str, Any]:
    """Google 계정으로 로그인합니다.

    브라우저가 열리고 Google 로그인 페이지로 이동합니다.
    로그인 후 권한을 승인하면 인증이 완료됩니다.

    Returns:
        로그인 결과
    """
    try:
        creds = get_credentials()
        if creds and creds.valid:
            return {
                "success": True,
                "message": "Google 계정 인증이 완료되었습니다.",
                "authenticated": True,
            }
        else:
            return {
                "success": False,
                "message": "인증에 실패했습니다. 다시 시도해주세요.",
                "authenticated": False,
            }
    except FileNotFoundError as e:
        return {
            "success": False,
            "message": str(e),
            "authenticated": False,
            "hint": "Google Cloud Console에서 OAuth 클라이언트 자격 증명을 생성하세요.",
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"인증 오류: {str(e)}",
            "authenticated": False,
        }


@mcp.tool()
def auth_logout() -> Dict[str, Any]:
    """Google 계정 로그아웃 (저장된 토큰 삭제).

    Returns:
        로그아웃 결과
    """
    cleared = clear_credentials()
    if cleared:
        return {
            "success": True,
            "message": "로그아웃되었습니다. 저장된 인증 정보가 삭제되었습니다.",
        }
    else:
        return {
            "success": True,
            "message": "삭제할 인증 정보가 없습니다.",
        }


# 각 서비스 도구 등록
register_gmail_tools(mcp)
register_drive_tools(mcp)
register_calendar_tools(mcp)
register_sheets_tools(mcp)


def main():
    """MCP 서버 메인 진입점."""
    # stdio 모드로 실행 (Claude Code와의 통신)
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
