"""Google Drive API 도구 모듈.

파일 목록 조회, 읽기, 업로드 기능을 제공합니다.
"""

import base64
import io
import mimetypes
from typing import Optional, List, Dict, Any

from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload
from mcp.server.fastmcp import FastMCP

from ..auth import get_credentials


def get_drive_service():
    """Drive API 서비스 객체를 반환합니다."""
    creds = get_credentials()
    if not creds:
        raise RuntimeError("Google 인증이 필요합니다. 먼저 인증을 완료하세요.")
    return build("drive", "v3", credentials=creds)


def register_drive_tools(mcp: FastMCP):
    """Drive 도구들을 MCP 서버에 등록합니다."""

    @mcp.tool()
    def drive_list(
        query: Optional[str] = None,
        folder_id: Optional[str] = None,
        max_results: int = 20,
        order_by: str = "modifiedTime desc",
        file_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Google Drive 파일 목록을 조회합니다.

        Args:
            query: Drive 검색 쿼리 (예: "name contains 'report'")
            folder_id: 특정 폴더 ID (루트 폴더는 'root')
            max_results: 최대 결과 수 (기본값: 20, 최대: 1000)
            order_by: 정렬 기준 (기본값: "modifiedTime desc")
            file_type: 파일 유형 필터 ('document', 'spreadsheet', 'presentation', 'pdf', 'image', 'folder')

        Returns:
            파일 목록
        """
        service = get_drive_service()

        # 쿼리 구성
        q_parts = []

        if query:
            q_parts.append(query)

        if folder_id:
            q_parts.append(f"'{folder_id}' in parents")

        if file_type:
            mime_types = {
                "document": "application/vnd.google-apps.document",
                "spreadsheet": "application/vnd.google-apps.spreadsheet",
                "presentation": "application/vnd.google-apps.presentation",
                "pdf": "application/pdf",
                "image": "image/",
                "folder": "application/vnd.google-apps.folder",
            }
            if file_type in mime_types:
                if file_type == "image":
                    q_parts.append("mimeType contains 'image/'")
                else:
                    q_parts.append(f"mimeType = '{mime_types[file_type]}'")

        # 휴지통 제외
        q_parts.append("trashed = false")

        q = " and ".join(q_parts) if q_parts else None

        # 검색 실행
        results = (
            service.files()
            .list(
                q=q,
                pageSize=min(max_results, 1000),
                orderBy=order_by,
                fields="nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, parents, webViewLink, iconLink, owners)",
            )
            .execute()
        )

        files = results.get("files", [])

        return {
            "total_results": len(files),
            "query": q,
            "files": [
                {
                    "id": f["id"],
                    "name": f["name"],
                    "mime_type": f["mimeType"],
                    "size": f.get("size"),
                    "created_time": f.get("createdTime"),
                    "modified_time": f.get("modifiedTime"),
                    "parents": f.get("parents", []),
                    "web_view_link": f.get("webViewLink"),
                    "owners": [o.get("displayName") for o in f.get("owners", [])],
                }
                for f in files
            ],
            "next_page_token": results.get("nextPageToken"),
        }

    @mcp.tool()
    def drive_read(
        file_id: str,
        export_format: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Google Drive 파일 내용을 읽습니다.

        Args:
            file_id: 파일 ID
            export_format: Google 문서 내보내기 형식
                - 문서: 'text/plain', 'text/html', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                - 스프레드시트: 'text/csv', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                - 프레젠테이션: 'application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'

        Returns:
            파일 정보 및 내용
        """
        service = get_drive_service()

        # 파일 메타데이터 조회
        file_metadata = (
            service.files()
            .get(fileId=file_id, fields="id, name, mimeType, size, modifiedTime")
            .execute()
        )

        mime_type = file_metadata["mimeType"]
        is_google_doc = mime_type.startswith("application/vnd.google-apps.")

        result = {
            "id": file_metadata["id"],
            "name": file_metadata["name"],
            "mime_type": mime_type,
            "size": file_metadata.get("size"),
            "modified_time": file_metadata.get("modifiedTime"),
        }

        # Google 문서인 경우 내보내기
        if is_google_doc:
            if not export_format:
                # 기본 내보내기 형식 설정
                if "document" in mime_type:
                    export_format = "text/plain"
                elif "spreadsheet" in mime_type:
                    export_format = "text/csv"
                elif "presentation" in mime_type:
                    export_format = "application/pdf"
                else:
                    export_format = "application/pdf"

            request = service.files().export_media(
                fileId=file_id, mimeType=export_format
            )
            result["export_format"] = export_format
        else:
            request = service.files().get_media(fileId=file_id)

        # 파일 다운로드
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)

        done = False
        while not done:
            _, done = downloader.next_chunk()

        content = fh.getvalue()

        # 텍스트 기반 파일인 경우 디코딩
        if export_format and ("text" in export_format or "csv" in export_format):
            try:
                result["content"] = content.decode("utf-8")
            except UnicodeDecodeError:
                result["content_base64"] = base64.b64encode(content).decode("ascii")
        elif mime_type.startswith("text/") or mime_type in [
            "application/json",
            "application/xml",
        ]:
            try:
                result["content"] = content.decode("utf-8")
            except UnicodeDecodeError:
                result["content_base64"] = base64.b64encode(content).decode("ascii")
        else:
            result["content_base64"] = base64.b64encode(content).decode("ascii")
            result["note"] = "바이너리 파일은 Base64로 인코딩됨"

        return result

    @mcp.tool()
    def drive_upload(
        name: str,
        content: str,
        mime_type: Optional[str] = None,
        folder_id: Optional[str] = None,
        is_base64: bool = False,
    ) -> Dict[str, Any]:
        """파일을 Google Drive에 업로드합니다.

        Args:
            name: 파일 이름
            content: 파일 내용 (텍스트 또는 Base64 인코딩된 바이너리)
            mime_type: 파일 MIME 타입 (미지정 시 자동 감지)
            folder_id: 업로드할 폴더 ID (미지정 시 루트 폴더)
            is_base64: content가 Base64 인코딩된 경우 True

        Returns:
            업로드된 파일 정보
        """
        service = get_drive_service()

        # MIME 타입 자동 감지
        if not mime_type:
            mime_type, _ = mimetypes.guess_type(name)
            if not mime_type:
                mime_type = "application/octet-stream"

        # 파일 메타데이터
        file_metadata = {"name": name}
        if folder_id:
            file_metadata["parents"] = [folder_id]

        # 콘텐츠 준비
        if is_base64:
            file_content = base64.b64decode(content)
        else:
            file_content = content.encode("utf-8")

        media = MediaIoBaseUpload(
            io.BytesIO(file_content), mimetype=mime_type, resumable=True
        )

        # 업로드 실행
        file = (
            service.files()
            .create(
                body=file_metadata,
                media_body=media,
                fields="id, name, mimeType, size, webViewLink, createdTime",
            )
            .execute()
        )

        return {
            "success": True,
            "id": file["id"],
            "name": file["name"],
            "mime_type": file["mimeType"],
            "size": file.get("size"),
            "web_view_link": file.get("webViewLink"),
            "created_time": file.get("createdTime"),
        }

    @mcp.tool()
    def drive_create_folder(
        name: str,
        parent_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Google Drive에 폴더를 생성합니다.

        Args:
            name: 폴더 이름
            parent_id: 상위 폴더 ID (미지정 시 루트 폴더)

        Returns:
            생성된 폴더 정보
        """
        service = get_drive_service()

        file_metadata = {
            "name": name,
            "mimeType": "application/vnd.google-apps.folder",
        }

        if parent_id:
            file_metadata["parents"] = [parent_id]

        folder = (
            service.files()
            .create(
                body=file_metadata, fields="id, name, mimeType, webViewLink, createdTime"
            )
            .execute()
        )

        return {
            "success": True,
            "id": folder["id"],
            "name": folder["name"],
            "mime_type": folder["mimeType"],
            "web_view_link": folder.get("webViewLink"),
            "created_time": folder.get("createdTime"),
        }

    @mcp.tool()
    def drive_delete(file_id: str, permanent: bool = False) -> Dict[str, Any]:
        """Google Drive 파일을 삭제합니다.

        Args:
            file_id: 파일 ID
            permanent: 영구 삭제 여부 (False면 휴지통으로 이동)

        Returns:
            삭제 결과
        """
        service = get_drive_service()

        if permanent:
            service.files().delete(fileId=file_id).execute()
            return {"success": True, "file_id": file_id, "action": "permanently_deleted"}
        else:
            # 휴지통으로 이동
            file = (
                service.files()
                .update(fileId=file_id, body={"trashed": True})
                .execute()
            )
            return {"success": True, "file_id": file_id, "action": "moved_to_trash"}

    @mcp.tool()
    def drive_share(
        file_id: str,
        email: str,
        role: str = "reader",
        send_notification: bool = True,
    ) -> Dict[str, Any]:
        """Google Drive 파일을 공유합니다.

        Args:
            file_id: 파일 ID
            email: 공유할 사용자 이메일
            role: 권한 ('reader', 'writer', 'commenter')
            send_notification: 알림 이메일 발송 여부

        Returns:
            공유 결과
        """
        service = get_drive_service()

        permission = {"type": "user", "role": role, "emailAddress": email}

        result = (
            service.permissions()
            .create(
                fileId=file_id,
                body=permission,
                sendNotificationEmail=send_notification,
                fields="id, role, type, emailAddress",
            )
            .execute()
        )

        return {
            "success": True,
            "file_id": file_id,
            "permission_id": result["id"],
            "email": result.get("emailAddress"),
            "role": result["role"],
            "type": result["type"],
        }

    @mcp.tool()
    def drive_get_file_info(file_id: str) -> Dict[str, Any]:
        """Google Drive 파일의 상세 정보를 조회합니다.

        Args:
            file_id: 파일 ID

        Returns:
            파일 상세 정보
        """
        service = get_drive_service()

        file = (
            service.files()
            .get(
                fileId=file_id,
                fields="id, name, mimeType, size, createdTime, modifiedTime, parents, webViewLink, webContentLink, iconLink, owners, permissions, starred, trashed",
            )
            .execute()
        )

        return {
            "id": file["id"],
            "name": file["name"],
            "mime_type": file["mimeType"],
            "size": file.get("size"),
            "created_time": file.get("createdTime"),
            "modified_time": file.get("modifiedTime"),
            "parents": file.get("parents", []),
            "web_view_link": file.get("webViewLink"),
            "web_content_link": file.get("webContentLink"),
            "owners": [
                {"name": o.get("displayName"), "email": o.get("emailAddress")}
                for o in file.get("owners", [])
            ],
            "permissions": [
                {
                    "id": p.get("id"),
                    "role": p.get("role"),
                    "type": p.get("type"),
                    "email": p.get("emailAddress"),
                }
                for p in file.get("permissions", [])
            ],
            "starred": file.get("starred"),
            "trashed": file.get("trashed"),
        }
