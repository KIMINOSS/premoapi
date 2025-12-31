"""Google Calendar API 도구 모듈.

일정 목록 조회, 생성, 수정, 삭제 기능을 제공합니다.
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from googleapiclient.discovery import build
from mcp.server.fastmcp import FastMCP

from ..auth import get_credentials


def get_calendar_service():
    """Calendar API 서비스 객체를 반환합니다."""
    creds = get_credentials()
    if not creds:
        raise RuntimeError("Google 인증이 필요합니다. 먼저 인증을 완료하세요.")
    return build("calendar", "v3", credentials=creds)


def register_calendar_tools(mcp: FastMCP):
    """Calendar 도구들을 MCP 서버에 등록합니다."""

    @mcp.tool()
    def calendar_list(
        calendar_id: str = "primary",
        time_min: Optional[str] = None,
        time_max: Optional[str] = None,
        max_results: int = 20,
        search_query: Optional[str] = None,
        show_deleted: bool = False,
    ) -> Dict[str, Any]:
        """Google Calendar 일정 목록을 조회합니다.

        Args:
            calendar_id: 캘린더 ID (기본값: "primary" - 기본 캘린더)
            time_min: 시작 시간 (ISO 8601 형식, 예: "2024-01-01T00:00:00Z")
            time_max: 종료 시간 (ISO 8601 형식)
            max_results: 최대 결과 수 (기본값: 20, 최대: 2500)
            search_query: 검색어 (일정 제목, 설명에서 검색)
            show_deleted: 삭제된 일정 포함 여부

        Returns:
            일정 목록
        """
        service = get_calendar_service()

        # 기본 시간 범위 설정 (미지정 시 현재 시간부터)
        if not time_min:
            time_min = datetime.utcnow().isoformat() + "Z"

        # API 호출
        events_result = (
            service.events()
            .list(
                calendarId=calendar_id,
                timeMin=time_min,
                timeMax=time_max,
                maxResults=min(max_results, 2500),
                singleEvents=True,
                orderBy="startTime",
                q=search_query,
                showDeleted=show_deleted,
            )
            .execute()
        )

        events = events_result.get("items", [])

        return {
            "calendar_id": calendar_id,
            "total_results": len(events),
            "time_min": time_min,
            "time_max": time_max,
            "events": [
                {
                    "id": event["id"],
                    "summary": event.get("summary", "(제목 없음)"),
                    "description": event.get("description"),
                    "location": event.get("location"),
                    "start": event.get("start", {}).get("dateTime")
                    or event.get("start", {}).get("date"),
                    "end": event.get("end", {}).get("dateTime")
                    or event.get("end", {}).get("date"),
                    "all_day": "date" in event.get("start", {}),
                    "status": event.get("status"),
                    "html_link": event.get("htmlLink"),
                    "creator": event.get("creator", {}).get("email"),
                    "organizer": event.get("organizer", {}).get("email"),
                    "attendees": [
                        {
                            "email": a.get("email"),
                            "response_status": a.get("responseStatus"),
                        }
                        for a in event.get("attendees", [])
                    ],
                    "recurring_event_id": event.get("recurringEventId"),
                }
                for event in events
            ],
            "next_page_token": events_result.get("nextPageToken"),
        }

    @mcp.tool()
    def calendar_create(
        summary: str,
        start: str,
        end: str,
        calendar_id: str = "primary",
        description: Optional[str] = None,
        location: Optional[str] = None,
        attendees: Optional[List[str]] = None,
        all_day: bool = False,
        timezone: str = "Asia/Seoul",
        reminders_minutes: Optional[List[int]] = None,
        recurrence: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Google Calendar에 일정을 생성합니다.

        Args:
            summary: 일정 제목
            start: 시작 시간 (ISO 8601 형식, 예: "2024-01-15T10:00:00")
            end: 종료 시간 (ISO 8601 형식)
            calendar_id: 캘린더 ID (기본값: "primary")
            description: 일정 설명
            location: 장소
            attendees: 참석자 이메일 목록
            all_day: 종일 일정 여부
            timezone: 시간대 (기본값: "Asia/Seoul")
            reminders_minutes: 알림 시간 목록 (분 단위, 예: [10, 60])
            recurrence: 반복 규칙 (RRULE 형식, 예: "RRULE:FREQ=WEEKLY;COUNT=10")

        Returns:
            생성된 일정 정보
        """
        service = get_calendar_service()

        # 일정 데이터 구성
        event = {
            "summary": summary,
        }

        # 시작/종료 시간 설정
        if all_day:
            # 종일 일정
            event["start"] = {"date": start[:10]}  # YYYY-MM-DD 형식
            event["end"] = {"date": end[:10]}
        else:
            event["start"] = {"dateTime": start, "timeZone": timezone}
            event["end"] = {"dateTime": end, "timeZone": timezone}

        if description:
            event["description"] = description

        if location:
            event["location"] = location

        if attendees:
            event["attendees"] = [{"email": email} for email in attendees]

        if reminders_minutes:
            event["reminders"] = {
                "useDefault": False,
                "overrides": [
                    {"method": "popup", "minutes": minutes}
                    for minutes in reminders_minutes
                ],
            }

        if recurrence:
            event["recurrence"] = [recurrence]

        # 일정 생성
        created_event = (
            service.events()
            .insert(calendarId=calendar_id, body=event, sendUpdates="all")
            .execute()
        )

        return {
            "success": True,
            "id": created_event["id"],
            "summary": created_event.get("summary"),
            "start": created_event.get("start"),
            "end": created_event.get("end"),
            "html_link": created_event.get("htmlLink"),
            "status": created_event.get("status"),
        }

    @mcp.tool()
    def calendar_update(
        event_id: str,
        calendar_id: str = "primary",
        summary: Optional[str] = None,
        start: Optional[str] = None,
        end: Optional[str] = None,
        description: Optional[str] = None,
        location: Optional[str] = None,
        timezone: str = "Asia/Seoul",
    ) -> Dict[str, Any]:
        """Google Calendar 일정을 수정합니다.

        Args:
            event_id: 일정 ID
            calendar_id: 캘린더 ID (기본값: "primary")
            summary: 새 일정 제목
            start: 새 시작 시간 (ISO 8601 형식)
            end: 새 종료 시간 (ISO 8601 형식)
            description: 새 일정 설명
            location: 새 장소
            timezone: 시간대 (기본값: "Asia/Seoul")

        Returns:
            수정된 일정 정보
        """
        service = get_calendar_service()

        # 기존 일정 가져오기
        event = (
            service.events().get(calendarId=calendar_id, eventId=event_id).execute()
        )

        # 수정할 필드 업데이트
        if summary is not None:
            event["summary"] = summary

        if description is not None:
            event["description"] = description

        if location is not None:
            event["location"] = location

        if start is not None:
            if "date" in event.get("start", {}):
                # 종일 일정
                event["start"] = {"date": start[:10]}
            else:
                event["start"] = {"dateTime": start, "timeZone": timezone}

        if end is not None:
            if "date" in event.get("end", {}):
                # 종일 일정
                event["end"] = {"date": end[:10]}
            else:
                event["end"] = {"dateTime": end, "timeZone": timezone}

        # 일정 업데이트
        updated_event = (
            service.events()
            .update(calendarId=calendar_id, eventId=event_id, body=event)
            .execute()
        )

        return {
            "success": True,
            "id": updated_event["id"],
            "summary": updated_event.get("summary"),
            "start": updated_event.get("start"),
            "end": updated_event.get("end"),
            "html_link": updated_event.get("htmlLink"),
            "updated": updated_event.get("updated"),
        }

    @mcp.tool()
    def calendar_delete(
        event_id: str,
        calendar_id: str = "primary",
        send_updates: str = "all",
    ) -> Dict[str, Any]:
        """Google Calendar 일정을 삭제합니다.

        Args:
            event_id: 일정 ID
            calendar_id: 캘린더 ID (기본값: "primary")
            send_updates: 알림 발송 대상 ('all', 'externalOnly', 'none')

        Returns:
            삭제 결과
        """
        service = get_calendar_service()

        service.events().delete(
            calendarId=calendar_id, eventId=event_id, sendUpdates=send_updates
        ).execute()

        return {
            "success": True,
            "event_id": event_id,
            "calendar_id": calendar_id,
            "action": "deleted",
        }

    @mcp.tool()
    def calendar_get_event(
        event_id: str,
        calendar_id: str = "primary",
    ) -> Dict[str, Any]:
        """Google Calendar 일정 상세 정보를 조회합니다.

        Args:
            event_id: 일정 ID
            calendar_id: 캘린더 ID (기본값: "primary")

        Returns:
            일정 상세 정보
        """
        service = get_calendar_service()

        event = (
            service.events().get(calendarId=calendar_id, eventId=event_id).execute()
        )

        return {
            "id": event["id"],
            "summary": event.get("summary", "(제목 없음)"),
            "description": event.get("description"),
            "location": event.get("location"),
            "start": event.get("start"),
            "end": event.get("end"),
            "status": event.get("status"),
            "html_link": event.get("htmlLink"),
            "created": event.get("created"),
            "updated": event.get("updated"),
            "creator": event.get("creator"),
            "organizer": event.get("organizer"),
            "attendees": event.get("attendees", []),
            "reminders": event.get("reminders"),
            "recurrence": event.get("recurrence"),
            "recurring_event_id": event.get("recurringEventId"),
        }

    @mcp.tool()
    def calendar_list_calendars() -> Dict[str, Any]:
        """사용 가능한 캘린더 목록을 조회합니다.

        Returns:
            캘린더 목록
        """
        service = get_calendar_service()

        calendar_list = service.calendarList().list().execute()
        calendars = calendar_list.get("items", [])

        return {
            "total_calendars": len(calendars),
            "calendars": [
                {
                    "id": cal["id"],
                    "summary": cal.get("summary"),
                    "description": cal.get("description"),
                    "primary": cal.get("primary", False),
                    "access_role": cal.get("accessRole"),
                    "background_color": cal.get("backgroundColor"),
                    "foreground_color": cal.get("foregroundColor"),
                    "time_zone": cal.get("timeZone"),
                }
                for cal in calendars
            ],
        }

    @mcp.tool()
    def calendar_quick_add(
        text: str,
        calendar_id: str = "primary",
    ) -> Dict[str, Any]:
        """자연어로 빠르게 일정을 추가합니다.

        Args:
            text: 자연어 일정 설명 (예: "내일 오후 3시에 팀 미팅")
            calendar_id: 캘린더 ID (기본값: "primary")

        Returns:
            생성된 일정 정보
        """
        service = get_calendar_service()

        event = (
            service.events()
            .quickAdd(calendarId=calendar_id, text=text)
            .execute()
        )

        return {
            "success": True,
            "id": event["id"],
            "summary": event.get("summary"),
            "start": event.get("start"),
            "end": event.get("end"),
            "html_link": event.get("htmlLink"),
        }

    @mcp.tool()
    def calendar_free_busy(
        time_min: str,
        time_max: str,
        calendar_ids: Optional[List[str]] = None,
        timezone: str = "Asia/Seoul",
    ) -> Dict[str, Any]:
        """지정된 시간 범위의 바쁨/여유 정보를 조회합니다.

        Args:
            time_min: 시작 시간 (ISO 8601 형식)
            time_max: 종료 시간 (ISO 8601 형식)
            calendar_ids: 조회할 캘린더 ID 목록 (기본값: ["primary"])
            timezone: 시간대 (기본값: "Asia/Seoul")

        Returns:
            바쁨/여유 정보
        """
        service = get_calendar_service()

        if not calendar_ids:
            calendar_ids = ["primary"]

        body = {
            "timeMin": time_min,
            "timeMax": time_max,
            "timeZone": timezone,
            "items": [{"id": cal_id} for cal_id in calendar_ids],
        }

        result = service.freebusy().query(body=body).execute()

        calendars_busy = {}
        for cal_id, cal_info in result.get("calendars", {}).items():
            calendars_busy[cal_id] = {
                "busy": cal_info.get("busy", []),
                "errors": cal_info.get("errors", []),
            }

        return {
            "time_min": time_min,
            "time_max": time_max,
            "timezone": timezone,
            "calendars": calendars_busy,
        }
