import { describe, it, expect } from 'vitest'
import {
  HMC_INTERFACES,
  KMC_INTERFACES,
} from '@/app/dashboard/config/interfaces'
import { REQUIRED_PARAMS } from '@/app/dashboard/config/fieldOrder'
import { PARAM_LABELS } from '@/app/dashboard/config/labels'

describe('파라미터 커버리지 검사 - 누락 확인', () => {
  describe('HMC 인터페이스: REQUIRED_PARAMS → params 완전성', () => {
    HMC_INTERFACES.forEach((iface) => {
      it(`${iface.id}: REQUIRED_PARAMS의 모든 키가 params에 존재`, () => {
        const required = REQUIRED_PARAMS[iface.id]
        expect(required).toBeDefined()

        const requiredKeys = Object.keys(required)
        const missingInParams = requiredKeys.filter((k) => !iface.params.includes(k))

        if (missingInParams.length > 0) {
          console.log(`⚠️ ${iface.id}: 인터페이스 params에 누락된 파라미터:`, missingInParams)
        }

        // 모든 REQUIRED_PARAMS 키가 인터페이스 params에 있어야 함
        expect(missingInParams).toEqual([])
      })
    })
  })

  describe('KMC 인터페이스: REQUIRED_PARAMS → params 완전성', () => {
    KMC_INTERFACES.forEach((iface) => {
      it(`${iface.id}: REQUIRED_PARAMS의 모든 키가 params에 존재`, () => {
        const required = REQUIRED_PARAMS[iface.id]
        expect(required).toBeDefined()

        const requiredKeys = Object.keys(required)
        const missingInParams = requiredKeys.filter((k) => !iface.params.includes(k))

        if (missingInParams.length > 0) {
          console.log(`⚠️ ${iface.id}: 인터페이스 params에 누락된 파라미터:`, missingInParams)
        }

        expect(missingInParams).toEqual([])
      })
    })
  })

  describe('인터페이스 params → REQUIRED_PARAMS 역방향 확인', () => {
    const allInterfaces = [...HMC_INTERFACES, ...KMC_INTERFACES]
    const uniqueInterfaces = allInterfaces.filter(
      (iface, idx, arr) => arr.findIndex((i) => i.id === iface.id) === idx
    )

    uniqueInterfaces.forEach((iface) => {
      it(`${iface.id}: params의 모든 키가 REQUIRED_PARAMS에 존재`, () => {
        const required = REQUIRED_PARAMS[iface.id]
        expect(required).toBeDefined()

        const requiredKeys = Object.keys(required)
        const extraInParams = iface.params.filter((k) => !requiredKeys.includes(k))

        if (extraInParams.length > 0) {
          console.log(`ℹ️ ${iface.id}: REQUIRED_PARAMS에 없는 파라미터:`, extraInParams)
        }

        // 모든 인터페이스 params가 REQUIRED_PARAMS에 정의되어 있어야 함
        expect(extraInParams).toEqual([])
      })
    })
  })

  describe('PARAM_LABELS 완전성', () => {
    it('모든 REQUIRED_PARAMS 키에 라벨 존재', () => {
      const allParamKeys = new Set<string>()

      Object.values(REQUIRED_PARAMS).forEach((params) => {
        Object.keys(params).forEach((key) => allParamKeys.add(key))
      })

      const missingLabels: string[] = []
      allParamKeys.forEach((key) => {
        if (!PARAM_LABELS[key]) {
          missingLabels.push(key)
        }
      })

      if (missingLabels.length > 0) {
        console.log('⚠️ PARAM_LABELS에 누락된 파라미터:', missingLabels)
      }

      expect(missingLabels).toEqual([])
    })
  })
})
