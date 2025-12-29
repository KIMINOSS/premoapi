// 인터페이스 설정
import type { InterfaceDefinition, InterfaceConfig, InputInterfaceConfig } from '../types';

// 입력 인터페이스 정의 (생성/조정 기능)
export const INPUT_INTERFACES: Record<string, InputInterfaceConfig> = {
  'MMPM8009': {
    type: 'create',
    headerFields: ['ZASNNO', 'ZDEPDAT', 'ZDEPTIM', 'ZEARDAT', 'ZEARTIM', 'ZCARNO', 'ZDLRNAME', 'ZDLRMOBL', 'ZDIVNO', 'ZDLTLOC', 'ZCPGATE', 'ZCTAG_CO'],
    detailFields: ['ZASNSEQ', 'WERKS', 'MATNR', 'ZDLMENGE', 'ZDLBOX', 'ZNDONUM', 'ZNDOSEQ'],
    description: { ko: 'ASN 출하 정보 생성', en: 'Create ASN Shipment' }
  },
  'MMPM8012': {
    type: 'adjust',
    fields: ['MATNR', 'ZLABST_W', 'ZLABST', 'ZLABST_ALL', 'ZLABST_A', 'ZLABST_P', 'ZLABST_PHY', 'ZDIFF_QTY', 'ZPROD_QTY', 'ZDAMAGE_QTY', 'ZOTHER_QTY', 'ZREMARK'],
    description: { ko: '유상사급 재고 실사/조정', en: 'Subcon Stock Adjustment' }
  },
  'MMPM8015': {
    type: 'adjust',
    fields: ['WERKS', 'LGORT', 'MATNR', 'LGOBE', 'MAKTX', 'QTY_PHYSICAL', 'QTY_WH', 'QTY_COUNT', 'QTY_BASEDT', 'QTY_ADJ', 'QTY_D1', 'QTY_D2', 'QTY_D3', 'QTY_D4', 'MEINS', 'LIFNR'],
    description: { ko: '위탁재고 실사/조정', en: 'VMI Stock Adjustment' }
  }
};

// 인터페이스 설정 (API 호출용 메타데이터)
export const INTERFACE_CONFIG: Record<string, InterfaceConfig> = {
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

export const HMC_INTERFACES: InterfaceDefinition[] = [
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

export const KMC_INTERFACES: InterfaceDefinition[] = [
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
