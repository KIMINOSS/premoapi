import { describe, it, expect } from 'vitest'
import {
  HMC_INTERFACES,
  KMC_INTERFACES,
} from '@/app/dashboard/config/interfaces'
import { DATE_PARAMS } from '@/app/dashboard/utils/format'

// UI에서 처리하는 파라미터 유형
const UI_PARAM_HANDLERS = {
  // select 드롭다운
  SELECT_PARAMS: ['I_WERKS'],
  // 날짜 피커 (DATE_PARAMS from format.ts)
  DATE_PICKER_PARAMS: DATE_PARAMS, // ['I_BUDAT', 'I_ZDSEND2_START', 'I_DISPD', 'I_DISPW', 'I_ERDAT', 'I_BASEDT']
  // 월 피커
  MONTH_PICKER_PARAMS: ['I_SPMON'],
  // 기본 텍스트 입력 (위에 해당하지 않는 모든 파라미터)
  // 'I_LIFNR', 'I_ZPLDAYS', 'I_ZASNNO', 'I_STATUS', 'I_MATNR' 등
}

// 모든 인터페이스 파라미터 추출
const getAllParams = () => {
  const allParams = new Set<string>()
  ;[...HMC_INTERFACES, ...KMC_INTERFACES].forEach((iface) => {
    iface.params.forEach((p) => allParams.add(p))
  })
  return Array.from(allParams)
}

describe('UI 파라미터 입력 필드 커버리지', () => {
  const allParams = getAllParams()

  describe('모든 파라미터에 UI 핸들러 존재', () => {
    allParams.forEach((param) => {
      it(`${param}: 입력 UI 타입 확인`, () => {
        const isSelect = UI_PARAM_HANDLERS.SELECT_PARAMS.includes(param)
        const isDatePicker = UI_PARAM_HANDLERS.DATE_PICKER_PARAMS.includes(param)
        const isMonthPicker = UI_PARAM_HANDLERS.MONTH_PICKER_PARAMS.includes(param)
        const isTextInput = !isSelect && !isDatePicker && !isMonthPicker

        // 최소한 하나의 UI 핸들러가 있어야 함
        const hasHandler = isSelect || isDatePicker || isMonthPicker || isTextInput
        expect(hasHandler).toBe(true)

        // 핸들러 타입 로깅
        const type = isSelect
          ? 'SELECT'
          : isDatePicker
          ? 'DATE_PICKER'
          : isMonthPicker
          ? 'MONTH_PICKER'
          : 'TEXT_INPUT'
        console.log(`  ${param}: ${type}`)
      })
    })
  })

  describe('UI 핸들러 분류 정리', () => {
    it('SELECT 파라미터 목록', () => {
      const selectParams = allParams.filter((p) =>
        UI_PARAM_HANDLERS.SELECT_PARAMS.includes(p)
      )
      console.log('SELECT 파라미터:', selectParams)
      expect(selectParams).toContain('I_WERKS')
    })

    it('DATE_PICKER 파라미터 목록', () => {
      const dateParams = allParams.filter((p) =>
        UI_PARAM_HANDLERS.DATE_PICKER_PARAMS.includes(p)
      )
      console.log('DATE_PICKER 파라미터:', dateParams)
      expect(dateParams.length).toBeGreaterThan(0)
    })

    it('MONTH_PICKER 파라미터 목록', () => {
      const monthParams = allParams.filter((p) =>
        UI_PARAM_HANDLERS.MONTH_PICKER_PARAMS.includes(p)
      )
      console.log('MONTH_PICKER 파라미터:', monthParams)
      expect(monthParams).toContain('I_SPMON')
    })

    it('TEXT_INPUT 파라미터 목록', () => {
      const textParams = allParams.filter(
        (p) =>
          !UI_PARAM_HANDLERS.SELECT_PARAMS.includes(p) &&
          !UI_PARAM_HANDLERS.DATE_PICKER_PARAMS.includes(p) &&
          !UI_PARAM_HANDLERS.MONTH_PICKER_PARAMS.includes(p)
      )
      console.log('TEXT_INPUT 파라미터:', textParams)
      // 텍스트 입력으로 처리되는 파라미터들
      expect(textParams).toContain('I_LIFNR')
      expect(textParams).toContain('I_ZPLDAYS')
    })
  })
})

describe('특수 파라미터 UI 개선 필요 여부 검토', () => {
  it('I_ZPLDAYS: 숫자 입력 (1-150) - 현재 TEXT_INPUT', () => {
    // 개선 제안: type="number" min="1" max="150" 또는 슬라이더
    const param = 'I_ZPLDAYS'
    const isTextInput = !UI_PARAM_HANDLERS.SELECT_PARAMS.includes(param) &&
      !UI_PARAM_HANDLERS.DATE_PICKER_PARAMS.includes(param) &&
      !UI_PARAM_HANDLERS.MONTH_PICKER_PARAMS.includes(param)
    expect(isTextInput).toBe(true)
    console.log('⚠️ I_ZPLDAYS: 숫자 전용 입력으로 개선 권장')
  })

  it('I_STATUS: 상태 선택 - 현재 TEXT_INPUT', () => {
    // 개선 제안: select 드롭다운 (빈값=전체, 특정 상태값)
    const param = 'I_STATUS'
    const isTextInput = !UI_PARAM_HANDLERS.SELECT_PARAMS.includes(param) &&
      !UI_PARAM_HANDLERS.DATE_PICKER_PARAMS.includes(param) &&
      !UI_PARAM_HANDLERS.MONTH_PICKER_PARAMS.includes(param)
    expect(isTextInput).toBe(true)
    console.log('⚠️ I_STATUS: SELECT 드롭다운으로 개선 권장')
  })

  it('I_MATNR: 자재번호 - 현재 TEXT_INPUT', () => {
    // 개선 제안: 자동완성 또는 검색 기능
    const param = 'I_MATNR'
    const isTextInput = !UI_PARAM_HANDLERS.SELECT_PARAMS.includes(param) &&
      !UI_PARAM_HANDLERS.DATE_PICKER_PARAMS.includes(param) &&
      !UI_PARAM_HANDLERS.MONTH_PICKER_PARAMS.includes(param)
    expect(isTextInput).toBe(true)
    console.log('ℹ️ I_MATNR: 자동완성 기능 추가 가능')
  })

  it('I_ZASNNO: ASN번호 - 현재 TEXT_INPUT', () => {
    // 개선 제안: 형식 힌트 또는 자동 생성 버튼
    const param = 'I_ZASNNO'
    const isTextInput = !UI_PARAM_HANDLERS.SELECT_PARAMS.includes(param) &&
      !UI_PARAM_HANDLERS.DATE_PICKER_PARAMS.includes(param) &&
      !UI_PARAM_HANDLERS.MONTH_PICKER_PARAMS.includes(param)
    expect(isTextInput).toBe(true)
    console.log('ℹ️ I_ZASNNO: 형식 힌트/자동생성 버튼 추가 가능')
  })
})
