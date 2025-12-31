import { describe, it, expect } from 'vitest'
import {
  validateDate,
  validateMonth,
  validatePlanDays,
  validateVendorCode,
  validateAsnNumber,
  validatePlantCode,
  validateMaterialNumber,
  validateAllParams,
  getParamHint,
  PARAM_VALIDATORS,
  PARAM_HINTS,
} from '@/app/dashboard/utils/validation'

describe('validation.ts - 날짜 검증', () => {
  describe('validateDate', () => {
    it('유효한 날짜 통과', () => {
      expect(validateDate('20251229', 'ko').valid).toBe(true)
      expect(validateDate('20240101', 'ko').valid).toBe(true)
      expect(validateDate('20250228', 'ko').valid).toBe(true)
    })

    it('빈 값은 통과 (필수 검증에서 처리)', () => {
      expect(validateDate('', 'ko').valid).toBe(true)
    })

    it('형식 오류 감지', () => {
      expect(validateDate('2025-12-29', 'ko').valid).toBe(false)
      expect(validateDate('20251', 'ko').valid).toBe(false)
      expect(validateDate('202512291', 'ko').valid).toBe(false)
    })

    it('범위 오류 감지', () => {
      expect(validateDate('19991229', 'ko').valid).toBe(false) // 연도 범위
      expect(validateDate('21011229', 'ko').valid).toBe(false) // 연도 범위
      expect(validateDate('20251329', 'ko').valid).toBe(false) // 월 범위
      expect(validateDate('20250230', 'ko').valid).toBe(false) // 2월 30일
    })

    it('영어 메시지 반환', () => {
      const result = validateDate('invalid', 'en')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('YYYYMMDD')
    })
  })
})

describe('validation.ts - 월 검증', () => {
  describe('validateMonth', () => {
    it('유효한 월 통과', () => {
      expect(validateMonth('202512', 'ko').valid).toBe(true)
      expect(validateMonth('202401', 'ko').valid).toBe(true)
    })

    it('형식 오류 감지', () => {
      expect(validateMonth('2025-12', 'ko').valid).toBe(false)
      expect(validateMonth('20251', 'ko').valid).toBe(false)
      expect(validateMonth('2025123', 'ko').valid).toBe(false)
    })

    it('범위 오류 감지', () => {
      expect(validateMonth('202513', 'ko').valid).toBe(false) // 월 범위
      expect(validateMonth('202500', 'ko').valid).toBe(false) // 월 범위
    })
  })
})

describe('validation.ts - 계획일수 검증', () => {
  describe('validatePlanDays', () => {
    it('유효한 범위 통과', () => {
      expect(validatePlanDays('1', 'ko').valid).toBe(true)
      expect(validatePlanDays('150', 'ko').valid).toBe(true)
      expect(validatePlanDays('75', 'ko').valid).toBe(true)
    })

    it('범위 오류 감지', () => {
      expect(validatePlanDays('0', 'ko').valid).toBe(false)
      expect(validatePlanDays('151', 'ko').valid).toBe(false)
      expect(validatePlanDays('-1', 'ko').valid).toBe(false)
    })

    it('숫자 아닌 값 감지', () => {
      expect(validatePlanDays('abc', 'ko').valid).toBe(false)
    })
  })
})

describe('validation.ts - 업체코드 검증', () => {
  describe('validateVendorCode', () => {
    it('유효한 코드 통과', () => {
      expect(validateVendorCode('RR4U', 'ko').valid).toBe(true)
      expect(validateVendorCode('VENDOR01', 'ko').valid).toBe(true)
      expect(validateVendorCode('TEST123456', 'ko').valid).toBe(true)
    })

    it('길이 오류 감지', () => {
      expect(validateVendorCode('ABC', 'ko').valid).toBe(false) // 3자
      expect(validateVendorCode('A'.repeat(11), 'ko').valid).toBe(false) // 11자
    })

    it('특수문자 오류 감지', () => {
      expect(validateVendorCode('RR-4U', 'ko').valid).toBe(false)
      expect(validateVendorCode('RR_4U', 'ko').valid).toBe(false)
    })
  })
})

describe('validation.ts - ASN 번호 검증', () => {
  describe('validateAsnNumber', () => {
    it('유효한 ASN 통과', () => {
      expect(validateAsnNumber('ASN20251229001', 'ko').valid).toBe(true)
      expect(validateAsnNumber('TEST12345', 'ko').valid).toBe(true)
    })

    it('길이 오류 감지', () => {
      expect(validateAsnNumber('ASN', 'ko').valid).toBe(false) // 너무 짧음
    })
  })
})

describe('validation.ts - 공장코드 검증', () => {
  describe('validatePlantCode', () => {
    it('HMC 공장코드 통과', () => {
      expect(validatePlantCode('1011', 'ko').valid).toBe(true)
      expect(validatePlantCode('101A', 'ko').valid).toBe(true)
      expect(validatePlantCode('1000', 'ko').valid).toBe(true)
    })

    it('KMC 공장코드 통과', () => {
      expect(validatePlantCode('2911', 'ko').valid).toBe(true)
      expect(validatePlantCode('2900', 'ko').valid).toBe(true)
    })

    it('빈 값은 전체 의미로 통과', () => {
      expect(validatePlantCode('', 'ko').valid).toBe(true)
    })

    it('형식 오류 감지', () => {
      expect(validatePlantCode('3000', 'ko').valid).toBe(false) // 3으로 시작
      expect(validatePlantCode('10', 'ko').valid).toBe(false) // 너무 짧음
    })
  })
})

describe('validation.ts - 자재번호 검증', () => {
  describe('validateMaterialNumber', () => {
    it('유효한 자재번호 통과', () => {
      expect(validateMaterialNumber('PART-001', 'ko').valid).toBe(true)
      expect(validateMaterialNumber('123456789012345678', 'ko').valid).toBe(true) // 18자
    })

    it('길이 초과 감지', () => {
      expect(validateMaterialNumber('1234567890123456789', 'ko').valid).toBe(false) // 19자
    })
  })
})

describe('validation.ts - 전체 파라미터 검증', () => {
  describe('validateAllParams', () => {
    it('모든 유효한 파라미터', () => {
      const result = validateAllParams({
        I_LIFNR: 'RR4U',
        I_BUDAT: '20251229',
        I_SPMON: '202512',
        I_ZPLDAYS: '150',
      }, 'ko')

      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it('일부 오류 감지', () => {
      const result = validateAllParams({
        I_LIFNR: 'RR', // 너무 짧음
        I_BUDAT: 'invalid',
        I_SPMON: '202512',
      }, 'ko')

      expect(result.valid).toBe(false)
      expect(result.errors['I_LIFNR']).toBeTruthy()
      expect(result.errors['I_BUDAT']).toBeTruthy()
      expect(result.errors['I_SPMON']).toBeUndefined()
    })
  })
})

describe('validation.ts - 힌트 텍스트', () => {
  describe('PARAM_HINTS', () => {
    it('모든 검증 대상 파라미터에 힌트 존재', () => {
      Object.keys(PARAM_VALIDATORS).forEach((key) => {
        expect(PARAM_HINTS[key]).toBeDefined()
        expect(PARAM_HINTS[key].ko).toBeTruthy()
        expect(PARAM_HINTS[key].en).toBeTruthy()
      })
    })
  })

  describe('getParamHint', () => {
    it('한글 힌트 반환', () => {
      expect(getParamHint('I_LIFNR', 'ko')).toBe('예: RR4U')
      expect(getParamHint('I_SPMON', 'ko')).toBe('YYYYMM')
    })

    it('영어 힌트 반환', () => {
      expect(getParamHint('I_LIFNR', 'en')).toBe('e.g., RR4U')
    })

    it('정의되지 않은 파라미터는 빈 문자열', () => {
      expect(getParamHint('UNKNOWN', 'ko')).toBe('')
    })
  })
})
