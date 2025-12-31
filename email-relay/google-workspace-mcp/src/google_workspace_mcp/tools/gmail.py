"""Gmail API 도구 모듈.

이메일 발송, 읽기, 검색 기능을 제공합니다.
"""

import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional, List, Dict, Any

from googleapiclient.discovery import build
from mcp.server.fastmcp import FastMCP

from ..auth import get_credentials


def get_gmail_service():
    """Gmail API 서비스 객체를 반환합니다."""
    creds = get_credentials()
    if not creds:
        raise RuntimeError("Google 인증이 필요합니다. 먼저 인증을 완료하세요.")
    return build("gmail", "v1", credentials=creds)


def register_gmail_tools(mcp: FastMCP):
    """Gmail 도구들을 MCP 서버에 등록합니다."""

    @mcp.tool()
    def gmail_send(
        to: str,
        subject: str,
        body: str,
        cc: Optional[str] = None,
        bcc: Optional[str] = None,
        html: bool = False,
    ) -> Dict[str, Any]:
        """이메일을 발송합니다.

        Args:
            to: 수신자 이메일 주소 (쉼표로 구분하여 여러 명 지정 가능)
            subject: 이메일 제목
            body: 이메일 본문
            cc: 참조 이메일 주소 (선택사항, 쉼표로 구분)
            bcc: 숨은참조 이메일 주소 (선택사항, 쉼표로 구분)
            html: HTML 형식 여부 (기본값: False)

        Returns:
            발송된 이메일 정보
        """
        service = get_gmail_service()

        # 메시지 생성
        if html:
            message = MIMEMultipart("alternative")
            message.attach(MIMEText(body, "html"))
        else:
            message = MIMEText(body)

        message["to"] = to
        message["subject"] = subject

        if cc:
            message["cc"] = cc
        if bcc:
            message["bcc"] = bcc

        # Base64 인코딩
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

        # 이메일 발송
        sent_message = (
            service.users().messages().send(userId="me", body={"raw": raw}).execute()
        )

        return {
            "success": True,
            "message_id": sent_message["id"],
            "thread_id": sent_message.get("threadId"),
            "to": to,
            "subject": subject,
        }

    @mcp.tool()
    def gmail_read(
        message_id: str,
        format: str = "full",
    ) -> Dict[str, Any]:
        """특정 이메일을 읽습니다.

        Args:
            message_id: 이메일 메시지 ID
            format: 응답 형식 ('full', 'metadata', 'minimal', 'raw')

        Returns:
            이메일 상세 정보
        """
        service = get_gmail_service()

        message = (
            service.users()
            .messages()
            .get(userId="me", id=message_id, format=format)
            .execute()
        )

        # 헤더 파싱
        headers = {}
        if "payload" in message and "headers" in message["payload"]:
            for header in message["payload"]["headers"]:
                headers[header["name"].lower()] = header["value"]

        # 본문 추출
        body = ""
        if "payload" in message:
            payload = message["payload"]
            if "body" in payload and "data" in payload["body"]:
                body = base64.urlsafe_b64decode(payload["body"]["data"]).decode()
            elif "parts" in payload:
                for part in payload["parts"]:
                    if part["mimeType"] == "text/plain" and "data" in part.get(
                        "body", {}
                    ):
                        body = base64.urlsafe_b64decode(part["body"]["data"]).decode()
                        break
                    elif part["mimeType"] == "text/html" and "data" in part.get(
                        "body", {}
                    ):
                        body = base64.urlsafe_b64decode(part["body"]["data"]).decode()

        return {
            "id": message["id"],
            "thread_id": message.get("threadId"),
            "label_ids": message.get("labelIds", []),
            "snippet": message.get("snippet"),
            "from": headers.get("from"),
            "to": headers.get("to"),
            "subject": headers.get("subject"),
            "date": headers.get("date"),
            "body": body,
            "internal_date": message.get("internalDate"),
        }

    @mcp.tool()
    def gmail_search(
        query: str,
        max_results: int = 10,
        label_ids: Optional[List[str]] = None,
        include_spam_trash: bool = False,
    ) -> Dict[str, Any]:
        """이메일을 검색합니다.

        Args:
            query: Gmail 검색 쿼리 (예: "from:user@example.com subject:회의")
            max_results: 최대 결과 수 (기본값: 10, 최대: 500)
            label_ids: 라벨 ID 목록으로 필터링 (예: ["INBOX", "UNREAD"])
            include_spam_trash: 스팸/휴지통 포함 여부

        Returns:
            검색된 이메일 목록
        """
        service = get_gmail_service()

        # 검색 실행
        results = (
            service.users()
            .messages()
            .list(
                userId="me",
                q=query,
                maxResults=min(max_results, 500),
                labelIds=label_ids,
                includeSpamTrash=include_spam_trash,
            )
            .execute()
        )

        messages = results.get("messages", [])

        # 각 메시지의 기본 정보 가져오기
        email_list = []
        for msg in messages:
            try:
                message = (
                    service.users()
                    .messages()
                    .get(userId="me", id=msg["id"], format="metadata")
                    .execute()
                )

                headers = {}
                if "payload" in message and "headers" in message["payload"]:
                    for header in message["payload"]["headers"]:
                        if header["name"].lower() in [
                            "from",
                            "to",
                            "subject",
                            "date",
                        ]:
                            headers[header["name"].lower()] = header["value"]

                email_list.append(
                    {
                        "id": message["id"],
                        "thread_id": message.get("threadId"),
                        "snippet": message.get("snippet"),
                        "from": headers.get("from"),
                        "to": headers.get("to"),
                        "subject": headers.get("subject"),
                        "date": headers.get("date"),
                        "label_ids": message.get("labelIds", []),
                    }
                )
            except Exception as e:
                email_list.append({"id": msg["id"], "error": str(e)})

        return {
            "total_results": len(email_list),
            "query": query,
            "emails": email_list,
            "next_page_token": results.get("nextPageToken"),
        }

    @mcp.tool()
    def gmail_list_labels() -> Dict[str, Any]:
        """Gmail 라벨 목록을 조회합니다.

        Returns:
            라벨 목록
        """
        service = get_gmail_service()

        results = service.users().labels().list(userId="me").execute()
        labels = results.get("labels", [])

        return {
            "total_labels": len(labels),
            "labels": [
                {
                    "id": label["id"],
                    "name": label["name"],
                    "type": label.get("type"),
                    "message_list_visibility": label.get("messageListVisibility"),
                    "label_list_visibility": label.get("labelListVisibility"),
                }
                for label in labels
            ],
        }

    @mcp.tool()
    def gmail_modify_labels(
        message_id: str,
        add_labels: Optional[List[str]] = None,
        remove_labels: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """이메일의 라벨을 수정합니다.

        Args:
            message_id: 이메일 메시지 ID
            add_labels: 추가할 라벨 ID 목록
            remove_labels: 제거할 라벨 ID 목록

        Returns:
            수정된 메시지 정보
        """
        service = get_gmail_service()

        body = {}
        if add_labels:
            body["addLabelIds"] = add_labels
        if remove_labels:
            body["removeLabelIds"] = remove_labels

        message = (
            service.users()
            .messages()
            .modify(userId="me", id=message_id, body=body)
            .execute()
        )

        return {
            "id": message["id"],
            "thread_id": message.get("threadId"),
            "label_ids": message.get("labelIds", []),
        }

    @mcp.tool()
    def gmail_trash(message_id: str) -> Dict[str, Any]:
        """이메일을 휴지통으로 이동합니다.

        Args:
            message_id: 이메일 메시지 ID

        Returns:
            휴지통으로 이동된 메시지 정보
        """
        service = get_gmail_service()

        message = (
            service.users().messages().trash(userId="me", id=message_id).execute()
        )

        return {
            "id": message["id"],
            "thread_id": message.get("threadId"),
            "label_ids": message.get("labelIds", []),
            "trashed": True,
        }

    @mcp.tool()
    def gmail_untrash(message_id: str) -> Dict[str, Any]:
        """이메일을 휴지통에서 복원합니다.

        Args:
            message_id: 이메일 메시지 ID

        Returns:
            복원된 메시지 정보
        """
        service = get_gmail_service()

        message = (
            service.users().messages().untrash(userId="me", id=message_id).execute()
        )

        return {
            "id": message["id"],
            "thread_id": message.get("threadId"),
            "label_ids": message.get("labelIds", []),
            "trashed": False,
        }
