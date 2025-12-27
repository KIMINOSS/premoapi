'use client';

import React, { useState, useEffect, useMemo } from 'react';

// 인터페이스 설정 (API 호출용 메타데이터 - 백엔드 테스트 기준)
const INTERFACE_CONFIG: Record<string, { docType: string; serial: string }> = {
  'MMPM8001': { docType: 'ZFMMP_S_API_MATERIAL_MASTER', serial: '80010' },
  'MMPM8002': { docType: 'ZFMMP_S_API_GRIV_D1', serial: '80020' },
  'MMPM8003': { docType: 'ZFMMP_S_API_HQ_GR_INFO', serial: '80030' },
  'MMPM8004': { docType: 'ZFMMP_S_API_GRIV_D9', serial: '80050' },
  'MMPM8005': { docType: 'ZFMMP_S_API_SC_GI_DB', serial: '80130' },
  'MMPM8006': { docType: 'ZFMMP_S_API_DAILY_GROSS_HQ', serial: '80060' },
  'MMPM8007': { docType: 'ZFMMP_S_API_WEEKLY_GROSS_HQ', serial: '80070' },
  'MMPM8008': { docType: 'ZFMMP_S_API_DISPLAY_LP_ASN_HQ', serial: '80080' },
  'MMPM8009': { docType: 'ZFMMP_R_API_CREATE_LP_ASN_HQ', serial: '80090' },
  'MMPM8010': { docType: 'ZFMMP_S_API_RETRO_RESULT', serial: '80100' },
  'MMPM8011': { docType: 'ZFMMP_S_API_SC_PHY_STOCK_LIST', serial: '80110' },
  'MMPM8012': { docType: 'ZFMMP_R_API_SC_PHY_STOCK_SAVE', serial: '80120' },
  'MMPM8013': { docType: 'ZFMMP_S_API_REQMT_HQ', serial: '80040' },
  'MMPM8014': { docType: 'ZFMMP_S_API_CONSIGNMNT', serial: '80140' },
  'MMPM8015': { docType: 'ZFMMP_R_API_ADJ_CONSIGNMNT', serial: '80150' },
};

const HMC_INTERFACES = [
  { id: 'MMPM8001', name: { ko: '품목 정보', en: 'Material Info' }, params: ['I_LIFNR', 'I_WERKS'] },
  { id: 'MMPM8002', name: { ko: '검수 합격 통보서', en: 'Inspection Report' }, params: ['I_LIFNR', 'I_ZDSEND2_START'] },
  { id: 'MMPM8003', name: { ko: '입고 실적 조회', en: 'GR Info Query' }, params: ['I_LIFNR', 'I_BUDAT', 'I_WERKS'] },
  { id: 'MMPM8004', name: { ko: '월 검수 정보', en: 'Monthly Sales Info' }, params: ['I_LIFNR', 'I_SPMON'] },
  { id: 'MMPM8005', name: { ko: '사급 매출 현황', en: 'Subcon Sales Info' }, params: ['I_LIFNR', 'I_SPMON'] },
  { id: 'MMPM8006', name: { ko: '일별 소요량', en: 'Daily Demand' }, params: ['I_LIFNR', 'I_DISPD', 'I_ZPLDAYS', 'I_WERKS'] },
  { id: 'MMPM8007', name: { ko: '주별 소요량', en: 'Weekly Demand' }, params: ['I_LIFNR', 'I_DISPW', 'I_WERKS'] },
  { id: 'MMPM8008', name: { ko: '부품 출하 조회', en: 'Shipment Query' }, params: ['I_LIFNR', 'I_ERDAT'] },
  { id: 'MMPM8009', name: { ko: '부품 출하 생성', en: 'Shipment Create' }, params: ['I_LIFNR', 'I_ZASNNO'] },
  { id: 'MMPM8010', name: { ko: '부품 소급 정산', en: 'Retro Settlement' }, params: ['I_LIFNR', 'I_SPMON'] },
  { id: 'MMPM8011', name: { ko: '유상사급 재고 조회', en: 'Subcon Stock Query' }, params: ['I_LIFNR', 'I_BUDAT', 'I_WERKS', 'I_STATUS'] },
  { id: 'MMPM8012', name: { ko: '유상사급 재고 조정', en: 'Subcon Stock Adjust' }, params: ['I_LIFNR', 'I_BUDAT', 'I_WERKS'] },
  { id: 'MMPM8013', name: { ko: '전주공장 간판발주', en: 'Kanban Order' }, params: ['I_LIFNR', 'I_WERKS'] },
  { id: 'MMPM8014', name: { ko: '업체자율 재고 조회', en: 'VMI Stock Query' }, params: ['I_LIFNR', 'I_BASEDT', 'I_WERKS', 'I_MATNR'] },
  { id: 'MMPM8015', name: { ko: '업체자율 재고 조정', en: 'VMI Stock Adjust' }, params: ['I_LIFNR', 'I_BASEDT', 'I_WERKS'] },
];

const KMC_INTERFACES = [
  { id: 'MMPM8001', name: { ko: '품목 정보', en: 'Material Info' }, params: ['I_LIFNR', 'I_WERKS'] },
  { id: 'MMPM8002', name: { ko: '검수 합격 통보서', en: 'Inspection Report' }, params: ['I_LIFNR', 'I_ZDSEND2_START'] },
  { id: 'MMPM8003', name: { ko: '입고 실적 조회', en: 'GR Info Query' }, params: ['I_LIFNR', 'I_BUDAT', 'I_WERKS'] },
  { id: 'MMPM8004', name: { ko: '월 검수 정보', en: 'Monthly Sales Info' }, params: ['I_LIFNR', 'I_SPMON'] },
  { id: 'MMPM8005', name: { ko: '사급 매출 현황', en: 'Subcon Sales Info' }, params: ['I_LIFNR', 'I_SPMON'] },
  { id: 'MMPM8006', name: { ko: '일별 소요량', en: 'Daily Demand' }, params: ['I_LIFNR', 'I_DISPD', 'I_ZPLDAYS', 'I_WERKS'] },
  { id: 'MMPM8007', name: { ko: '주별 소요량', en: 'Weekly Demand' }, params: ['I_LIFNR', 'I_DISPW', 'I_WERKS'] },
  { id: 'MMPM8008', name: { ko: '부품 출하 조회', en: 'Shipment Query' }, params: ['I_LIFNR', 'I_ERDAT'] },
  { id: 'MMPM8010', name: { ko: '부품 소급 정산', en: 'Retro Settlement' }, params: ['I_LIFNR', 'I_SPMON'] },
  { id: 'MMPM8011', name: { ko: '유상사급 재고 조회', en: 'Subcon Stock Query' }, params: ['I_LIFNR', 'I_BUDAT', 'I_WERKS', 'I_STATUS'] },
  { id: 'MMPM8012', name: { ko: '유상사급 재고 조정', en: 'Subcon Stock Adjust' }, params: ['I_LIFNR', 'I_BUDAT', 'I_WERKS'] },
  { id: 'MMPM8014', name: { ko: '업체자율 재고 조회', en: 'VMI Stock Query' }, params: ['I_LIFNR', 'I_BASEDT', 'I_WERKS', 'I_MATNR'] },
  { id: 'MMPM8015', name: { ko: '업체자율 재고 조정', en: 'VMI Stock Adjust' }, params: ['I_LIFNR', 'I_BASEDT', 'I_WERKS'] },
];

// 파라미터 라벨 (한글/영어)
const PARAM_LABELS: Record<string, { ko: string; en: string }> = {
  'I_LIFNR': { ko: '업체코드', en: 'Vendor' },
  'I_WERKS': { ko: '공장', en: 'Plant' },
  'I_BUDAT': { ko: '기준일자', en: 'Base Date' },
  'I_SPMON': { ko: '기준월', en: 'Base Month' },
  'I_ZDSEND2_START': { ko: '전표일자', en: 'Doc Date' },
  'I_DISPD': { ko: '일별기준일', en: 'Daily Date' },
  'I_DISPW': { ko: '기준월요일', en: 'Base Monday' },
  'I_ZPLDAYS': { ko: '계획일수', en: 'Plan Days' },
  'I_ERDAT': { ko: '생성일자', en: 'Create Date' },
  'I_ZASNNO': { ko: 'ASN번호', en: 'ASN No' },
  'I_STATUS': { ko: '상태', en: 'Status' },
  'I_BASEDT': { ko: '기준일자', en: 'Base Date' },
  'I_MATNR': { ko: '자재번호', en: 'Material' },
};

// 파라미터 라벨 가져오기
const getParamLabel = (key: string, lang: 'ko' | 'en') => {
  return PARAM_LABELS[key]?.[lang] || key;
};

// API 응답 필드 라벨 (한글/영어)
const FIELD_LABELS: Record<string, { ko: string; en: string }> = {
  // 공통
  'MATNR': { ko: '자재번호', en: 'Material No' },
  'MAKTX': { ko: '자재명', en: 'Material Name' },
  'LIFNR': { ko: '업체코드', en: 'Vendor Code' },
  'NAME1': { ko: '업체명', en: 'Vendor Name' },
  'WERKS': { ko: '공장', en: 'Plant' },
  'LGORT': { ko: '저장위치', en: 'Storage Loc' },
  'MEINS': { ko: '단위', en: 'Unit' },
  'MENGE': { ko: '수량', en: 'Quantity' },
  'NETPR': { ko: '단가', en: 'Unit Price' },
  'WAERS': { ko: '통화', en: 'Currency' },
  'BUDAT': { ko: '전기일', en: 'Posting Date' },
  'BLDAT': { ko: '증빙일', en: 'Document Date' },
  'EBELN': { ko: '구매문서', en: 'PO Number' },
  'EBELP': { ko: '구매항목', en: 'PO Item' },
  'BELNR': { ko: '전표번호', en: 'Document No' },
  'BUZEI': { ko: '전표항목', en: 'Doc Item' },
  'GJAHR': { ko: '회계연도', en: 'Fiscal Year' },
  'BUKRS': { ko: '회사코드', en: 'Company Code' },
  // 품목정보
  'MATKL': { ko: '자재그룹', en: 'Material Group' },
  'MTART': { ko: '자재유형', en: 'Material Type' },
  'BRGEW': { ko: '중량', en: 'Weight' },
  'GEWEI': { ko: '중량단위', en: 'Weight Unit' },
  'GROES': { ko: '규격', en: 'Size/Spec' },
  'NORMT': { ko: '도번', en: 'Drawing No' },
  'DATBI': { ko: '유효종료일', en: 'Valid To' },
  'DATAB': { ko: '유효시작일', en: 'Valid From' },
  'DISPO': { ko: 'MRP담당자', en: 'MRP Controller' },
  'LGPBE': { ko: '저장위치', en: 'Storage Bin' },
  'MDV01': { ko: '공급업체', en: 'Supplier' },
  // 커스텀 필드
  'ZCDVIS': { ko: '가시성', en: 'Visibility' },
  'ZCSNACGN': { ko: 'SNA코드', en: 'SNA Code' },
  'ZCLOGRPL': { ko: '물류대체', en: 'Log Replace' },
  'ZCALC_CD': { ko: '계산코드', en: 'Calc Code' },
  'ZCLSTY': { ko: '분류유형', en: 'Class Type' },
  'ZQCONST': { ko: '수량상수', en: 'Qty Const' },
  'ZCCASNO': { ko: 'CAS번호', en: 'CAS No' },
  'ZQPERCS': { ko: '백분율', en: 'Percentage' },
  'ZCPGATE': { ko: '게이트', en: 'Gate' },
  'ZCCYCGN': { ko: '사이클', en: 'Cycle' },
  'ZCGRTY': { ko: '그룹유형', en: 'Group Type' },
  'ZCCAR': { ko: '차종', en: 'Car Type' },
  'ZCQATY': { ko: '수량유형', en: 'Qty Type' },
  // 입출고
  'MBLNR': { ko: '자재문서', en: 'Material Doc' },
  'ZEILE': { ko: '자재항목', en: 'Material Item' },
  'BWART': { ko: '이동유형', en: 'Movement Type' },
  'SHKZG': { ko: '차변/대변', en: 'Debit/Credit' },
  'DMBTR': { ko: '금액', en: 'Amount' },
  'ERFMG': { ko: '입고수량', en: 'GR Quantity' },
  'ERFME': { ko: '입고단위', en: 'GR Unit' },
  // 소요량
  'BDMNG': { ko: '소요량', en: 'Requirement' },
  'BDTER': { ko: '소요일', en: 'Req Date' },
  'PLNUM': { ko: '계획번호', en: 'Plan Number' },
  'DISPD': { ko: '기준일', en: 'Base Date' },
  // ASN/출하
  'ZASNNO': { ko: 'ASN번호', en: 'ASN Number' },
  'ZNDONO': { ko: '납품번호', en: 'Delivery No' },
  'ERDAT': { ko: '생성일', en: 'Created Date' },
  'ERZET': { ko: '생성시간', en: 'Created Time' },
  'ERNAM': { ko: '생성자', en: 'Created By' },
  // 재고
  'LABST': { ko: '가용재고', en: 'Available Stock' },
  'INSME': { ko: '검사재고', en: 'QI Stock' },
  'SPEME': { ko: '보류재고', en: 'Blocked Stock' },
  'GESME': { ko: '총재고', en: 'Total Stock' },
  // 정산
  'SPMON': { ko: '정산월', en: 'Settlement Month' },
  'NETWR': { ko: '정산금액', en: 'Net Amount' },
  'ZRETRO': { ko: '소급금액', en: 'Retro Amount' },
  // 기타
  'ZSTATUS': { ko: '상태', en: 'Status' },
  'ZMSG': { ko: '메시지', en: 'Message' },
  'ZRESULT': { ko: '결과', en: 'Result' },
  // 추가 필드
  'ZPNTNM': { ko: '공장명', en: 'Plant Name' },
  'ZCSHOP': { ko: 'Shop', en: 'Shop' },
  'ZCLLC': { ko: 'LLC', en: 'LLC' },
  'ZQMITU': { ko: 'MITU 재고', en: 'MITU Stock' },
  'ZQWBS': { ko: 'WBS 재고', en: 'WBS Stock' },
  'ZQPRJ': { ko: 'PRJ 재고', en: 'PRJ Stock' },
  'ZQPBS': { ko: 'PBS 재고', en: 'PBS Stock' },
  'ZQWIP': { ko: 'WIP 재고', en: 'WIP Stock' },
  'ZDATFM': { ko: '시작일', en: 'From Date' },
  'ZDATTO': { ko: '종료일', en: 'To Date' },
  'ZWKFM': { ko: '시작주차', en: 'From Week' },
  'ZWKTO': { ko: '종료주차', en: 'To Week' },
  'ZASNTY': { ko: 'ASN유형', en: 'ASN Type' },
  'ZASNSEQ': { ko: 'ASN순번', en: 'ASN Seq' },
  'ZDIVNO': { ko: '분할번호', en: 'Div No' },
  'WEMNG': { ko: '입고수량', en: 'GR Qty' },
  'WAMNG': { ko: '입고예정수량', en: 'GR Plan Qty' },
  'ZGRMENGE': { ko: '입고량', en: 'GR Amount' },
  'ZDLMENGE': { ko: '납품수량', en: 'Delivery Qty' },
  'ZDARR': { ko: '도착일', en: 'Arrival Date' },
  'ZQARR1': { ko: '도착수량', en: 'Arrival Qty' },
  'ZAWZUBB': { ko: '불량수량', en: 'Defect Qty' },
  'GRUND': { ko: '사유코드', en: 'Reason Code' },
  'LFSNR': { ko: '납품서번호', en: 'Delivery Note' },
  'REFLFSPOS': { ko: '납품서항목', en: 'DN Item' },
  'ZDSEND2': { ko: '전표일자', en: 'Doc Date' },
  'ZDSTRIN': { ko: '입고일시', en: 'GR DateTime' },
  'ZLABST': { ko: '가용재고', en: 'Avail Stock' },
  'ZLABST_A': { ko: 'A재고', en: 'Stock A' },
  'ZLABST_P': { ko: 'P재고', en: 'Stock P' },
  'ZLABST_W': { ko: 'W재고', en: 'Stock W' },
  'ZLABST_ALL': { ko: '전체재고', en: 'Total Stock' },
  'ZLABST_PHY': { ko: '실물재고', en: 'Physical Stock' },
  'QTY_PHYSICAL': { ko: '실물수량', en: 'Physical Qty' },
  'QTY_WH': { ko: '창고수량', en: 'WH Qty' },
  'QTY_BASEDT': { ko: '기준일수량', en: 'Base Qty' },
  'QTY_COUNT': { ko: '실사수량', en: 'Count Qty' },
  'QTY_D1': { ko: 'D+1수량', en: 'D+1 Qty' },
  'QTY_D2': { ko: 'D+2수량', en: 'D+2 Qty' },
  'QTY_D3': { ko: 'D+3수량', en: 'D+3 Qty' },
  'QTY_D4': { ko: 'D+4수량', en: 'D+4 Qty' },
  'QTY_ADJ': { ko: '조정수량', en: 'Adj Qty' },
  'ZDIFF_QTY': { ko: '차이수량', en: 'Diff Qty' },
  'ZDAMAGE_QTY': { ko: '손상수량', en: 'Damage Qty' },
  'ZOTHER_QTY': { ko: '기타수량', en: 'Other Qty' },
  'ZPROD_QTY': { ko: '생산수량', en: 'Prod Qty' },
  'ZCLV': { ko: '레벨', en: 'Level' },
  'ZCINDLGN': { ko: '입고지시', en: 'GR Instr' },
  'ZCINSHOP': { ko: '입고Shop', en: 'GR Shop' },
  'ZCOCR': { ko: '소급구분', en: 'Retro Type' },
  'ZCFLAG': { ko: '플래그', en: 'Flag' },
  'ZCSOURCE': { ko: '소스', en: 'Source' },
  'ZCDE': { ko: '내수/수출', en: 'Dom/Exp' },
  'ZCDOC': { ko: '문서유형', en: 'Doc Type' },
  'ZCFDR': { ko: 'FDR', en: 'FDR' },
  'ZCHDPOGB': { ko: '발주구분', en: 'PO Type' },
  'ZANETPR': { ko: '단가', en: 'Unit Price' },
  'ZAPIMAMT': { ko: '금액', en: 'Amount' },
  'ZAOCKEA': { ko: '원가EA', en: 'Cost/EA' },
  'ZAOCL': { ko: '원가L', en: 'Cost L' },
  'ZAOCV': { ko: '원가V', en: 'Cost V' },
  'ZQOCL': { ko: '수량L', en: 'Qty L' },
  'ZQOCV': { ko: '수량V', en: 'Qty V' },
  'ZABSGAM': { ko: '절대금액', en: 'Abs Amount' },
  'EINDT': { ko: '납기일', en: 'Delivery Date' },
  'ZDEPDAT': { ko: '출발일', en: 'Depart Date' },
  'ZDEPTIM': { ko: '출발시간', en: 'Depart Time' },
  'ZEARDAT': { ko: '도착예정일', en: 'ETA Date' },
  'ZEARTIM': { ko: '도착예정시간', en: 'ETA Time' },
  'ZTCYTIM': { ko: '사이클타임', en: 'Cycle Time' },
  'E_DATAB': { ko: '유효시작일', en: 'Valid From' },
  'E_DATBI': { ko: '유효종료일', en: 'Valid To' },
  'ZDFRTA': { ko: '출발RTA', en: 'Depart RTA' },
  'ZDTRTA': { ko: '도착RTA', en: 'Arrival RTA' },
  'ZDLRMOBL': { ko: '차량번호', en: 'Vehicle No' },
  'ZDLRNAME': { ko: '운전자', en: 'Driver' },
  'ZDLTLOC': { ko: '납품장소', en: 'Delivery Loc' },
  'ZCTAG_CO': { ko: '태그회사', en: 'Tag Company' },
  'ZCARNO': { ko: '차량번호', en: 'Car No' },
  'ZNDONUM': { ko: '간판번호', en: 'Kanban No' },
  'ZNDOSEQ': { ko: '간판순번', en: 'Kanban Seq' },
  'BSART': { ko: '발주유형', en: 'PO Type' },
  'TXZ01': { ko: '품목내역', en: 'Item Text' },
  'VBELN': { ko: '판매문서', en: 'Sales Doc' },
  'ZNLLCVR': { ko: 'LLC버전', en: 'LLC Ver' },
  'ZNLLCNR': { ko: 'LLC번호', en: 'LLC No' },
  'ZQLLCOP': { ko: 'LLC OP', en: 'LLC OP' },
  'ZQLLCIS': { ko: 'LLC IS', en: 'LLC IS' },
  'ZQPKQTY': { ko: '포장수량', en: 'Pack Qty' },
  'ZQRINERWT': { ko: '순중량', en: 'Net Weight' },
  'ZADUNPL': { ko: '조정단위L', en: 'Adj Unit L' },
  'ZADUNPV': { ko: '조정단위V', en: 'Adj Unit V' },
  'ZEMSG': { ko: '에러메시지', en: 'Error Msg' },
  'ZREMARK': { ko: '비고', en: 'Remark' },
  'STATUS': { ko: '상태', en: 'Status' },
  'STATUS_NM': { ko: '상태명', en: 'Status Name' },
  'LOEKZ': { ko: '삭제표시', en: 'Del Flag' },
  'ELIKZ': { ko: '완료표시', en: 'Complete' },
  'MBLPO': { ko: '자재문서항목', en: 'Mat Doc Item' },
  'MJAHR': { ko: '자재문서년도', en: 'Mat Doc Year' },
  'LGOBE': { ko: '저장위치명', en: 'Storage Loc Name' },
  // 주별소요량 (ZQW01~ZQW52)
  'ZQW01': { ko: 'W+1주', en: 'W+1' },
  'ZQW02': { ko: 'W+2주', en: 'W+2' },
  'ZQW03': { ko: 'W+3주', en: 'W+3' },
  'ZQW04': { ko: 'W+4주', en: 'W+4' },
  'ZQW05': { ko: 'W+5주', en: 'W+5' },
  'ZQW06': { ko: 'W+6주', en: 'W+6' },
  'ZQW07': { ko: 'W+7주', en: 'W+7' },
  'ZQW08': { ko: 'W+8주', en: 'W+8' },
  'ZQW09': { ko: 'W+9주', en: 'W+9' },
  'ZQW10': { ko: 'W+10주', en: 'W+10' },
  'ZQW11': { ko: 'W+11주', en: 'W+11' },
  'ZQW12': { ko: 'W+12주', en: 'W+12' },
  'ZQW13': { ko: 'W+13주', en: 'W+13' },
  'ZQW14': { ko: 'W+14주', en: 'W+14' },
  'ZQW15': { ko: 'W+15주', en: 'W+15' },
  'ZQW16': { ko: 'W+16주', en: 'W+16' },
  'ZQW17': { ko: 'W+17주', en: 'W+17' },
  'ZQW18': { ko: 'W+18주', en: 'W+18' },
  'ZQW19': { ko: 'W+19주', en: 'W+19' },
  'ZQW20': { ko: 'W+20주', en: 'W+20' },
  'ZQW21': { ko: 'W+21주', en: 'W+21' },
  'ZQW22': { ko: 'W+22주', en: 'W+22' },
  'ZQW23': { ko: 'W+23주', en: 'W+23' },
  'ZQW24': { ko: 'W+24주', en: 'W+24' },
  'ZQW25': { ko: 'W+25주', en: 'W+25' },
  'ZQW26': { ko: 'W+26주', en: 'W+26' },
  'ZQW27': { ko: 'W+27주', en: 'W+27' },
  'ZQW28': { ko: 'W+28주', en: 'W+28' },
  'ZQW29': { ko: 'W+29주', en: 'W+29' },
  'ZQW30': { ko: 'W+30주', en: 'W+30' },
  'ZQW31': { ko: 'W+31주', en: 'W+31' },
  'ZQW32': { ko: 'W+32주', en: 'W+32' },
  'ZQW33': { ko: 'W+33주', en: 'W+33' },
  'ZQW34': { ko: 'W+34주', en: 'W+34' },
  'ZQW35': { ko: 'W+35주', en: 'W+35' },
  'ZQW36': { ko: 'W+36주', en: 'W+36' },
  'ZQW37': { ko: 'W+37주', en: 'W+37' },
  'ZQW38': { ko: 'W+38주', en: 'W+38' },
  'ZQW39': { ko: 'W+39주', en: 'W+39' },
  'ZQW40': { ko: 'W+40주', en: 'W+40' },
  'ZQW41': { ko: 'W+41주', en: 'W+41' },
  'ZQW42': { ko: 'W+42주', en: 'W+42' },
  'ZQW43': { ko: 'W+43주', en: 'W+43' },
  'ZQW44': { ko: 'W+44주', en: 'W+44' },
  'ZQW45': { ko: 'W+45주', en: 'W+45' },
  'ZQW46': { ko: 'W+46주', en: 'W+46' },
  'ZQW47': { ko: 'W+47주', en: 'W+47' },
  'ZQW48': { ko: 'W+48주', en: 'W+48' },
  'ZQW49': { ko: 'W+49주', en: 'W+49' },
  'ZQW50': { ko: 'W+50주', en: 'W+50' },
  'ZQW51': { ko: 'W+51주', en: 'W+51' },
  'ZQW52': { ko: 'W+52주', en: 'W+52' },
  // 일별소요량 (ZQD001~ZQD150)
  'ZQD001': { ko: 'D+1', en: 'D+1' },
  'ZQD002': { ko: 'D+2', en: 'D+2' },
  'ZQD003': { ko: 'D+3', en: 'D+3' },
  'ZQD004': { ko: 'D+4', en: 'D+4' },
  'ZQD005': { ko: 'D+5', en: 'D+5' },
  'ZQD006': { ko: 'D+6', en: 'D+6' },
  'ZQD007': { ko: 'D+7', en: 'D+7' },
  'ZQD008': { ko: 'D+8', en: 'D+8' },
  'ZQD009': { ko: 'D+9', en: 'D+9' },
  'ZQD010': { ko: 'D+10', en: 'D+10' },
  'ZQD011': { ko: 'D+11', en: 'D+11' },
  'ZQD012': { ko: 'D+12', en: 'D+12' },
  'ZQD013': { ko: 'D+13', en: 'D+13' },
  'ZQD014': { ko: 'D+14', en: 'D+14' },
  'ZQD015': { ko: 'D+15', en: 'D+15' },
  'ZQD016': { ko: 'D+16', en: 'D+16' },
  'ZQD017': { ko: 'D+17', en: 'D+17' },
  'ZQD018': { ko: 'D+18', en: 'D+18' },
  'ZQD019': { ko: 'D+19', en: 'D+19' },
  'ZQD020': { ko: 'D+20', en: 'D+20' },
  'ZQD021': { ko: 'D+21', en: 'D+21' },
  'ZQD022': { ko: 'D+22', en: 'D+22' },
  'ZQD023': { ko: 'D+23', en: 'D+23' },
  'ZQD024': { ko: 'D+24', en: 'D+24' },
  'ZQD025': { ko: 'D+25', en: 'D+25' },
  'ZQD026': { ko: 'D+26', en: 'D+26' },
  'ZQD027': { ko: 'D+27', en: 'D+27' },
  'ZQD028': { ko: 'D+28', en: 'D+28' },
  'ZQD029': { ko: 'D+29', en: 'D+29' },
  'ZQD030': { ko: 'D+30', en: 'D+30' },
  'ZQD031': { ko: 'D+31', en: 'D+31' },
  'ZQD032': { ko: 'D+32', en: 'D+32' },
  'ZQD033': { ko: 'D+33', en: 'D+33' },
  'ZQD034': { ko: 'D+34', en: 'D+34' },
  'ZQD035': { ko: 'D+35', en: 'D+35' },
  'ZQD036': { ko: 'D+36', en: 'D+36' },
  'ZQD037': { ko: 'D+37', en: 'D+37' },
  'ZQD038': { ko: 'D+38', en: 'D+38' },
  'ZQD039': { ko: 'D+39', en: 'D+39' },
  'ZQD040': { ko: 'D+40', en: 'D+40' },
  'ZQD041': { ko: 'D+41', en: 'D+41' },
  'ZQD042': { ko: 'D+42', en: 'D+42' },
  'ZQD043': { ko: 'D+43', en: 'D+43' },
  'ZQD044': { ko: 'D+44', en: 'D+44' },
  'ZQD045': { ko: 'D+45', en: 'D+45' },
  'ZQD046': { ko: 'D+46', en: 'D+46' },
  'ZQD047': { ko: 'D+47', en: 'D+47' },
  'ZQD048': { ko: 'D+48', en: 'D+48' },
  'ZQD049': { ko: 'D+49', en: 'D+49' },
  'ZQD050': { ko: 'D+50', en: 'D+50' },
  'ZQD051': { ko: 'D+51', en: 'D+51' },
  'ZQD052': { ko: 'D+52', en: 'D+52' },
  'ZQD053': { ko: 'D+53', en: 'D+53' },
  'ZQD054': { ko: 'D+54', en: 'D+54' },
  'ZQD055': { ko: 'D+55', en: 'D+55' },
  'ZQD056': { ko: 'D+56', en: 'D+56' },
  'ZQD057': { ko: 'D+57', en: 'D+57' },
  'ZQD058': { ko: 'D+58', en: 'D+58' },
  'ZQD059': { ko: 'D+59', en: 'D+59' },
  'ZQD060': { ko: 'D+60', en: 'D+60' },
  'ZQD061': { ko: 'D+61', en: 'D+61' },
  'ZQD062': { ko: 'D+62', en: 'D+62' },
  'ZQD063': { ko: 'D+63', en: 'D+63' },
  'ZQD064': { ko: 'D+64', en: 'D+64' },
  'ZQD065': { ko: 'D+65', en: 'D+65' },
  'ZQD066': { ko: 'D+66', en: 'D+66' },
  'ZQD067': { ko: 'D+67', en: 'D+67' },
  'ZQD068': { ko: 'D+68', en: 'D+68' },
  'ZQD069': { ko: 'D+69', en: 'D+69' },
  'ZQD070': { ko: 'D+70', en: 'D+70' },
  'ZQD071': { ko: 'D+71', en: 'D+71' },
  'ZQD072': { ko: 'D+72', en: 'D+72' },
  'ZQD073': { ko: 'D+73', en: 'D+73' },
  'ZQD074': { ko: 'D+74', en: 'D+74' },
  'ZQD075': { ko: 'D+75', en: 'D+75' },
  'ZQD076': { ko: 'D+76', en: 'D+76' },
  'ZQD077': { ko: 'D+77', en: 'D+77' },
  'ZQD078': { ko: 'D+78', en: 'D+78' },
  'ZQD079': { ko: 'D+79', en: 'D+79' },
  'ZQD080': { ko: 'D+80', en: 'D+80' },
  'ZQD081': { ko: 'D+81', en: 'D+81' },
  'ZQD082': { ko: 'D+82', en: 'D+82' },
  'ZQD083': { ko: 'D+83', en: 'D+83' },
  'ZQD084': { ko: 'D+84', en: 'D+84' },
  'ZQD085': { ko: 'D+85', en: 'D+85' },
  'ZQD086': { ko: 'D+86', en: 'D+86' },
  'ZQD087': { ko: 'D+87', en: 'D+87' },
  'ZQD088': { ko: 'D+88', en: 'D+88' },
  'ZQD089': { ko: 'D+89', en: 'D+89' },
  'ZQD090': { ko: 'D+90', en: 'D+90' },
  'ZQD091': { ko: 'D+91', en: 'D+91' },
  'ZQD092': { ko: 'D+92', en: 'D+92' },
  'ZQD093': { ko: 'D+93', en: 'D+93' },
  'ZQD094': { ko: 'D+94', en: 'D+94' },
  'ZQD095': { ko: 'D+95', en: 'D+95' },
  'ZQD096': { ko: 'D+96', en: 'D+96' },
  'ZQD097': { ko: 'D+97', en: 'D+97' },
  'ZQD098': { ko: 'D+98', en: 'D+98' },
  'ZQD099': { ko: 'D+99', en: 'D+99' },
  'ZQD100': { ko: 'D+100', en: 'D+100' },
  'ZQD101': { ko: 'D+101', en: 'D+101' },
  'ZQD102': { ko: 'D+102', en: 'D+102' },
  'ZQD103': { ko: 'D+103', en: 'D+103' },
  'ZQD104': { ko: 'D+104', en: 'D+104' },
  'ZQD105': { ko: 'D+105', en: 'D+105' },
  'ZQD106': { ko: 'D+106', en: 'D+106' },
  'ZQD107': { ko: 'D+107', en: 'D+107' },
  'ZQD108': { ko: 'D+108', en: 'D+108' },
  'ZQD109': { ko: 'D+109', en: 'D+109' },
  'ZQD110': { ko: 'D+110', en: 'D+110' },
  'ZQD111': { ko: 'D+111', en: 'D+111' },
  'ZQD112': { ko: 'D+112', en: 'D+112' },
  'ZQD113': { ko: 'D+113', en: 'D+113' },
  'ZQD114': { ko: 'D+114', en: 'D+114' },
  'ZQD115': { ko: 'D+115', en: 'D+115' },
  'ZQD116': { ko: 'D+116', en: 'D+116' },
  'ZQD117': { ko: 'D+117', en: 'D+117' },
  'ZQD118': { ko: 'D+118', en: 'D+118' },
  'ZQD119': { ko: 'D+119', en: 'D+119' },
  'ZQD120': { ko: 'D+120', en: 'D+120' },
  'ZQD121': { ko: 'D+121', en: 'D+121' },
  'ZQD122': { ko: 'D+122', en: 'D+122' },
  'ZQD123': { ko: 'D+123', en: 'D+123' },
  'ZQD124': { ko: 'D+124', en: 'D+124' },
  'ZQD125': { ko: 'D+125', en: 'D+125' },
  'ZQD126': { ko: 'D+126', en: 'D+126' },
  'ZQD127': { ko: 'D+127', en: 'D+127' },
  'ZQD128': { ko: 'D+128', en: 'D+128' },
  'ZQD129': { ko: 'D+129', en: 'D+129' },
  'ZQD130': { ko: 'D+130', en: 'D+130' },
  'ZQD131': { ko: 'D+131', en: 'D+131' },
  'ZQD132': { ko: 'D+132', en: 'D+132' },
  'ZQD133': { ko: 'D+133', en: 'D+133' },
  'ZQD134': { ko: 'D+134', en: 'D+134' },
  'ZQD135': { ko: 'D+135', en: 'D+135' },
  'ZQD136': { ko: 'D+136', en: 'D+136' },
  'ZQD137': { ko: 'D+137', en: 'D+137' },
  'ZQD138': { ko: 'D+138', en: 'D+138' },
  'ZQD139': { ko: 'D+139', en: 'D+139' },
  'ZQD140': { ko: 'D+140', en: 'D+140' },
  'ZQD141': { ko: 'D+141', en: 'D+141' },
  'ZQD142': { ko: 'D+142', en: 'D+142' },
  'ZQD143': { ko: 'D+143', en: 'D+143' },
  'ZQD144': { ko: 'D+144', en: 'D+144' },
  'ZQD145': { ko: 'D+145', en: 'D+145' },
  'ZQD146': { ko: 'D+146', en: 'D+146' },
  'ZQD147': { ko: 'D+147', en: 'D+147' },
  'ZQD148': { ko: 'D+148', en: 'D+148' },
  'ZQD149': { ko: 'D+149', en: 'D+149' },
  'ZQD150': { ko: 'D+150', en: 'D+150' },

};
// 인터페이스별 필드 순서 (호출정보 Excel 기준)
const INTERFACE_FIELD_ORDER: Record<string, string[]> = {
  'MMPM8001': ['LIFNR', 'BUKRS', 'WERKS', 'MATNR', 'MDV01', 'DATAB', 'DATBI', 'MAKTX', 'MEINS', 'ZCPGATE', 'ZCCAR', 'ZCCASNO', 'ZQPERCS', 'LGPBE', 'DISPO', 'ZQCONST', 'ZCQATY', 'ZCCYCGN', 'ZCGRTY', 'ZCDVIS', 'ZCLOGRPL', 'ZCLSTY', 'ZCSNACGN', 'EBELN', 'EBELP', 'ZCALC_CD'],
  'MMPM8002': ['ZDSEND2', 'LIFNR', 'WERKS', 'MATNR', 'ZDARR', 'LFSNR', 'REFLFSPOS', 'ZCLV', 'ZCINDLGN', 'ZQARR1', 'WEMNG', 'ZAWZUBB', 'GRUND', 'ZAPIMAMT', 'ZDSTRIN', 'EBELN', 'EBELP', 'ZNLLCVR', 'ZQLLCOP', 'ZQLLCIS', 'ZNLLCNR', 'ZAOCKEA', 'ZQPKQTY', 'ZCINSHOP', 'MBLNR', 'MBLPO', 'MJAHR'],
  'MMPM8003': ['MBLNR', 'MJAHR', 'ZEILE', 'BUDAT', 'ZASNNO', 'ZASNTY', 'ZDIVNO', 'ZASNSEQ', 'MATNR', 'WERKS', 'LGORT', 'BWART', 'MENGE', 'MEINS', 'EBELN', 'EBELP'],
  'MMPM8004': ['LIFNR', 'WERKS', 'MATNR', 'ZCDE', 'ZCINDLGN', 'WEMNG', 'ZAWZUBB'],
  'MMPM8005': ['ZCDOC', 'LIFNR', 'WERKS', 'VBELN', 'MATNR', 'MAKTX', 'WAMNG', 'ZQRINERWT', 'ZANETPR', 'ZABSGAM', 'ZCSOURCE'],
  'MMPM8006': ['MATNR', 'DISPD', 'WERKS', 'ZPNTNM', 'LIFNR', 'ZCSHOP', 'ZCLLC', 'ZCCAR', 'ZQMITU', 'ZQWBS', 'ZQPRJ', 'ZQPBS', 'ZQWIP', 'ZDATFM', 'ZDATTO', 'ZQD001', 'ZQD002', 'ZQD003', 'ZQD004', 'ZQD005', 'ZQD006', 'ZQD007', 'ZQD008', 'ZQD009', 'ZQD010', 'ZQD011', 'ZQD012', 'ZQD013', 'ZQD014', 'ZQD015', 'ZQD016', 'ZQD017', 'ZQD018', 'ZQD019', 'ZQD020', 'ZQD021', 'ZQD022', 'ZQD023', 'ZQD024', 'ZQD025', 'ZQD026', 'ZQD027', 'ZQD028', 'ZQD029', 'ZQD030', 'ZQD031', 'ZQD032', 'ZQD033', 'ZQD034', 'ZQD035', 'ZQD036', 'ZQD037', 'ZQD038', 'ZQD039', 'ZQD040', 'ZQD041', 'ZQD042', 'ZQD043', 'ZQD044', 'ZQD045', 'ZQD046', 'ZQD047', 'ZQD048', 'ZQD049', 'ZQD050', 'ZQD051', 'ZQD052', 'ZQD053', 'ZQD054', 'ZQD055', 'ZQD056', 'ZQD057', 'ZQD058', 'ZQD059', 'ZQD060', 'ZQD061', 'ZQD062', 'ZQD063', 'ZQD064', 'ZQD065', 'ZQD066', 'ZQD067', 'ZQD068', 'ZQD069', 'ZQD070', 'ZQD071', 'ZQD072', 'ZQD073', 'ZQD074', 'ZQD075', 'ZQD076', 'ZQD077', 'ZQD078', 'ZQD079', 'ZQD080', 'ZQD081', 'ZQD082', 'ZQD083', 'ZQD084', 'ZQD085', 'ZQD086', 'ZQD087', 'ZQD088', 'ZQD089', 'ZQD090', 'ZQD091', 'ZQD092', 'ZQD093', 'ZQD094', 'ZQD095', 'ZQD096', 'ZQD097', 'ZQD098', 'ZQD099', 'ZQD100', 'ZQD101', 'ZQD102', 'ZQD103', 'ZQD104', 'ZQD105', 'ZQD106', 'ZQD107', 'ZQD108', 'ZQD109', 'ZQD110', 'ZQD111', 'ZQD112', 'ZQD113', 'ZQD114', 'ZQD115', 'ZQD116', 'ZQD117', 'ZQD118', 'ZQD119', 'ZQD120', 'ZQD121', 'ZQD122', 'ZQD123', 'ZQD124', 'ZQD125', 'ZQD126', 'ZQD127', 'ZQD128', 'ZQD129', 'ZQD130', 'ZQD131', 'ZQD132', 'ZQD133', 'ZQD134', 'ZQD135', 'ZQD136', 'ZQD137', 'ZQD138', 'ZQD139', 'ZQD140', 'ZQD141', 'ZQD142', 'ZQD143', 'ZQD144', 'ZQD145', 'ZQD146', 'ZQD147', 'ZQD148', 'ZQD149', 'ZQD150'],
  'MMPM8007': ['MATNR', 'DISPD', 'WERKS', 'ZPNTNM', 'LIFNR', 'ZCSHOP', 'ZCLLC', 'ZCCAR', 'ZQMITU', 'ZQWBS', 'ZQPRJ', 'ZQPBS', 'ZQWIP', 'ZWKFM', 'ZWKTO', 'ZQW01', 'ZQW02', 'ZQW03', 'ZQW04', 'ZQW05', 'ZQW06', 'ZQW07', 'ZQW08', 'ZQW09', 'ZQW10', 'ZQW11', 'ZQW12', 'ZQW13', 'ZQW14', 'ZQW15', 'ZQW16', 'ZQW17', 'ZQW18', 'ZQW19', 'ZQW20', 'ZQW21'],
  'MMPM8008': ['ZASNNO', 'ZASNTY', 'ZDIVNO', 'ZDEPDAT', 'ZDEPTIM', 'ZEARDAT', 'ZEARTIM', 'ZCARNO', 'ZDLRNAME', 'ZDLRMOBL', 'ZDLTLOC', 'ZCTAG_CO', 'ZASNNO', 'ZASNSEQ', 'WERKS', 'ZPNTNM', 'MATNR', 'ZDLMENGE', 'ZGRMENGE', 'LOEKZ', 'ZNDONUM', 'ZNDOSEQ'],
  'MMPM8009': ['ZASNNO', 'ZCFLAG', 'ZEMSG'],
  'MMPM8010': ['LIFNR', 'SPMON', 'MATNR', 'ZCOCR', 'ZADUNPV', 'ZQOCV', 'ZAOCV', 'ZADUNPL', 'ZQOCL', 'ZAOCL', 'WAERS', 'ZDFRTA', 'ZDTRTA'],
  'MMPM8011': ['E_DATAB', 'E_DATBI', 'MATNR', 'MAKTX', 'ZLABST_W', 'ZLABST', 'ZLABST_ALL', 'ZLABST_A', 'ZLABST_P', 'ZLABST_PHY', 'ZDIFF_QTY', 'ZPROD_QTY', 'ZDAMAGE_QTY', 'ZOTHER_QTY', 'ZREMARK', 'STATUS', 'STATUS_NM'],
  'MMPM8012': ['MATNR', 'ZLABST_W', 'ZLABST', 'ZLABST_ALL', 'ZLABST_A', 'ZLABST_P', 'ZLABST_PHY', 'ZDIFF_QTY', 'ZPROD_QTY', 'ZDAMAGE_QTY', 'ZOTHER_QTY', 'ZREMARK'],
  'MMPM8013': ['EBELN', 'EBELP', 'LIFNR', 'WERKS', 'MATNR', 'TXZ01', 'ERDAT', 'BSART', 'MENGE', 'MEINS', 'NETPR', 'WAERS', 'EINDT', 'ZCCYCGN', 'ZTCYTIM', 'ZCHDPOGB', 'ZCPGATE', 'ZCFDR', 'ELIKZ'],
  'MMPM8014': ['WERKS', 'LGORT', 'LGOBE', 'MATNR', 'MAKTX', 'QTY_PHYSICAL', 'QTY_WH', 'QTY_COUNT', 'QTY_BASEDT', 'QTY_ADJ', 'QTY_D1', 'QTY_D2', 'QTY_D3', 'QTY_D4', 'MEINS', 'LIFNR'],
};

// 코드 정의 (SAP 표준 + HKMC 커스텀)
const CODE_DEFINITIONS: Record<string, Record<string, { ko: string; en: string }>> = {
  // 이동유형 (Movement Type)
  'BWART': {
    '101': { ko: '입고', en: 'GR' },
    '102': { ko: '입고취소', en: 'GR Reversal' },
    '103': { ko: 'GR품질검사', en: 'GR for QI' },
    '104': { ko: 'GR품질검사취소', en: 'GR for QI Rev' },
    '122': { ko: '반품입고', en: 'Return GR' },
    '161': { ko: '반품출고', en: 'Return GI' },
    '201': { ko: '원가센터출고', en: 'GI Cost Center' },
    '261': { ko: '생산출고', en: 'GI Production' },
    '262': { ko: '생산출고취소', en: 'GI Prod Rev' },
    '301': { ko: '창고이전', en: 'Transfer' },
    '302': { ko: '창고이전취소', en: 'Transfer Rev' },
    '311': { ko: '저장위치이전', en: 'SLoc Transfer' },
    '312': { ko: '저장위치이전취소', en: 'SLoc Trans Rev' },
    '501': { ko: '사급출고', en: 'Subcon GI' },
    '502': { ko: '사급출고취소', en: 'Subcon GI Rev' },
    '541': { ko: '사급입고', en: 'Subcon GR' },
    '542': { ko: '사급입고취소', en: 'Subcon GR Rev' },
    '601': { ko: '출하', en: 'Delivery' },
    '602': { ko: '출하취소', en: 'Delivery Rev' },
  },
  // 단위 (Unit of Measure)
  'MEINS': {
    'EA': { ko: '개', en: 'EA' },
    'KG': { ko: 'Kg', en: 'KG' },
    'G': { ko: 'g', en: 'G' },
    'L': { ko: '리터', en: 'L' },
    'M': { ko: '미터', en: 'M' },
    'M2': { ko: '제곱미터', en: 'M2' },
    'M3': { ko: '세제곱미터', en: 'M3' },
    'PC': { ko: '조각', en: 'PC' },
    'SET': { ko: '세트', en: 'SET' },
    'BOX': { ko: '박스', en: 'BOX' },
    'ROL': { ko: '롤', en: 'ROL' },
    'PAA': { ko: '팩', en: 'PAA' },
  },
  // 내수/수출 구분
  'ZCDE': {
    'D': { ko: '내수', en: 'Domestic' },
    'E': { ko: '수출', en: 'Export' },
  },
  // 납품서 발행 구분
  'ZCDVIS': {
    'V': { ko: '정상', en: 'Normal' },
    'N': { ko: '미발행', en: 'Not Issued' },
    'C': { ko: '취소', en: 'Cancelled' },
  },
  // 상태
  'STATUS': {
    '10': { ko: '대기', en: 'Waiting' },
    '20': { ko: '진행', en: 'In Progress' },
    '30': { ko: '완료', en: 'Completed' },
    '40': { ko: '취소', en: 'Cancelled' },
    '50': { ko: '보류', en: 'On Hold' },
  },
  // ASN 유형
  'ZASNTY': {
    '1': { ko: '정규', en: 'Regular' },
    '2': { ko: '긴급', en: 'Urgent' },
    '3': { ko: '특별', en: 'Special' },
  },
  // 입고방식 구분
  'ZCGRTY': {
    'D': { ko: '직납', en: 'Direct' },
    'M': { ko: 'MITU', en: 'MITU' },
    'P': { ko: 'PBS', en: 'PBS' },
    'S': { ko: '서열', en: 'Sequence' },
  },
  // 납입지시 구분
  'ZCCYCGN': {
    'D': { ko: '일일', en: 'Daily' },
    'W': { ko: '주간', en: 'Weekly' },
    'M': { ko: '월간', en: 'Monthly' },
    'S': { ko: '서열', en: 'Sequence' },
  },
  // 입고검사
  'ZCQATY': {
    'N': { ko: '검사제외', en: 'No Inspection' },
    'Q': { ko: '검사대상', en: 'QI Required' },
    'F': { ko: '전수검사', en: 'Full Inspection' },
  },
  // 샵유형
  'ZCSHOP': {
    'B': { ko: '차체', en: 'Body' },
    'P': { ko: '도장', en: 'Paint' },
    'T': { ko: '의장', en: 'Trim' },
    'E': { ko: '엔진', en: 'Engine' },
    'A': { ko: '조립', en: 'Assembly' },
  },
  // 소스구분
  'ZCSOURCE': {
    'L': { ko: '국산', en: 'Local' },
    'I': { ko: '수입', en: 'Import' },
  },
  // 입고 상세구분
  'ZCINDLGN': {
    '10': { ko: '정상입고', en: 'Normal GR' },
    '20': { ko: '반품입고', en: 'Return GR' },
    '30': { ko: '무상입고', en: 'Free GR' },
  },
  // 입고 Source
  'ZCLV': {
    'V': { ko: '업체', en: 'Vendor' },
    'P': { ko: '공장', en: 'Plant' },
  },
  // 발생코드
  'ZCOCR': {
    'S': { ko: '소급', en: 'Retro' },
    'N': { ko: '정상', en: 'Normal' },
  },
  // 플래그
  'ZCFLAG': {
    'S': { ko: '성공', en: 'Success' },
    'E': { ko: '에러', en: 'Error' },
  },
  // 삭제 플래그
  'LOEKZ': {
    'X': { ko: '삭제', en: 'Deleted' },
    '': { ko: '', en: '' },
  },
  // 납품완료
  'ELIKZ': {
    'X': { ko: '완료', en: 'Completed' },
    '': { ko: '미완료', en: 'Not Completed' },
  },
};

// 필드 라벨 가져오기
// 코드 → 라벨 변환 함수
const convertCodeToLabel = (key: string, value: any, company: 'HMC' | 'KMC', lang: 'ko' | 'en', plants: typeof HMC_PLANTS): string => {
  if (value === null || value === undefined || value === '') return '';
  const strValue = String(value);
  
  // WERKS는 코드 그대로 표시 (ZPNTNM이 공장명)
  // 변환 불필요
  
  // CODE_DEFINITIONS에 정의된 필드는 코드 변환
  if (CODE_DEFINITIONS[key]) {
    const codeMap = CODE_DEFINITIONS[key];
    if (codeMap[strValue]) {
      return codeMap[strValue][lang];
    }
  }
  
  return strValue;
};

const getFieldLabel = (key: string, lang: 'ko' | 'en') => {
  return FIELD_LABELS[key]?.[lang] || key;
};

// 인터페이스별 정렬된 헤더 가져오기
const getOrderedHeaders = (interfaceId: string, dataKeys: string[], zpldays?: number): string[] => {
  const order = INTERFACE_FIELD_ORDER[interfaceId];
  if (!order) {
    return dataKeys; // 순서 정의 없으면 데이터 순서 그대로
  }
  // 정의된 순서대로 정렬, 없는 필드는 뒤에 추가
  let orderedKeys = order.filter(k => dataKeys.includes(k));
  
  // ZQD 필드 필터링: zpldays가 지정되면 해당 일수까지만 표시
  if (zpldays && zpldays > 0) {
    orderedKeys = orderedKeys.filter(k => {
      if (!k.startsWith('ZQD')) return true;
      const dayNum = parseInt(k.replace('ZQD', ''), 10);
      return dayNum <= zpldays;
    });
  }
  
  const extraKeys = dataKeys.filter(k => !order.includes(k));
  return [...orderedKeys, ...extraKeys];
};

// 공장 목록 (코드정의서 기준 To-Be)
const HMC_PLANTS = [
  { code: '', name: { ko: '전체', en: 'All' } },
  { code: '1000', name: { ko: 'HMC 본사', en: 'HMC HQ' } },
  { code: '1011', name: { ko: '울산 완성차 1공장', en: 'Ulsan Vehicle P1' } },
  { code: '1012', name: { ko: '울산 완성차 2공장', en: 'Ulsan Vehicle P2' } },
  { code: '1013', name: { ko: '울산 완성차 3공장', en: 'Ulsan Vehicle P3' } },
  { code: '1014', name: { ko: '울산 완성차 4공장', en: 'Ulsan Vehicle P4' } },
  { code: '1015', name: { ko: '울산 완성차 5공장', en: 'Ulsan Vehicle P5' } },
  { code: '101A', name: { ko: '울산 EV 공장', en: 'Ulsan EV Plant' } },
  { code: '1019', name: { ko: '울산 TSD 공장', en: 'Ulsan TSD Plant' } },
  { code: '1021', name: { ko: '아산 완성차 공장', en: 'Asan Vehicle' } },
  { code: '1031', name: { ko: '전주 완성차 공장', en: 'Jeonju Vehicle' } },
  { code: '1041', name: { ko: 'GGM 광주 완성차', en: 'GGM Gwangju' } },
  { code: '1070', name: { ko: '울산 엔진 공장', en: 'Ulsan Engine' } },
  { code: '1071', name: { ko: '아산 엔진 공장', en: 'Asan Engine' } },
  { code: '1072', name: { ko: '전주 엔진 공장', en: 'Jeonju Engine' } },
  { code: '1073', name: { ko: '울산 변속기 공장', en: 'Ulsan Trans' } },
  { code: '1074', name: { ko: '울산 소재 공장', en: 'Ulsan Material' } },
  { code: '1075', name: { ko: '아산 소재 공장', en: 'Asan Material' } },
  { code: '1076', name: { ko: '전주 소재 공장', en: 'Jeonju Material' } },
  { code: '1077', name: { ko: '울산 시트 1/2공장', en: 'Ulsan Seat P1/2' } },
  { code: '1078', name: { ko: '울산 시트 3공장', en: 'Ulsan Seat P3' } },
  { code: '1079', name: { ko: '충주 수소연료전지', en: 'Chungju Fuel Cell' } },
  { code: '1081', name: { ko: '울산 KD 포장공장', en: 'Ulsan KD Pack' } },
  { code: '1082', name: { ko: '아산 KD 포장공장', en: 'Asan KD Pack' } },
  { code: '1083', name: { ko: '전주 KD 포장공장', en: 'Jeonju KD Pack' } },
  { code: '1091', name: { ko: '울산 제품2 공장', en: 'Ulsan Product2' } },
  { code: '1092', name: { ko: '울산 공통 공장', en: 'Ulsan Common' } },
  { code: '1093', name: { ko: '아산 공통 공장', en: 'Asan Common' } },
  { code: '1094', name: { ko: '전주 공통 공장', en: 'Jeonju Common' } },
];

const KMC_PLANTS = [
  { code: '', name: { ko: '전체', en: 'All' } },
  { code: '2900', name: { ko: 'Kia 공통', en: 'Kia Common' } },
  { code: '2911', name: { ko: '광명 완성차 1공장', en: 'Gwangmyeong P1' } },
  { code: '2912', name: { ko: '광명 EVO Plant', en: 'Gwangmyeong EVO' } },
  { code: '2921', name: { ko: '화성 완성차 1공장', en: 'Hwaseong P1' } },
  { code: '2922', name: { ko: '화성 완성차 2공장', en: 'Hwaseong P2' } },
  { code: '2923', name: { ko: '화성 완성차 3공장', en: 'Hwaseong P3' } },
  { code: '2924', name: { ko: '화성 EVO East', en: 'Hwaseong EVO E' } },
  { code: '2925', name: { ko: '화성 EVO West', en: 'Hwaseong EVO W' } },
  { code: '2931', name: { ko: '광주 완성차 1공장', en: 'Gwangju P1' } },
  { code: '2932', name: { ko: '광주 완성차 2공장', en: 'Gwangju P2' } },
  { code: '2933', name: { ko: '광주 완성차 3공장', en: 'Gwangju P3' } },
  { code: '2934', name: { ko: '광주 완성차 버스', en: 'Gwangju Bus' } },
  { code: '2935', name: { ko: '광주 완성차 군수', en: 'Gwangju Military' } },
  { code: '2941', name: { ko: 'DH 서산 완성차', en: 'DH Seosan' } },
  { code: '2971', name: { ko: '광명 엔진 공장', en: 'Gwangmyeong Engine' } },
  { code: '2972', name: { ko: '화성 엔진 공장', en: 'Hwaseong Engine' } },
  { code: '2973', name: { ko: '화성 변속기 공장', en: 'Hwaseong Trans' } },
  { code: '2974', name: { ko: '화성 소재 공장', en: 'Hwaseong Material' } },
  { code: '2975', name: { ko: '광주 소재 공장', en: 'Gwangju Material' } },
  { code: '2981', name: { ko: '화성 KD 포장공장', en: 'Hwaseong KD Pack' } },
  { code: '2982', name: { ko: '광주 KD 포장공장', en: 'Gwangju KD Pack' } },
  { code: '2983', name: { ko: '광주 KD 상용', en: 'Gwangju KD Comm' } },
  { code: '2984', name: { ko: '광주 KD 버스', en: 'Gwangju KD Bus' } },
  { code: '2985', name: { ko: '화성 KD 특수', en: 'Hwaseong KD Spec' } },
  { code: '2991', name: { ko: '광명 공통 공장', en: 'Gwangmyeong Common' } },
  { code: '2992', name: { ko: '화성 공통 공장', en: 'Hwaseong Common' } },
  { code: '2993', name: { ko: '광주 공통 공장', en: 'Gwangju Common' } },
  { code: '2994', name: { ko: 'DH 서산 공통', en: 'DH Seosan Common' } },
  { code: '2995', name: { ko: '광명 제품2 공장', en: 'Gwangmyeong Product2' } },
];

// 날짜 파라미터 목록 (YYYYMMDD 형식)
const DATE_PARAMS = ['I_BUDAT', 'I_ZDSEND2_START', 'I_DISPD', 'I_DISPW', 'I_ERDAT', 'I_BASEDT'];

// YYYYMMDD <-> YYYY-MM-DD 변환
const toDateInput = (yyyymmdd: string) => {
  if (!yyyymmdd || yyyymmdd.length !== 8) return '';
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
};

const toYYYYMMDD = (dateStr: string) => dateStr.replace(/-/g, '');

type TabType = 'HMC' | 'KMC';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('HMC');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [data, setData] = useState<Record<string, unknown>[] | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [sessionTime, setSessionTime] = useState(3600); // 1시간
  const [liveMode, setLiveMode] = useState(false);
  const [tokens, setTokens] = useState<{ HMC: string | null; KMC: string | null }>({ HMC: null, KMC: null });
  const [tokenLoading, setTokenLoading] = useState(false);
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [offlineSwitchCount, setOfflineSwitchCount] = useState(0);
  const [modeLockUntil, setModeLockUntil] = useState<number | null>(null);

  const interfaces = activeTab === 'HMC' ? HMC_INTERFACES : KMC_INTERFACES;
  const currentInterface = interfaces[selectedIndex];

  // 세션 타이머 (LIVE 모드에서만 작동)
  useEffect(() => {
    if (!liveMode) return;
    const timer = setInterval(() => {
      setSessionTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [liveMode]);

  // 모드 잠금 해제 타이머
  useEffect(() => {
    if (!modeLockUntil) return;
    const checkLock = setInterval(() => {
      if (Date.now() >= modeLockUntil) {
        setModeLockUntil(null);
        setOfflineSwitchCount(0);
      }
    }, 1000);
    return () => clearInterval(checkLock);
  }, [modeLockUntil]);

  // 탭 변경 시 선택 초기화 (토큰은 유지)
  useEffect(() => {
    setSelectedIndex(0);
    setData(null);
    setParamValues({});
  }, [activeTab]);

  // 인터페이스 선택 시 파라미터 초기화
  useEffect(() => {
    const newParams: Record<string, string> = {};
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const thisMonth = new Date().toISOString().slice(0, 7).replace('-', '');

    currentInterface.params.forEach((p) => {
      if (p === 'I_LIFNR') newParams[p] = 'RR4U';
      else if (p === 'I_SPMON') newParams[p] = thisMonth;
      else if (DATE_PARAMS.includes(p)) newParams[p] = today;
      else if (p === 'I_WERKS') newParams[p] = '';
      else if (p === 'I_ZPLDAYS') newParams[p] = '150';
      else if (p === 'I_STATUS') newParams[p] = '';
      else newParams[p] = '';
    });
    setParamValues(newParams);
    setData(null);
  }, [selectedIndex, activeTab]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // OAuth 토큰 발급 (HMC/KMC 동시 발급)
  const getAllTokens = async () => {
    setTokenLoading(true);
    try {
      const [hmcRes, kmcRes] = await Promise.all([
        fetch('/api/oauth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company: 'HMC' })
        }),
        fetch('/api/oauth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company: 'KMC' })
        })
      ]);
      const hmcData = await hmcRes.json();
      const kmcData = await kmcRes.json();

      setTokens({
        HMC: hmcData.token || null,
        KMC: kmcData.token || null
      });
      setSessionTime(3600); // 1시간 리셋
      return { HMC: hmcData.token, KMC: kmcData.token };
    } catch (err) {
      setError(lang === 'ko' ? 'OAuth 토큰 발급 실패' : 'OAuth token failed');
      return { HMC: null, KMC: null };
    } finally {
      setTokenLoading(false);
    }
  };

  const handleQuery = async () => {
    setLoading(true);
    setError(null);

    try {
      if (liveMode) {
        // 라이브 모드: 실제 API 호출
        let currentToken = tokens[activeTab];
        if (!currentToken) {
          const newTokens = await getAllTokens();
          currentToken = newTokens[activeTab];
          if (!currentToken) {
            throw new Error(lang === 'ko' ? '토큰이 없습니다. 연결을 확인하세요.' : 'No token. Check connection.');
          }
        }

        const config = INTERFACE_CONFIG[currentInterface.id];
        const moduleCode = activeTab === 'HMC' ? 'MMH' : 'MMK';

        const payload = {
          COMPANY: activeTab === 'HMC' ? 'HMC' : 'KIA',
          SENDER: paramValues['I_LIFNR'] || 'RR4U',
          RECORD_COUNT: '1',
          IFID: currentInterface.id,
          SERVICE_CODE: `${paramValues['I_LIFNR'] || 'RR4U'}-${moduleCode}-B-${config.serial}`,
          DOCUMENTTYPE: config.docType,
          TARGET_SYSTEM: 'ERPMM',
          INDATA_JSON: JSON.stringify(paramValues)
        };

        const response = await fetch('/api/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company: activeTab, token: currentToken, payload })
        });

        const json = await response.json();

        if (json.E_IFRESULT === 'E') {
          // 30일 초과 에러는 무시 (150일까지 지원)
          const errMsg = json.E_IFMSG || '';
          if (!errMsg.includes('30일') && !errMsg.includes('30 day') && !errMsg.includes('exceed')) {
            throw new Error(errMsg || (lang === 'ko' ? '조회 실패' : 'Query failed'));
          }
        }

        if (json.OUTDATA_JSON) {
          const outData = typeof json.OUTDATA_JSON === 'string'
            ? JSON.parse(json.OUTDATA_JSON)
            : json.OUTDATA_JSON;
          const list = outData.OUT_LIST || outData.ET_LIST || outData.ET_EXPORT_1 || [];
          setData(Array.isArray(list) ? list : [list]);
        } else {
          setData([]);
        }
      } else {
        // 오프라인 모드: 저장된 응답 파일에서 로드
        const filename = `${activeTab}_${currentInterface.id}_${currentInterface.name.ko}_RR4U_20251101_response.json`;
        const response = await fetch(`/api/responses/${encodeURIComponent(filename)}`);

        if (!response.ok) {
          throw new Error(lang === 'ko' ? '데이터를 불러올 수 없습니다' : 'Cannot load data');
        }

        const json = await response.json();

        if (json.OUTDATA_JSON) {
          const outData = typeof json.OUTDATA_JSON === 'string'
            ? JSON.parse(json.OUTDATA_JSON)
            : json.OUTDATA_JSON;
          const list = outData.OUT_LIST || outData.ET_LIST || [];
          setData(Array.isArray(list) ? list : [list]);
        } else {
          setData([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : (lang === 'ko' ? '오류가 발생했습니다' : 'Error occurred'));
      setData(null);
    } finally {
      setLoading(false);
    }
  };


  // 정렬된 데이터
  const sortedData = useMemo(() => {
    if (!data || !sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = String(a[sortKey] ?? '');
      const bVal = String(b[sortKey] ?? '');
      const cmp = aVal.localeCompare(bVal, 'ko', { numeric: true });
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortOrder]);

  // 헤더 클릭 정렬
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleExport = () => {
    if (!data || data.length === 0) return;
    
    const headers = getOrderedHeaders(currentInterface.id, Object.keys(data[0]), paramValues['I_ZPLDAYS'] ? parseInt(paramValues['I_ZPLDAYS'], 10) : undefined);
    const headerLabels = headers.map(h => getFieldLabel(h, lang));
    const plants = activeTab === 'HMC' ? HMC_PLANTS : KMC_PLANTS;
    const csvContent = [
      headerLabels.join(','),
      ...data.map(row => headers.map(h => `"${convertCodeToLabel(h, row[h], activeTab, lang, plants)}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_${currentInterface.name[lang]}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          {/* 로고 */}
          <div className="flex items-center gap-3">
            <img src="https://grupopremo.com/cdn/shop/files/logo_christmas_2_770x255.gif?v=1765881926" alt="PREMO" className="h-8" />
            <span className="font-semibold text-lg text-gray-800">PREMO KOR.</span>
            <span className="text-gray-400">|</span>
            <span className="text-sm font-bold text-gray-600">HKMC MM Module API Caller</span>
            <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">TEST</span>
          </div>

        </div>

        <div className="flex items-center gap-4">
          {/* 라이브 모드 토글 */}
          <div className="flex items-center gap-2">
            <span className={`text-sm ${liveMode ? 'text-green-600' : 'text-gray-500'}`}>
              {liveMode ? 'LIVE' : 'OFFLINE'}
            </span>
            <button
              onClick={() => {
                const newMode = !liveMode;

                // 오프라인→온라인 전환 시 잠금 확인
                if (newMode && modeLockUntil && Date.now() < modeLockUntil) {
                  const remainSec = Math.ceil((modeLockUntil - Date.now()) / 1000);
                  setError(lang === 'ko' ? `${remainSec}초 후 LIVE 모드 전환 가능` : `LIVE mode available in ${remainSec}s`);
                  return;
                }

                // 온라인→오프라인 전환 시 횟수 카운트
                if (!newMode && liveMode) {
                  const newCount = offlineSwitchCount + 1;
                  setOfflineSwitchCount(newCount);
                  if (newCount >= 2) {
                    setModeLockUntil(Date.now() + 60000); // 1분 잠금
                  }
                }

                // 오프라인→온라인 전환 시 카운트 리셋
                if (newMode && !liveMode) {
                  setOfflineSwitchCount(0);
                }

                setLiveMode(newMode);
                if (newMode && !tokens.HMC && !tokens.KMC) getAllTokens();
              }}
              disabled={!liveMode && modeLockUntil !== null && Date.now() < modeLockUntil}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                liveMode ? 'bg-green-500' : modeLockUntil ? 'bg-red-300' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                  liveMode ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* 토큰 상태 */}
          {liveMode && (
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
              tokens[activeTab] ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${tokens[activeTab] ? 'bg-green-500' : 'bg-yellow-500'}`} />
              {tokenLoading ? '발급중...' : tokens[activeTab] ? 'Token OK' : 'No Token'}
            </div>
          )}

          {/* 세션 타이머 */}
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-mono">{formatTime(sessionTime)}</span>
          </div>

          {/* 한영전환 */}
          <button
            onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium text-gray-600 transition-colors"
          >
            {lang === 'ko' ? 'EN' : '한'}
          </button>

          {/* 새로고침 */}
          <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* 로그아웃 */}
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바 - 인터페이스 목록 */}
        <aside className="w-40 bg-white border-r border-gray-200 flex flex-col">
          {/* HMC/KMC 탭 */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => { setActiveTab('HMC'); setSelectedIndex(0); }}
              className={`flex-1 py-2 text-xs font-bold transition-all ${
                activeTab === 'HMC'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              현대
            </button>
            <button
              onClick={() => { setActiveTab('KMC'); setSelectedIndex(0); }}
              className={`flex-1 py-2 text-xs font-bold transition-all ${
                activeTab === 'KMC'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              기아
            </button>
          </div>
          <div className="px-2 py-1 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">{activeTab}</span>
            <span className="text-xs text-gray-400">{interfaces.length}</span>
          </div>

          <nav className="flex-1 overflow-y-auto p-0.5">
            {interfaces.map((iface, index) => (
              <button
                key={`${activeTab}-${iface.id}`}
                onClick={() => setSelectedIndex(index)}
                className={`w-full text-left px-1.5 py-0.5 rounded transition-all ${
                  selectedIndex === index
                    ? 'bg-red-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-xs">
                  {(index + 1).toString().padStart(2, '0')} {iface.name[lang]}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {/* 상단 바 - 제목 + 액션 버튼 */}
          <div className="px-4 py-2 border-b border-gray-200 bg-white flex items-center justify-between">
            <div>
              <h1 className="text-sm font-semibold text-gray-800">{currentInterface.name[lang]}</h1>
              <p className="text-[10px] text-gray-500">
                {data ? `Total: ${data.length}` : (lang === 'ko' ? '조회하세요' : 'Query')}
              </p>
            </div>

            <div className="flex gap-1">
              <button
                onClick={handlePrint}
                disabled={!data || data.length === 0}
                className="flex items-center gap-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs text-gray-700"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                {lang === 'ko' ? '인쇄' : 'Print'}
              </button>
              <button
                onClick={handleExport}
                disabled={!data || data.length === 0}
                className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs text-white"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {lang === 'ko' ? '엑셀' : 'Excel'}
              </button>
            </div>
          </div>

          {/* INPUT DATA 입력 영역 */}
          <div className="px-4 py-2 bg-white border-b border-gray-200">
            <div className="flex items-end gap-2 flex-wrap">
              {currentInterface.params.map((param) => {
                const plants = activeTab === 'HMC' ? HMC_PLANTS : KMC_PLANTS;

                // 공장 코드: 콤보박스
                if (param === 'I_WERKS') {
                  return (
                    <div key={param} className="flex flex-col gap-0.5">
                      <label className="text-[10px] text-gray-500">{getParamLabel(param, lang)}</label>
                      <select
                        value={paramValues[param] || ''}
                        onChange={(e) => setParamValues({ ...paramValues, [param]: e.target.value })}
                        className="px-1.5 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:border-red-500 w-36"
                      >
                        {plants.map((plant) => (
                          <option key={plant.code} value={plant.code}>
                            {plant.code ? `${plant.code} ${plant.name[lang]}` : plant.name[lang]}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                // 날짜 파라미터: 텍스트 + 달력
                if (DATE_PARAMS.includes(param)) {
                  return (
                    <div key={param} className="flex flex-col gap-0.5">
                      <label className="text-[10px] text-gray-500">{getParamLabel(param, lang)}</label>
                      <div className="flex gap-0.5">
                        <input
                          type="text"
                          value={paramValues[param] || ''}
                          onChange={(e) => setParamValues({ ...paramValues, [param]: e.target.value })}
                          placeholder="YYYYMMDD"
                          maxLength={8}
                          className="px-1.5 py-1 bg-gray-100 border border-gray-300 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 w-20"
                        />
                        <input
                          type="date"
                          value={toDateInput(paramValues[param] || '')}
                          onChange={(e) => setParamValues({ ...paramValues, [param]: toYYYYMMDD(e.target.value) })}
                          className="px-1 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:border-red-500 w-8 cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                }

                // 기준월: 텍스트 + 달력
                if (param === 'I_SPMON') {
                  return (
                    <div key={param} className="flex flex-col gap-0.5">
                      <label className="text-[10px] text-gray-500">{getParamLabel(param, lang)}</label>
                      <div className="flex gap-0.5">
                        <input
                          type="text"
                          value={paramValues[param] || ''}
                          onChange={(e) => setParamValues({ ...paramValues, [param]: e.target.value })}
                          placeholder="YYYYMM"
                          maxLength={6}
                          className="px-1.5 py-1 bg-gray-100 border border-gray-300 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 w-16"
                        />
                        <input
                          type="month"
                          value={paramValues[param] ? `${paramValues[param].slice(0, 4)}-${paramValues[param].slice(4, 6)}` : ''}
                          onChange={(e) => setParamValues({ ...paramValues, [param]: e.target.value.replace('-', '') })}
                          className="px-1 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:border-red-500 w-8 cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                }

                // 기본 텍스트 입력
                return (
                  <div key={param} className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-gray-500">{getParamLabel(param, lang)}</label>
                    <input
                      type="text"
                      value={paramValues[param] || ''}
                      onChange={(e) => setParamValues({ ...paramValues, [param]: e.target.value })}
                      placeholder={param === 'I_ZPLDAYS' ? '일수' : ''}
                      className="px-1.5 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 w-20"
                    />
                  </div>
                );
              })}

              <button
                onClick={handleQuery}
                disabled={loading}
                className="flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded text-xs text-white transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {loading ? (lang === 'ko' ? '조회중' : 'Load') : (lang === 'ko' ? '조회' : 'Query')}
              </button>
            </div>
          </div>

          {/* 데이터 테이블 */}
          <div className="flex-1 overflow-auto p-6">
            {error && (
              <div className="bg-red-100 border border-red-300 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
              </div>
            )}

            {!loading && !data && !error && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>{lang === 'ko' ? '파라미터를 입력하고 조회 버튼을 클릭하세요' : 'Enter parameters and click Query'}</p>
              </div>
            )}

            {!loading && data && data.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>{lang === 'ko' ? '조회 결과가 없습니다' : 'No results found'}</p>
              </div>
            )}

            {!loading && data && data.length > 0 && (
              <div className="bg-white rounded overflow-hidden border border-gray-200 shadow-sm">
                {/* 스크롤 네비게이션 바 */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs text-gray-500">컬럼:</span>
                  <span className="text-xs font-medium text-gray-700">{data.length > 0 ? Object.keys(data[0]).length : 0}개</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-xs text-gray-500">← → 키로 스크롤</span>
                  <div className="flex-1" />
                  <button 
                    onClick={() => { const el = document.getElementById('data-table'); if(el) el.scrollLeft = 0; }}
                    className="px-2 py-0.5 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                  >◀ 처음</button>
                  <button 
                    onClick={() => { const el = document.getElementById('data-table'); if(el) el.scrollLeft = el.scrollWidth; }}
                    className="px-2 py-0.5 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                  >끝 ▶</button>
                </div>
                <div id="data-table" className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)]" style={{scrollbarWidth: 'auto', scrollbarColor: '#94a3b8 #e2e8f0'}}>
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gray-100">
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600 border-b border-gray-200 bg-gray-100 sticky left-0 z-20">#</th>
                        {getOrderedHeaders(currentInterface.id, Object.keys(data[0]), paramValues['I_ZPLDAYS'] ? parseInt(paramValues['I_ZPLDAYS'], 10) : undefined).map((key) => (
                          <th 
                              key={key} 
                              className="px-2 py-1.5 text-left font-medium text-gray-600 border-b border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort(key)}
                            >
                              {getFieldLabel(key, lang)}
                              {sortKey === key && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                            </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(sortedData || []).map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-2 py-1 border-b border-gray-100 text-gray-500 bg-white sticky left-0 z-10">{idx + 1}</td>
                          {getOrderedHeaders(currentInterface.id, Object.keys(row), paramValues['I_ZPLDAYS'] ? parseInt(paramValues['I_ZPLDAYS'], 10) : undefined).map((key, i) => (
                            <td key={i} className="px-2 py-1 border-b border-gray-100 text-gray-800 whitespace-nowrap">
                              {convertCodeToLabel(key, row[key], activeTab, lang, activeTab === 'HMC' ? HMC_PLANTS : KMC_PLANTS)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 상태바 */}
          <div className="px-6 py-2 bg-white border-t border-gray-200 text-sm text-gray-500 flex justify-between items-center">
            <span>
              {data ? (
                <>Ready | Rows: {data.length} | Columns: {data.length > 0 ? Object.keys(data[0]).length : 0}</>
              ) : (
                <>Ready</>
              )}
            </span>
            <span className="text-xs text-gray-400">Developed by Minho Kim</span>
          </div>
        </main>
      </div>
    </div>
  );
}
