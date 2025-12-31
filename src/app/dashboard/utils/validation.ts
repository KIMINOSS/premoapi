// 입력값 검증 유틸리티
import type { LangType } from '../types';

// 검증 결과 타입
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

// 날짜 형식 검증 (YYYYMMDD)
export const validateDate = (value: string, lang: LangType): ValidationResult => {
  if (!value) return { valid: true }; // 빈 값은 필수 검증에서 처리

  const dateRegex = /^\d{8}$/;
  if (!dateRegex.test(value)) {
    return {
      valid: false,
      message: lang === 'ko' ? '날짜 형식이 올바르지 않습니다 (YYYYMMDD)' : 'Invalid date format (YYYYMMDD)',
    };
  }

  const year = parseInt(value.slice(0, 4), 10);
  const month = parseInt(value.slice(4, 6), 10);
  const day = parseInt(value.slice(6, 8), 10);

  if (year < 2000 || year > 2100) {
    return {
      valid: false,
      message: lang === 'ko' ? '연도 범위 오류 (2000-2100)' : 'Year out of range (2000-2100)',
    };
  }

  if (month < 1 || month > 12) {
    return {
      valid: false,
      message: lang === 'ko' ? '월 범위 오류 (01-12)' : 'Month out of range (01-12)',
    };
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return {
      valid: false,
      message: lang === 'ko' ? '일 범위 오류' : 'Day out of range',
    };
  }

  return { valid: true };
};

// 월 형식 검증 (YYYYMM) - I_SPMON
export const validateMonth = (value: string, lang: LangType): ValidationResult => {
  if (!value) return { valid: true };

  const monthRegex = /^\d{6}$/;
  if (!monthRegex.test(value)) {
    return {
      valid: false,
      message: lang === 'ko' ? '월 형식이 올바르지 않습니다 (YYYYMM)' : 'Invalid month format (YYYYMM)',
    };
  }

  const year = parseInt(value.slice(0, 4), 10);
  const month = parseInt(value.slice(4, 6), 10);

  if (year < 2000 || year > 2100) {
    return {
      valid: false,
      message: lang === 'ko' ? '연도 범위 오류 (2000-2100)' : 'Year out of range (2000-2100)',
    };
  }

  if (month < 1 || month > 12) {
    return {
      valid: false,
      message: lang === 'ko' ? '월 범위 오류 (01-12)' : 'Month out of range (01-12)',
    };
  }

  return { valid: true };
};

// 계획일수 검증 (I_ZPLDAYS: 1-150)
export const validatePlanDays = (value: string, lang: LangType): ValidationResult => {
  if (!value) return { valid: true };

  const num = parseInt(value, 10);
  if (isNaN(num) || num < 1 || num > 150) {
    return {
      valid: false,
      message: lang === 'ko' ? '계획일수 범위 오류 (1-150)' : 'Plan days out of range (1-150)',
    };
  }

  return { valid: true };
};

// 업체코드 검증 (I_LIFNR: 영문숫자 4-10자)
export const validateVendorCode = (value: string, lang: LangType): ValidationResult => {
  if (!value) return { valid: true };

  const vendorRegex = /^[A-Z0-9]{4,10}$/i;
  if (!vendorRegex.test(value)) {
    return {
      valid: false,
      message: lang === 'ko' ? '업체코드 형식 오류 (영문숫자 4-10자)' : 'Invalid vendor code (4-10 alphanumeric)',
    };
  }

  return { valid: true };
};

// ASN 번호 검증 (I_ZASNNO: ASN + YYYYMMDD + NNN 형식)
export const validateAsnNumber = (value: string, lang: LangType): ValidationResult => {
  if (!value) return { valid: true };

  // ASN20251229001 형식 또는 자유 형식 허용
  const asnRegex = /^[A-Z0-9]{5,20}$/i;
  if (!asnRegex.test(value)) {
    return {
      valid: false,
      message: lang === 'ko' ? 'ASN번호 형식 오류' : 'Invalid ASN number format',
    };
  }

  return { valid: true };
};

// 공장코드 검증 (I_WERKS: 4자리 숫자 또는 3자리+알파벳)
export const validatePlantCode = (value: string, lang: LangType): ValidationResult => {
  if (!value) return { valid: true }; // 빈 값은 '전체' 의미

  const plantRegex = /^[12]\d{2,3}[A-Z]?$/;
  if (!plantRegex.test(value)) {
    return {
      valid: false,
      message: lang === 'ko' ? '공장코드 형식 오류' : 'Invalid plant code format',
    };
  }

  return { valid: true };
};

// 자재번호 검증 (I_MATNR: 영문숫자 최대 18자)
export const validateMaterialNumber = (value: string, lang: LangType): ValidationResult => {
  if (!value) return { valid: true };

  if (value.length > 18) {
    return {
      valid: false,
      message: lang === 'ko' ? '자재번호 길이 초과 (최대 18자)' : 'Material number too long (max 18 chars)',
    };
  }

  return { valid: true };
};

// 파라미터별 검증 함수 매핑
export const PARAM_VALIDATORS: Record<string, (value: string, lang: LangType) => ValidationResult> = {
  'I_LIFNR': validateVendorCode,
  'I_BUDAT': validateDate,
  'I_ZDSEND2_START': validateDate,
  'I_DISPD': validateDate,
  'I_DISPW': validateDate,
  'I_ERDAT': validateDate,
  'I_BASEDT': validateDate,
  'I_SPMON': validateMonth,
  'I_ZPLDAYS': validatePlanDays,
  'I_WERKS': validatePlantCode,
  'I_ZASNNO': validateAsnNumber,
  'I_MATNR': validateMaterialNumber,
};

// 전체 파라미터 검증
export const validateAllParams = (
  params: Record<string, string>,
  lang: LangType
): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    const validator = PARAM_VALIDATORS[key];
    if (validator) {
      const result = validator(value, lang);
      if (!result.valid && result.message) {
        errors[key] = result.message;
      }
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

// 파라미터 힌트 텍스트 (placeholder)
export const PARAM_HINTS: Record<string, { ko: string; en: string }> = {
  'I_LIFNR': { ko: '예: RR4U', en: 'e.g., RR4U' },
  'I_BUDAT': { ko: 'YYYYMMDD', en: 'YYYYMMDD' },
  'I_ZDSEND2_START': { ko: 'YYYYMMDD', en: 'YYYYMMDD' },
  'I_DISPD': { ko: 'YYYYMMDD', en: 'YYYYMMDD' },
  'I_DISPW': { ko: '월요일 기준 YYYYMMDD', en: 'Monday YYYYMMDD' },
  'I_ERDAT': { ko: 'YYYYMMDD', en: 'YYYYMMDD' },
  'I_BASEDT': { ko: 'YYYYMMDD', en: 'YYYYMMDD' },
  'I_SPMON': { ko: 'YYYYMM', en: 'YYYYMM' },
  'I_ZPLDAYS': { ko: '1-150', en: '1-150' },
  'I_WERKS': { ko: '공장코드 (빈값=전체)', en: 'Plant code (empty=all)' },
  'I_ZASNNO': { ko: 'ASN번호', en: 'ASN Number' },
  'I_MATNR': { ko: '자재번호', en: 'Material No' },
  'I_STATUS': { ko: '빈값=전체', en: 'empty=all' },
};

// 힌트 텍스트 가져오기
export const getParamHint = (key: string, lang: LangType): string => {
  return PARAM_HINTS[key]?.[lang] || '';
};
