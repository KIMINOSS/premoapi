"""Google Sheets API 도구 모듈.

스프레드시트 읽기, 쓰기, 생성 기능을 제공합니다.
"""

from typing import Optional, List, Dict, Any, Union

from googleapiclient.discovery import build
from mcp.server.fastmcp import FastMCP

from ..auth import get_credentials


def get_sheets_service():
    """Sheets API 서비스 객체를 반환합니다."""
    creds = get_credentials()
    if not creds:
        raise RuntimeError("Google 인증이 필요합니다. 먼저 인증을 완료하세요.")
    return build("sheets", "v4", credentials=creds)


def register_sheets_tools(mcp: FastMCP):
    """Sheets 도구들을 MCP 서버에 등록합니다."""

    @mcp.tool()
    def sheets_read(
        spreadsheet_id: str,
        range_notation: str = "Sheet1",
        value_render_option: str = "FORMATTED_VALUE",
        date_time_render_option: str = "FORMATTED_STRING",
    ) -> Dict[str, Any]:
        """Google Sheets 스프레드시트 데이터를 읽습니다.

        Args:
            spreadsheet_id: 스프레드시트 ID (URL에서 추출 가능)
            range_notation: 범위 표기 (예: "Sheet1!A1:D10", "Sheet1", "A1:D10")
            value_render_option: 값 렌더링 옵션 ('FORMATTED_VALUE', 'UNFORMATTED_VALUE', 'FORMULA')
            date_time_render_option: 날짜/시간 렌더링 옵션 ('SERIAL_NUMBER', 'FORMATTED_STRING')

        Returns:
            스프레드시트 데이터
        """
        service = get_sheets_service()

        result = (
            service.spreadsheets()
            .values()
            .get(
                spreadsheetId=spreadsheet_id,
                range=range_notation,
                valueRenderOption=value_render_option,
                dateTimeRenderOption=date_time_render_option,
            )
            .execute()
        )

        values = result.get("values", [])

        return {
            "spreadsheet_id": spreadsheet_id,
            "range": result.get("range"),
            "major_dimension": result.get("majorDimension", "ROWS"),
            "row_count": len(values),
            "column_count": max(len(row) for row in values) if values else 0,
            "values": values,
        }

    @mcp.tool()
    def sheets_write(
        spreadsheet_id: str,
        range_notation: str,
        values: List[List[Any]],
        value_input_option: str = "USER_ENTERED",
        insert_data_option: str = "OVERWRITE",
    ) -> Dict[str, Any]:
        """Google Sheets 스프레드시트에 데이터를 씁니다.

        Args:
            spreadsheet_id: 스프레드시트 ID
            range_notation: 범위 표기 (예: "Sheet1!A1:D10", "Sheet1!A1")
            values: 2D 배열 형태의 데이터 (예: [["A1", "B1"], ["A2", "B2"]])
            value_input_option: 입력 옵션 ('RAW', 'USER_ENTERED')
            insert_data_option: 삽입 옵션 ('OVERWRITE', 'INSERT_ROWS')

        Returns:
            업데이트 결과
        """
        service = get_sheets_service()

        body = {"values": values}

        result = (
            service.spreadsheets()
            .values()
            .update(
                spreadsheetId=spreadsheet_id,
                range=range_notation,
                valueInputOption=value_input_option,
                body=body,
            )
            .execute()
        )

        return {
            "success": True,
            "spreadsheet_id": result.get("spreadsheetId"),
            "updated_range": result.get("updatedRange"),
            "updated_rows": result.get("updatedRows"),
            "updated_columns": result.get("updatedColumns"),
            "updated_cells": result.get("updatedCells"),
        }

    @mcp.tool()
    def sheets_append(
        spreadsheet_id: str,
        range_notation: str,
        values: List[List[Any]],
        value_input_option: str = "USER_ENTERED",
        insert_data_option: str = "INSERT_ROWS",
    ) -> Dict[str, Any]:
        """Google Sheets 스프레드시트에 데이터를 추가합니다.

        Args:
            spreadsheet_id: 스프레드시트 ID
            range_notation: 범위 표기 (데이터가 추가될 테이블 범위)
            values: 2D 배열 형태의 데이터
            value_input_option: 입력 옵션 ('RAW', 'USER_ENTERED')
            insert_data_option: 삽입 옵션 ('OVERWRITE', 'INSERT_ROWS')

        Returns:
            추가 결과
        """
        service = get_sheets_service()

        body = {"values": values}

        result = (
            service.spreadsheets()
            .values()
            .append(
                spreadsheetId=spreadsheet_id,
                range=range_notation,
                valueInputOption=value_input_option,
                insertDataOption=insert_data_option,
                body=body,
            )
            .execute()
        )

        updates = result.get("updates", {})

        return {
            "success": True,
            "spreadsheet_id": result.get("spreadsheetId"),
            "table_range": result.get("tableRange"),
            "updated_range": updates.get("updatedRange"),
            "updated_rows": updates.get("updatedRows"),
            "updated_columns": updates.get("updatedColumns"),
            "updated_cells": updates.get("updatedCells"),
        }

    @mcp.tool()
    def sheets_clear(
        spreadsheet_id: str,
        range_notation: str,
    ) -> Dict[str, Any]:
        """Google Sheets 스프레드시트의 지정 범위를 지웁니다.

        Args:
            spreadsheet_id: 스프레드시트 ID
            range_notation: 지울 범위 표기

        Returns:
            클리어 결과
        """
        service = get_sheets_service()

        result = (
            service.spreadsheets()
            .values()
            .clear(spreadsheetId=spreadsheet_id, range=range_notation, body={})
            .execute()
        )

        return {
            "success": True,
            "spreadsheet_id": result.get("spreadsheetId"),
            "cleared_range": result.get("clearedRange"),
        }

    @mcp.tool()
    def sheets_get_info(spreadsheet_id: str) -> Dict[str, Any]:
        """Google Sheets 스프레드시트의 정보를 조회합니다.

        Args:
            spreadsheet_id: 스프레드시트 ID

        Returns:
            스프레드시트 정보
        """
        service = get_sheets_service()

        spreadsheet = (
            service.spreadsheets()
            .get(spreadsheetId=spreadsheet_id)
            .execute()
        )

        properties = spreadsheet.get("properties", {})
        sheets = spreadsheet.get("sheets", [])

        return {
            "spreadsheet_id": spreadsheet.get("spreadsheetId"),
            "title": properties.get("title"),
            "locale": properties.get("locale"),
            "time_zone": properties.get("timeZone"),
            "spreadsheet_url": spreadsheet.get("spreadsheetUrl"),
            "sheets": [
                {
                    "sheet_id": sheet.get("properties", {}).get("sheetId"),
                    "title": sheet.get("properties", {}).get("title"),
                    "index": sheet.get("properties", {}).get("index"),
                    "sheet_type": sheet.get("properties", {}).get("sheetType"),
                    "row_count": sheet.get("properties", {})
                    .get("gridProperties", {})
                    .get("rowCount"),
                    "column_count": sheet.get("properties", {})
                    .get("gridProperties", {})
                    .get("columnCount"),
                    "frozen_row_count": sheet.get("properties", {})
                    .get("gridProperties", {})
                    .get("frozenRowCount"),
                    "frozen_column_count": sheet.get("properties", {})
                    .get("gridProperties", {})
                    .get("frozenColumnCount"),
                }
                for sheet in sheets
            ],
        }

    @mcp.tool()
    def sheets_create(
        title: str,
        sheet_names: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """새 Google Sheets 스프레드시트를 생성합니다.

        Args:
            title: 스프레드시트 제목
            sheet_names: 시트 이름 목록 (미지정 시 "Sheet1" 생성)

        Returns:
            생성된 스프레드시트 정보
        """
        service = get_sheets_service()

        spreadsheet = {"properties": {"title": title}}

        if sheet_names:
            spreadsheet["sheets"] = [
                {"properties": {"title": name}} for name in sheet_names
            ]

        result = service.spreadsheets().create(body=spreadsheet).execute()

        return {
            "success": True,
            "spreadsheet_id": result.get("spreadsheetId"),
            "title": result.get("properties", {}).get("title"),
            "spreadsheet_url": result.get("spreadsheetUrl"),
            "sheets": [
                {
                    "sheet_id": sheet.get("properties", {}).get("sheetId"),
                    "title": sheet.get("properties", {}).get("title"),
                }
                for sheet in result.get("sheets", [])
            ],
        }

    @mcp.tool()
    def sheets_add_sheet(
        spreadsheet_id: str,
        title: str,
        row_count: int = 1000,
        column_count: int = 26,
    ) -> Dict[str, Any]:
        """스프레드시트에 새 시트를 추가합니다.

        Args:
            spreadsheet_id: 스프레드시트 ID
            title: 새 시트 제목
            row_count: 행 수 (기본값: 1000)
            column_count: 열 수 (기본값: 26)

        Returns:
            추가된 시트 정보
        """
        service = get_sheets_service()

        request = {
            "requests": [
                {
                    "addSheet": {
                        "properties": {
                            "title": title,
                            "gridProperties": {
                                "rowCount": row_count,
                                "columnCount": column_count,
                            },
                        }
                    }
                }
            ]
        }

        result = (
            service.spreadsheets()
            .batchUpdate(spreadsheetId=spreadsheet_id, body=request)
            .execute()
        )

        reply = result.get("replies", [{}])[0].get("addSheet", {}).get("properties", {})

        return {
            "success": True,
            "spreadsheet_id": spreadsheet_id,
            "sheet_id": reply.get("sheetId"),
            "title": reply.get("title"),
            "index": reply.get("index"),
        }

    @mcp.tool()
    def sheets_delete_sheet(
        spreadsheet_id: str,
        sheet_id: int,
    ) -> Dict[str, Any]:
        """스프레드시트에서 시트를 삭제합니다.

        Args:
            spreadsheet_id: 스프레드시트 ID
            sheet_id: 삭제할 시트 ID (시트 이름이 아닌 숫자 ID)

        Returns:
            삭제 결과
        """
        service = get_sheets_service()

        request = {"requests": [{"deleteSheet": {"sheetId": sheet_id}}]}

        service.spreadsheets().batchUpdate(
            spreadsheetId=spreadsheet_id, body=request
        ).execute()

        return {
            "success": True,
            "spreadsheet_id": spreadsheet_id,
            "deleted_sheet_id": sheet_id,
        }

    @mcp.tool()
    def sheets_batch_get(
        spreadsheet_id: str,
        ranges: List[str],
        value_render_option: str = "FORMATTED_VALUE",
    ) -> Dict[str, Any]:
        """여러 범위의 데이터를 한 번에 읽습니다.

        Args:
            spreadsheet_id: 스프레드시트 ID
            ranges: 범위 표기 목록 (예: ["Sheet1!A1:B10", "Sheet2!C1:D5"])
            value_render_option: 값 렌더링 옵션

        Returns:
            각 범위별 데이터
        """
        service = get_sheets_service()

        result = (
            service.spreadsheets()
            .values()
            .batchGet(
                spreadsheetId=spreadsheet_id,
                ranges=ranges,
                valueRenderOption=value_render_option,
            )
            .execute()
        )

        value_ranges = result.get("valueRanges", [])

        return {
            "spreadsheet_id": result.get("spreadsheetId"),
            "ranges": [
                {
                    "range": vr.get("range"),
                    "major_dimension": vr.get("majorDimension", "ROWS"),
                    "values": vr.get("values", []),
                }
                for vr in value_ranges
            ],
        }

    @mcp.tool()
    def sheets_batch_update(
        spreadsheet_id: str,
        data: List[Dict[str, Any]],
        value_input_option: str = "USER_ENTERED",
    ) -> Dict[str, Any]:
        """여러 범위에 데이터를 한 번에 씁니다.

        Args:
            spreadsheet_id: 스프레드시트 ID
            data: 범위와 값 목록 (예: [{"range": "A1:B2", "values": [[1, 2], [3, 4]]}])
            value_input_option: 입력 옵션

        Returns:
            업데이트 결과
        """
        service = get_sheets_service()

        body = {"valueInputOption": value_input_option, "data": data}

        result = (
            service.spreadsheets()
            .values()
            .batchUpdate(spreadsheetId=spreadsheet_id, body=body)
            .execute()
        )

        return {
            "success": True,
            "spreadsheet_id": result.get("spreadsheetId"),
            "total_updated_rows": result.get("totalUpdatedRows"),
            "total_updated_columns": result.get("totalUpdatedColumns"),
            "total_updated_cells": result.get("totalUpdatedCells"),
            "total_updated_sheets": result.get("totalUpdatedSheets"),
            "responses": [
                {
                    "updated_range": r.get("updatedRange"),
                    "updated_rows": r.get("updatedRows"),
                    "updated_columns": r.get("updatedColumns"),
                    "updated_cells": r.get("updatedCells"),
                }
                for r in result.get("responses", [])
            ],
        }

    @mcp.tool()
    def sheets_find_replace(
        spreadsheet_id: str,
        find: str,
        replacement: str,
        sheet_id: Optional[int] = None,
        match_case: bool = False,
        match_entire_cell: bool = False,
        search_by_regex: bool = False,
    ) -> Dict[str, Any]:
        """스프레드시트에서 텍스트를 찾아 바꿉니다.

        Args:
            spreadsheet_id: 스프레드시트 ID
            find: 찾을 텍스트
            replacement: 바꿀 텍스트
            sheet_id: 특정 시트 ID (미지정 시 전체 시트)
            match_case: 대소문자 구분
            match_entire_cell: 셀 전체 일치
            search_by_regex: 정규표현식 사용

        Returns:
            찾기/바꾸기 결과
        """
        service = get_sheets_service()

        find_replace = {
            "find": find,
            "replacement": replacement,
            "matchCase": match_case,
            "matchEntireCell": match_entire_cell,
            "searchByRegex": search_by_regex,
            "allSheets": sheet_id is None,
        }

        if sheet_id is not None:
            find_replace["sheetId"] = sheet_id

        request = {"requests": [{"findReplace": find_replace}]}

        result = (
            service.spreadsheets()
            .batchUpdate(spreadsheetId=spreadsheet_id, body=request)
            .execute()
        )

        reply = result.get("replies", [{}])[0].get("findReplace", {})

        return {
            "success": True,
            "spreadsheet_id": spreadsheet_id,
            "occurrences_changed": reply.get("occurrencesChanged", 0),
            "rows_changed": reply.get("rowsChanged", 0),
            "sheets_changed": reply.get("sheetsChanged", 0),
            "values_changed": reply.get("valuesChanged", 0),
        }
