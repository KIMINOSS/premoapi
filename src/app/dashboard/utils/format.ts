// 유틸리티 함수들
import type { LangType, TabType } from '../types';
import { PARAM_LABELS, FIELD_LABELS } from '../config/labels';
import { CODE_DEFINITIONS } from '../config/codes';
import { INTERFACE_FIELD_ORDER } from '../config/fieldOrder';

// 날짜 파라미터 목록 (YYYYMMDD 형식)
export const DATE_PARAMS = ['I_BUDAT', 'I_ZDSEND2_START', 'I_DISPD', 'I_DISPW', 'I_ERDAT', 'I_BASEDT'];

// YYYYMMDD -> YYYY-MM-DD 변환 (input용)
export const toDateInput = (yyyymmdd: string): string => {
  if (!yyyymmdd || yyyymmdd.length !== 8) return '';
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
};

// YYYY-MM-DD -> YYYYMMDD 변환
export const toYYYYMMDD = (dateStr: string): string => dateStr.replace(/-/g, '');

// 파라미터 라벨 가져오기
export const getParamLabel = (key: string, lang: LangType): string => {
  return PARAM_LABELS[key]?.[lang] || key;
};

// 필드 라벨 가져오기
export const getFieldLabel = (key: string, lang: LangType): string => {
  return FIELD_LABELS[key]?.[lang] || key;
};

// 코드 -> 라벨 변환 함수
export const convertCodeToLabel = (
  key: string,
  value: unknown,
  _company: TabType,
  lang: LangType
): string => {
  if (value === null || value === undefined || value === '') return '';
  const strValue = String(value);

  // CODE_DEFINITIONS에 정의된 필드는 코드 변환
  if (CODE_DEFINITIONS[key]) {
    const codeMap = CODE_DEFINITIONS[key];
    if (codeMap[strValue]) {
      return codeMap[strValue][lang];
    }
  }

  return strValue;
};

// 인터페이스별 정렬된 헤더 가져오기
export const getOrderedHeaders = (
  interfaceId: string,
  dataKeys: string[],
  zpldays?: number
): string[] => {
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

// 시간 포맷 (HH:MM:SS)
export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// 숫자 포맷 (천단위 콤마)
export const formatNumber = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return num.toLocaleString();
};

// 날짜 포맷 (YYYYMMDD -> YYYY-MM-DD)
export const formatDate = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  const str = String(value);
  if (str.length === 8 && /^\d{8}$/.test(str)) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  return str;
};

// 시간 포맷 (HHMMSS -> HH:MM:SS)
export const formatTimeValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  const str = String(value);
  if (str.length === 6 && /^\d{6}$/.test(str)) {
    return `${str.slice(0, 2)}:${str.slice(2, 4)}:${str.slice(4, 6)}`;
  }
  return str;
};
