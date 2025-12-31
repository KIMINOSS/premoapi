import { describe, it, expect } from 'vitest'
import {
  HMC_INTERFACES,
  KMC_INTERFACES,
  INTERFACE_CONFIG,
  INPUT_INTERFACES,
} from '@/app/dashboard/config/interfaces'
import { REQUIRED_PARAMS, validateRequiredParams } from '@/app/dashboard/config/fieldOrder'
import { PARAM_LABELS } from '@/app/dashboard/config/labels'
import { HMC_PLANTS, KMC_PLANTS } from '@/app/dashboard/config/plants'

describe('인터페이스 입력값 정의 검증', () => {
  describe('HMC 인터페이스 파라미터 일관성', () => {
    HMC_INTERFACES.forEach((iface) => {
      it(`${iface.id}: params와 REQUIRED_PARAMS 일치`, () => {
        const requiredConfig = REQUIRED_PARAMS[iface.id]
        expect(requiredConfig).toBeDefined()

        // 인터페이스에 정의된 params가 REQUIRED_PARAMS에 모두 있어야 함
        iface.params.forEach((param) => {
          expect(requiredConfig).toHaveProperty(param)
        })
      })

      it(`${iface.id}: 모든 파라미터에 라벨 존재`, () => {
        iface.params.forEach((param) => {
          expect(PARAM_LABELS[param]).toBeDefined()
          expect(PARAM_LABELS[param].ko).toBeTruthy()
          expect(PARAM_LABELS[param].en).toBeTruthy()
        })
      })
    })
  })

  describe('KMC 인터페이스 파라미터 일관성', () => {
    KMC_INTERFACES.forEach((iface) => {
      it(`${iface.id}: params와 REQUIRED_PARAMS 일치`, () => {
        const requiredConfig = REQUIRED_PARAMS[iface.id]
        expect(requiredConfig).toBeDefined()

        iface.params.forEach((param) => {
          expect(requiredConfig).toHaveProperty(param)
        })
      })

      it(`${iface.id}: 모든 파라미터에 라벨 존재`, () => {
        iface.params.forEach((param) => {
          expect(PARAM_LABELS[param]).toBeDefined()
        })
      })
    })
  })
})

describe('필수 파라미터 검증 함수', () => {
  describe('validateRequiredParams', () => {
    it('MMPM8001: I_LIFNR 필수, I_WERKS 선택', () => {
      // 필수값 누락
      const result1 = validateRequiredParams('MMPM8001', { I_WERKS: '1011' }, 'ko')
      expect(result1.valid).toBe(false)
      expect(result1.missingFields).toContain('업체코드')

      // 필수값 입력
      const result2 = validateRequiredParams('MMPM8001', { I_LIFNR: 'RR4U' }, 'ko')
      expect(result2.valid).toBe(true)
      expect(result2.missingFields).toHaveLength(0)
    })

    it('MMPM8004: I_LIFNR, I_SPMON 둘 다 필수', () => {
      // 하나만 입력
      const result1 = validateRequiredParams('MMPM8004', { I_LIFNR: 'RR4U' }, 'ko')
      expect(result1.valid).toBe(false)
      expect(result1.missingFields).toContain('기준월')

      // 둘 다 입력
      const result2 = validateRequiredParams('MMPM8004', { I_LIFNR: 'RR4U', I_SPMON: '202512' }, 'ko')
      expect(result2.valid).toBe(true)
    })

    it('MMPM8006: I_LIFNR, I_DISPD, I_ZPLDAYS 필수', () => {
      const result = validateRequiredParams('MMPM8006', { I_LIFNR: 'RR4U' }, 'ko')
      expect(result.valid).toBe(false)
      expect(result.missingFields.length).toBeGreaterThan(0)

      const resultOk = validateRequiredParams('MMPM8006', {
        I_LIFNR: 'RR4U',
        I_DISPD: '20251229',
        I_ZPLDAYS: '150',
      }, 'ko')
      expect(resultOk.valid).toBe(true)
    })

    it('MMPM8012: I_LIFNR, I_BUDAT, I_WERKS 모두 필수', () => {
      const result = validateRequiredParams('MMPM8012', { I_LIFNR: 'RR4U', I_BUDAT: '20251229' }, 'ko')
      expect(result.valid).toBe(false)
      expect(result.missingFields).toContain('공장')

      const resultOk = validateRequiredParams('MMPM8012', {
        I_LIFNR: 'RR4U',
        I_BUDAT: '20251229',
        I_WERKS: '1011',
      }, 'ko')
      expect(resultOk.valid).toBe(true)
    })

    it('영어 라벨 반환', () => {
      const result = validateRequiredParams('MMPM8001', {}, 'en')
      expect(result.missingFields).toContain('Vendor')
    })
  })
})

describe('입력 인터페이스 (8009, 8012, 8015) 설정', () => {
  it('MMPM8009: create 타입, headerFields/detailFields 정의', () => {
    const config = INPUT_INTERFACES['MMPM8009']
    expect(config).toBeDefined()
    expect(config.type).toBe('create')
    expect(config.headerFields).toBeDefined()
    expect(config.detailFields).toBeDefined()
    expect(config.headerFields!.length).toBeGreaterThan(0)
    expect(config.detailFields!.length).toBeGreaterThan(0)

    // 필수 헤더 필드 확인
    expect(config.headerFields).toContain('ZASNNO')
    expect(config.headerFields).toContain('ZDEPDAT')
    expect(config.headerFields).toContain('ZDEPTIM')
  })

  it('MMPM8012: adjust 타입, fields 정의', () => {
    const config = INPUT_INTERFACES['MMPM8012']
    expect(config).toBeDefined()
    expect(config.type).toBe('adjust')
    expect(config.fields).toBeDefined()
    expect(config.fields!.length).toBeGreaterThan(0)

    // 필수 필드 확인
    expect(config.fields).toContain('MATNR')
    expect(config.fields).toContain('ZLABST_PHY')
  })

  it('MMPM8015: adjust 타입, fields 정의', () => {
    const config = INPUT_INTERFACES['MMPM8015']
    expect(config).toBeDefined()
    expect(config.type).toBe('adjust')
    expect(config.fields).toBeDefined()

    // 필수 필드 확인
    expect(config.fields).toContain('WERKS')
    expect(config.fields).toContain('MATNR')
    expect(config.fields).toContain('QTY_PHYSICAL')
  })
})

describe('공장 목록 유효성', () => {
  it('HMC 공장: 코드 형식 검증 (1xxx)', () => {
    HMC_PLANTS.forEach((plant) => {
      if (plant.code) {
        expect(plant.code).toMatch(/^1\d{2,3}[A-Z]?$/)
      }
    })
  })

  it('KMC 공장: 코드 형식 검증 (2xxx)', () => {
    KMC_PLANTS.forEach((plant) => {
      if (plant.code) {
        expect(plant.code).toMatch(/^2\d{3}$/)
      }
    })
  })

  it('모든 공장에 한글/영어 이름 존재', () => {
    [...HMC_PLANTS, ...KMC_PLANTS].forEach((plant) => {
      expect(plant.name.ko).toBeTruthy()
      expect(plant.name.en).toBeTruthy()
    })
  })
})

describe('인터페이스 설정 (docType, serial)', () => {
  it('모든 인터페이스에 설정 존재', () => {
    const allInterfaceIds = [...new Set([
      ...HMC_INTERFACES.map((i) => i.id),
      ...KMC_INTERFACES.map((i) => i.id),
    ])]

    allInterfaceIds.forEach((id) => {
      expect(INTERFACE_CONFIG[id]).toBeDefined()
      expect(INTERFACE_CONFIG[id].docType).toBeTruthy()
      expect(INTERFACE_CONFIG[id].serial).toBeTruthy()
    })
  })
})
