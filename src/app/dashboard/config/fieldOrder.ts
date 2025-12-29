// 인터페이스별 필드 순서 및 필수 파라미터 정의
import type { LangType } from '../types';
import { PARAM_LABELS } from './labels';

// 인터페이스별 필드 순서 (호출정보 Excel 기준)
export const INTERFACE_FIELD_ORDER: Record<string, string[]> = {
  'MMPM8001': ['LIFNR', 'BUKRS', 'WERKS', 'MATNR', 'MDV01', 'DATAB', 'DATBI', 'MAKTX', 'MEINS', 'ZCPGATE', 'ZCCAR', 'ZCCASNO', 'ZQPERCS', 'LGPBE', 'DISPO', 'ZQCONST', 'ZCQATY', 'ZCCYCGN', 'ZCGRTY', 'ZCDVIS', 'ZCLOGRPL', 'ZCLSTY', 'ZCSNACGN', 'EBELN', 'EBELP', 'ZCALC_CD'],
  'MMPM8002': ['ZDSEND2', 'LIFNR', 'WERKS', 'MATNR', 'ZDARR', 'LFSNR', 'REFLFSPOS', 'ZCLV', 'ZCINDLGN', 'ZQARR1', 'WEMNG', 'ZAWZUBB', 'GRUND', 'ZAPIMAMT', 'ZDSTRIN', 'EBELN', 'EBELP', 'ZNLLCVR', 'ZQLLCOP', 'ZQLLCIS', 'ZNLLCNR', 'ZAOCKEA', 'ZQPKQTY', 'ZCINSHOP', 'MBLNR', 'MBLPO', 'MJAHR'],
  'MMPM8003': ['MBLNR', 'MJAHR', 'ZEILE', 'BUDAT', 'ZASNNO', 'ZASNTY', 'ZDIVNO', 'ZASNSEQ', 'MATNR', 'WERKS', 'LGORT', 'BWART', 'MENGE', 'MEINS', 'EBELN', 'EBELP'],
  'MMPM8004': ['LIFNR', 'WERKS', 'MATNR', 'ZCDE', 'ZCINDLGN', 'WEMNG', 'ZAWZUBB'],
  'MMPM8005': ['ZCDOC', 'LIFNR', 'WERKS', 'VBELN', 'MATNR', 'MAKTX', 'WAMNG', 'ZQRINERWT', 'ZANETPR', 'ZABSGAM', 'ZCSOURCE'],
  'MMPM8006': generateMMPM8006FieldOrder(),
  'MMPM8007': ['MATNR', 'DISPD', 'WERKS', 'ZPNTNM', 'LIFNR', 'ZCSHOP', 'ZCLLC', 'ZCCAR', 'ZQMITU', 'ZQWBS', 'ZQPRJ', 'ZQPBS', 'ZQWIP', 'ZWKFM', 'ZWKTO', 'ZQW01', 'ZQW02', 'ZQW03', 'ZQW04', 'ZQW05', 'ZQW06', 'ZQW07', 'ZQW08', 'ZQW09', 'ZQW10', 'ZQW11', 'ZQW12', 'ZQW13', 'ZQW14', 'ZQW15', 'ZQW16', 'ZQW17', 'ZQW18', 'ZQW19', 'ZQW20', 'ZQW21'],
  'MMPM8008': ['ZASNNO', 'ZASNTY', 'ZDIVNO', 'ZDEPDAT', 'ZDEPTIM', 'ZEARDAT', 'ZEARTIM', 'ZCARNO', 'ZDLRNAME', 'ZDLRMOBL', 'ZDLTLOC', 'ZCTAG_CO', 'ZASNNO', 'ZASNSEQ', 'WERKS', 'ZPNTNM', 'MATNR', 'ZDLMENGE', 'ZGRMENGE', 'LOEKZ', 'ZNDONUM', 'ZNDOSEQ'],
  'MMPM8009': ['ZASNNO', 'ZCFLAG', 'ZEMSG'],
  'MMPM8010': ['LIFNR', 'SPMON', 'MATNR', 'ZCOCR', 'ZADUNPV', 'ZQOCV', 'ZAOCV', 'ZADUNPL', 'ZQOCL', 'ZAOCL', 'WAERS', 'ZDFRTA', 'ZDTRTA'],
  'MMPM8011': ['E_DATAB', 'E_DATBI', 'MATNR', 'MAKTX', 'ZLABST_W', 'ZLABST', 'ZLABST_ALL', 'ZLABST_A', 'ZLABST_P', 'ZLABST_PHY', 'ZDIFF_QTY', 'ZPROD_QTY', 'ZDAMAGE_QTY', 'ZOTHER_QTY', 'ZREMARK', 'STATUS', 'STATUS_NM'],
  'MMPM8012': ['MATNR', 'ZLABST_W', 'ZLABST', 'ZLABST_ALL', 'ZLABST_A', 'ZLABST_P', 'ZLABST_PHY', 'ZDIFF_QTY', 'ZPROD_QTY', 'ZDAMAGE_QTY', 'ZOTHER_QTY', 'ZREMARK'],
  'MMPM8013': ['EBELN', 'EBELP', 'LIFNR', 'WERKS', 'MATNR', 'TXZ01', 'ERDAT', 'BSART', 'MENGE', 'MEINS', 'NETPR', 'WAERS', 'EINDT', 'ZCCYCGN', 'ZTCYTIM', 'ZCHDPOGB', 'ZCPGATE', 'ZCFDR', 'ELIKZ'],
  'MMPM8014': ['WERKS', 'LGORT', 'LGOBE', 'MATNR', 'MAKTX', 'QTY_PHYSICAL', 'QTY_WH', 'QTY_COUNT', 'QTY_BASEDT', 'QTY_ADJ', 'QTY_D1', 'QTY_D2', 'QTY_D3', 'QTY_D4', 'MEINS', 'LIFNR'],
};

// MMPM8006 필드 순서 생성 (일별 소요량 ZQD001~ZQD150 포함)
function generateMMPM8006FieldOrder(): string[] {
  const baseFields = ['MATNR', 'DISPD', 'WERKS', 'ZPNTNM', 'LIFNR', 'ZCSHOP', 'ZCLLC', 'ZCCAR', 'ZQMITU', 'ZQWBS', 'ZQPRJ', 'ZQPBS', 'ZQWIP', 'ZDATFM', 'ZDATTO'];
  const dailyFields: string[] = [];
  for (let i = 1; i <= 150; i++) {
    dailyFields.push(`ZQD${i.toString().padStart(3, '0')}`);
  }
  return [...baseFields, ...dailyFields];
}

// 인터페이스별 필수 파라미터 정의
// true = 필수, false = 선택
export const REQUIRED_PARAMS: Record<string, Record<string, boolean>> = {
  // HMC & KMC 공통
  'MMPM8001': { 'I_LIFNR': true, 'I_WERKS': false },  // 품목 정보: 업체코드 필수
  'MMPM8002': { 'I_LIFNR': true, 'I_ZDSEND2_START': true },  // 검수 합격: 업체코드, 전표일자 필수
  'MMPM8003': { 'I_LIFNR': true, 'I_BUDAT': true, 'I_WERKS': false },  // 입고 실적: 업체코드, 기준일자 필수
  'MMPM8004': { 'I_LIFNR': true, 'I_SPMON': true },  // 월 검수: 업체코드, 기준월 필수
  'MMPM8005': { 'I_LIFNR': true, 'I_SPMON': true },  // 사급 매출: 업체코드, 기준월 필수
  'MMPM8006': { 'I_LIFNR': true, 'I_DISPD': true, 'I_ZPLDAYS': true, 'I_WERKS': false },  // 일별 소요량
  'MMPM8007': { 'I_LIFNR': true, 'I_DISPW': true, 'I_WERKS': false },  // 주별 소요량
  'MMPM8008': { 'I_LIFNR': true, 'I_ERDAT': true },  // 부품 출하 조회
  'MMPM8009': { 'I_LIFNR': true, 'I_ZASNNO': true },  // 부품 출하 생성: ASN번호 필수
  'MMPM8010': { 'I_LIFNR': true, 'I_SPMON': true },  // 부품 소급 정산
  'MMPM8011': { 'I_LIFNR': true, 'I_BUDAT': true, 'I_WERKS': false, 'I_STATUS': false },  // 유상사급 재고 조회
  'MMPM8012': { 'I_LIFNR': true, 'I_BUDAT': true, 'I_WERKS': true },  // 유상사급 재고 조정: 공장 필수
  'MMPM8013': { 'I_LIFNR': true, 'I_WERKS': true },  // 전주공장 간판발주: 공장 필수
  'MMPM8014': { 'I_LIFNR': true, 'I_BASEDT': true, 'I_WERKS': false, 'I_MATNR': false },  // 업체자율 재고 조회
  'MMPM8015': { 'I_LIFNR': true, 'I_BASEDT': true, 'I_WERKS': true },  // 업체자율 재고 조정: 공장 필수
};

// 필수 파라미터 검증 함수
export const validateRequiredParams = (
  interfaceId: string,
  params: Record<string, string>,
  lang: LangType
): { valid: boolean; missingFields: string[] } => {
  const requiredConfig = REQUIRED_PARAMS[interfaceId];
  if (!requiredConfig) {
    return { valid: true, missingFields: [] };
  }

  const missingFields: string[] = [];

  Object.entries(requiredConfig).forEach(([param, isRequired]) => {
    if (isRequired) {
      const value = params[param];
      if (!value || value.trim() === '') {
        const label = PARAM_LABELS[param]?.[lang] || param;
        missingFields.push(label);
      }
    }
  });

  return {
    valid: missingFields.length === 0,
    missingFields
  };
};

// 파라미터가 필수인지 확인
export const isParamRequired = (interfaceId: string, param: string): boolean => {
  return REQUIRED_PARAMS[interfaceId]?.[param] === true;
};
