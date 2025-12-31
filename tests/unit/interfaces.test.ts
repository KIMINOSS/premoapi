import { describe, it, expect } from 'vitest'
import {
  HMC_INTERFACES,
  KMC_INTERFACES,
  INTERFACE_CONFIG,
  INPUT_INTERFACES,
} from '@/app/dashboard/config/interfaces'

describe('interfaces.ts - HMC 인터페이스', () => {
  it('15개 인터페이스 정의', () => {
    expect(HMC_INTERFACES).toHaveLength(15)
  })

  it('모든 인터페이스에 필수 필드 존재', () => {
    HMC_INTERFACES.forEach((iface) => {
      expect(iface).toHaveProperty('id')
      expect(iface).toHaveProperty('name')
      expect(iface).toHaveProperty('params')
      expect(iface.name).toHaveProperty('ko')
      expect(iface.name).toHaveProperty('en')
      expect(Array.isArray(iface.params)).toBe(true)
    })
  })

  it('MMPM8009 (출하 생성)이 HMC Only', () => {
    const mmpm8009 = HMC_INTERFACES.find((i) => i.id === 'MMPM8009')
    expect(mmpm8009).toBeDefined()
    expect(mmpm8009?.name.ko).toBe('부품 출하 생성')
  })

  it('MMPM8013 (전주공장 간판발주)이 HMC Only', () => {
    const mmpm8013 = HMC_INTERFACES.find((i) => i.id === 'MMPM8013')
    expect(mmpm8013).toBeDefined()
    expect(mmpm8013?.name.ko).toBe('전주공장 간판발주')
  })
})

describe('interfaces.ts - KMC 인터페이스', () => {
  it('13개 인터페이스 정의 (8009, 8013 제외)', () => {
    expect(KMC_INTERFACES).toHaveLength(13)
  })

  it('MMPM8009가 없음', () => {
    const mmpm8009 = KMC_INTERFACES.find((i) => i.id === 'MMPM8009')
    expect(mmpm8009).toBeUndefined()
  })

  it('MMPM8013이 없음', () => {
    const mmpm8013 = KMC_INTERFACES.find((i) => i.id === 'MMPM8013')
    expect(mmpm8013).toBeUndefined()
  })
})

describe('interfaces.ts - 인터페이스 설정', () => {
  it('15개 설정 존재', () => {
    expect(Object.keys(INTERFACE_CONFIG)).toHaveLength(15)
  })

  it('각 설정에 docType과 serial 존재', () => {
    Object.entries(INTERFACE_CONFIG).forEach(([id, config]) => {
      expect(config).toHaveProperty('docType')
      expect(config).toHaveProperty('serial')
      expect(config.docType).toMatch(/^ZFMMP_[RS]_API_/)
      expect(config.serial).toMatch(/^80\d{3}$/)
    })
  })
})

describe('interfaces.ts - 입력 인터페이스', () => {
  it('3개 입력 인터페이스 정의 (8009, 8012, 8015)', () => {
    expect(Object.keys(INPUT_INTERFACES)).toHaveLength(3)
    expect(INPUT_INTERFACES).toHaveProperty('MMPM8009')
    expect(INPUT_INTERFACES).toHaveProperty('MMPM8012')
    expect(INPUT_INTERFACES).toHaveProperty('MMPM8015')
  })

  it('MMPM8009는 create 타입', () => {
    expect(INPUT_INTERFACES['MMPM8009'].type).toBe('create')
    expect(INPUT_INTERFACES['MMPM8009']).toHaveProperty('headerFields')
    expect(INPUT_INTERFACES['MMPM8009']).toHaveProperty('detailFields')
  })

  it('MMPM8012, 8015는 adjust 타입', () => {
    expect(INPUT_INTERFACES['MMPM8012'].type).toBe('adjust')
    expect(INPUT_INTERFACES['MMPM8015'].type).toBe('adjust')
  })
})
