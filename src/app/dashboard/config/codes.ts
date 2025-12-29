// 코드 정의 (SAP 표준 + HKMC 커스텀)
import type { LocalizedLabel } from '../types';

export const CODE_DEFINITIONS: Record<string, Record<string, LocalizedLabel>> = {
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
  // 회사코드 (Company Code)
  'BUKRS': {
    '1000': { ko: '현대자동차', en: 'HMC' },
    '2000': { ko: '기아', en: 'KMC' },
    '3000': { ko: '현대모비스', en: 'Mobis' },
    '4000': { ko: '현대위아', en: 'Wia' },
    '5000': { ko: '현대트랜시스', en: 'Transys' },
  },
  // 차변/대변 (Debit/Credit)
  'SHKZG': {
    'S': { ko: '차변', en: 'Debit' },
    'H': { ko: '대변', en: 'Credit' },
  },
  // 발주유형 (PO Type)
  'BSART': {
    'NB': { ko: '일반구매', en: 'Standard PO' },
    'UB': { ko: '재고이전', en: 'Stock Transfer' },
    'ZNBV': { ko: '벤더구매', en: 'Vendor PO' },
    'ZNBS': { ko: '서열구매', en: 'Sequence PO' },
    'ZNBD': { ko: '직송구매', en: 'Direct PO' },
    'ZNBM': { ko: 'MITU구매', en: 'MITU PO' },
    'ZNBP': { ko: 'PBS구매', en: 'PBS PO' },
  },
  // 중량단위 (Weight Unit)
  'GEWEI': {
    'G': { ko: 'g', en: 'g' },
    'KG': { ko: 'Kg', en: 'KG' },
    'TO': { ko: '톤', en: 'TON' },
    'MG': { ko: 'mg', en: 'mg' },
  },
  // 차종코드 (Car Model)
  'ZCCAR': {
    'GL': { ko: '그랜저', en: 'Grandeur' },
    'TM': { ko: '투싼', en: 'Tucson' },
    'NE': { ko: '쏘나타', en: 'Sonata' },
    'DN': { ko: '아반떼', en: 'Avante' },
    'SU': { ko: '싼타페', en: 'Santa Fe' },
    'OS': { ko: '팰리세이드', en: 'Palisade' },
    'NX': { ko: '넥쏘', en: 'Nexo' },
    'AE': { ko: '아이오닉', en: 'Ioniq' },
    'JW': { ko: '코나', en: 'Kona' },
    'BD': { ko: '스타리아', en: 'Staria' },
    'MQ': { ko: 'K5', en: 'K5' },
    'JF': { ko: 'K3', en: 'K3' },
    'CK': { ko: 'K8', en: 'K8' },
    'GL3': { ko: 'K9', en: 'K9' },
    'YP': { ko: '쏘렌토', en: 'Sorento' },
    'SP': { ko: '스포티지', en: 'Sportage' },
    'MV': { ko: '카니발', en: 'Carnival' },
    'EV6': { ko: 'EV6', en: 'EV6' },
    'EV9': { ko: 'EV9', en: 'EV9' },
  },
  // 사유코드 (Reason Code)
  'GRUND': {
    '0001': { ko: '정상', en: 'Normal' },
    '0002': { ko: '품질불량', en: 'Quality Issue' },
    '0003': { ko: '수량과부족', en: 'Qty Discrepancy' },
    '0004': { ko: '파손', en: 'Damaged' },
    '0005': { ko: '오배송', en: 'Misdelivery' },
    '0006': { ko: '지연', en: 'Delayed' },
    '0010': { ko: '반품', en: 'Return' },
    '0020': { ko: '폐기', en: 'Scrap' },
    '0030': { ko: '재작업', en: 'Rework' },
    '0099': { ko: '기타', en: 'Others' },
  },
};
