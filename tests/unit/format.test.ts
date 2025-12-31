import { describe, it, expect } from 'vitest'
import {
  toDateInput,
  toYYYYMMDD,
  formatTime,
  formatNumber,
  formatDate,
  formatTimeValue,
  getOrderedHeaders,
} from '@/app/dashboard/utils/format'

describe('format.ts - 날짜 변환 함수', () => {
  describe('toDateInput', () => {
    it('YYYYMMDD를 YYYY-MM-DD로 변환', () => {
      expect(toDateInput('20251229')).toBe('2025-12-29')
      expect(toDateInput('20240101')).toBe('2024-01-01')
    })

    it('빈 문자열 처리', () => {
      expect(toDateInput('')).toBe('')
    })

    it('잘못된 길이 처리', () => {
      expect(toDateInput('2025')).toBe('')
      expect(toDateInput('202512291')).toBe('')
    })
  })

  describe('toYYYYMMDD', () => {
    it('YYYY-MM-DD를 YYYYMMDD로 변환', () => {
      expect(toYYYYMMDD('2025-12-29')).toBe('20251229')
      expect(toYYYYMMDD('2024-01-01')).toBe('20240101')
    })

    it('하이픈 없는 문자열은 그대로 반환', () => {
      expect(toYYYYMMDD('20251229')).toBe('20251229')
    })
  })

  describe('formatDate', () => {
    it('8자리 숫자를 날짜 형식으로 변환', () => {
      expect(formatDate('20251229')).toBe('2025-12-29')
    })

    it('null/undefined/빈값 처리', () => {
      expect(formatDate(null)).toBe('')
      expect(formatDate(undefined)).toBe('')
      expect(formatDate('')).toBe('')
    })

    it('8자리가 아닌 값은 그대로 반환', () => {
      expect(formatDate('2025-12-29')).toBe('2025-12-29')
      expect(formatDate('invalid')).toBe('invalid')
    })
  })
})

describe('format.ts - 시간 포맷 함수', () => {
  describe('formatTime', () => {
    it('초를 HH:MM:SS로 변환', () => {
      expect(formatTime(0)).toBe('00:00:00')
      expect(formatTime(59)).toBe('00:00:59')
      expect(formatTime(60)).toBe('00:01:00')
      expect(formatTime(3661)).toBe('01:01:01')
      expect(formatTime(86399)).toBe('23:59:59')
    })
  })

  describe('formatTimeValue', () => {
    it('6자리 숫자를 시간 형식으로 변환', () => {
      expect(formatTimeValue('120000')).toBe('12:00:00')
      expect(formatTimeValue('093045')).toBe('09:30:45')
    })

    it('null/undefined/빈값 처리', () => {
      expect(formatTimeValue(null)).toBe('')
      expect(formatTimeValue(undefined)).toBe('')
      expect(formatTimeValue('')).toBe('')
    })

    it('6자리가 아닌 값은 그대로 반환', () => {
      expect(formatTimeValue('12:00:00')).toBe('12:00:00')
    })
  })
})

describe('format.ts - 숫자 포맷 함수', () => {
  describe('formatNumber', () => {
    it('숫자에 천단위 콤마 추가', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1234567)).toBe('1,234,567')
      expect(formatNumber(0)).toBe('0')
    })

    it('문자열 숫자도 처리', () => {
      expect(formatNumber('1000')).toBe('1,000')
    })

    it('null/undefined/빈값 처리', () => {
      expect(formatNumber(null)).toBe('')
      expect(formatNumber(undefined)).toBe('')
      expect(formatNumber('')).toBe('')
    })

    it('숫자가 아닌 값은 그대로 반환', () => {
      expect(formatNumber('abc')).toBe('abc')
    })
  })
})

describe('format.ts - 헤더 정렬 함수', () => {
  describe('getOrderedHeaders', () => {
    it('정의된 순서대로 헤더 정렬', () => {
      const dataKeys = ['MATNR', 'LIFNR', 'WERKS', 'MAKTX']
      const result = getOrderedHeaders('MMPM8001', dataKeys)
      // 순서가 정의되어 있으면 해당 순서로, 아니면 원본 순서
      expect(result).toContain('MATNR')
      expect(result).toContain('LIFNR')
    })

    it('순서 정의 없으면 데이터 순서 그대로', () => {
      const dataKeys = ['A', 'B', 'C']
      const result = getOrderedHeaders('UNKNOWN', dataKeys)
      expect(result).toEqual(['A', 'B', 'C'])
    })

    it('zpldays 필터링', () => {
      // MMPM8006은 ZQD001, ZQD002 형식 (3자리 패딩)
      const dataKeys = ['MATNR', 'ZQD001', 'ZQD002', 'ZQD003', 'ZQD004', 'ZQD005']
      const result = getOrderedHeaders('MMPM8006', dataKeys, 3)
      // ZQD004, ZQD005는 필터링되어야 함 (zpldays=3보다 큼)
      expect(result).toContain('ZQD001')
      expect(result).toContain('ZQD002')
      expect(result).toContain('ZQD003')
      expect(result).not.toContain('ZQD004')
      expect(result).not.toContain('ZQD005')
    })
  })
})
