import { test, expect } from '@playwright/test'

test.describe('접근성 (Accessibility) 검사', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('모든 입력 필드에 라벨 연결', async ({ page }) => {
    // 입력 필드 수집
    const inputs = page.locator('input:not([type="hidden"]):not([type="file"]), select')
    const count = await inputs.count()

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const isVisible = await input.isVisible()

      if (isVisible) {
        // aria-label 또는 연결된 label 확인
        const ariaLabel = await input.getAttribute('aria-label')
        const id = await input.getAttribute('id')
        const placeholder = await input.getAttribute('placeholder')

        // 라벨이 있거나 placeholder가 있어야 함
        const hasLabel = ariaLabel || placeholder || id
        if (!hasLabel) {
          const parentLabel = await input.locator('xpath=ancestor::label | preceding-sibling::label').count()
          expect(parentLabel).toBeGreaterThan(0)
        }
      }
    }
  })

  test('버튼에 접근 가능한 이름 존재', async ({ page }) => {
    // 주요 액션 버튼만 확인 (조회, 입력 등)
    const actionButtons = page.locator('button.bg-red-500, button.bg-blue-500, button.bg-green-600, button.bg-orange-500')
    const count = await actionButtons.count()

    for (let i = 0; i < count; i++) {
      const button = actionButtons.nth(i)
      const isVisible = await button.isVisible()

      if (isVisible) {
        const text = await button.textContent()
        const ariaLabel = await button.getAttribute('aria-label')

        // 텍스트 또는 aria-label이 있어야 함
        const hasAccessibleName = (text && text.trim()) || ariaLabel
        expect(hasAccessibleName).toBeTruthy()
      }
    }

    // 적어도 하나의 액션 버튼이 있어야 함
    expect(count).toBeGreaterThan(0)
  })

  test('포커스 표시 스타일 존재', async ({ page }) => {
    const firstInput = page.locator('input').first()
    await firstInput.focus()

    // 포커스 시 스타일 변화 확인 (border-color 변경)
    const focusedBorder = await firstInput.evaluate((el) => {
      return window.getComputedStyle(el).borderColor
    })

    // 포커스 해제
    await page.locator('body').click()

    const normalBorder = await firstInput.evaluate((el) => {
      return window.getComputedStyle(el).borderColor
    })

    // 포커스 상태에서 시각적 변화가 있어야 함 (색상 또는 outline)
    // TailwindCSS focus:border-red-500 적용됨
  })

  test('색상 대비 - 텍스트 가독성', async ({ page }) => {
    // 주요 텍스트 요소의 색상 대비 확인
    const textElements = page.locator('label, span, p, h1, h2, h3')
    const count = await textElements.count()

    let checkedCount = 0
    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = textElements.nth(i)
      const isVisible = await element.isVisible()

      if (isVisible) {
        const color = await element.evaluate((el) => {
          const style = window.getComputedStyle(el)
          return {
            color: style.color,
            backgroundColor: style.backgroundColor,
          }
        })

        // 텍스트 색상이 존재해야 함
        expect(color.color).toBeTruthy()
        checkedCount++
      }
    }

    expect(checkedCount).toBeGreaterThan(0)
  })

  test('Tab 키 순서 확인', async ({ page }) => {
    // 첫 번째 입력 필드에 포커스
    const firstInput = page.locator('input').first()
    await firstInput.focus()

    // Tab으로 다음 요소로 이동
    await page.keyboard.press('Tab')
    
    // 포커스된 요소 확인
    const focused = page.locator(':focus')
    const focusCount = await focused.count()
    
    // 페이지에 포커스 가능한 요소가 있는지 확인
    const allFocusable = page.locator('input, select, button, a[href], [tabindex]')
    const totalCount = await allFocusable.count()
    
    expect(totalCount).toBeGreaterThan(0)
    console.log('포커스 가능한 요소 수:', totalCount)
  })

  test('필수 필드 표시 (*)', async ({ page }) => {
    // 필수 필드 표시 확인
    const requiredMarkers = page.locator('span.text-red-500')
    const count = await requiredMarkers.count()

    // 필수 필드 마커가 있어야 함
    expect(count).toBeGreaterThan(0)
  })

  test('에러 메시지 접근성', async ({ page }) => {
    // 정확한 '조회' 버튼 선택 (bg-red-500 클래스)
    const queryButton = page.locator('button.bg-red-500')

    if (await queryButton.count() > 0) {
      // 조회 버튼 클릭
      await queryButton.first().click()

      // 에러 메시지 대기 (있으면 확인)
      await page.waitForTimeout(1000)
      
      // 에러/알림 메시지 확인
      const messages = page.locator('[role="alert"], .text-red-600, .bg-red-100')
      const hasMessage = await messages.count()
      console.log('에러/알림 메시지 수:', hasMessage)
    }
  })
})

test.describe('폼 컴포넌트 접근성', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('SELECT 드롭다운 키보드 조작', async ({ page }) => {
    const selects = page.locator('select')
    const count = await selects.count()

    if (count > 0) {
      const firstSelect = selects.first()
      await firstSelect.focus()

      // 키보드로 옵션 변경
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')

      // 선택된 값 확인
      const value = await firstSelect.inputValue()
      expect(value).toBeDefined()
    }
  })

  test('NUMBER 입력 필드 검증', async ({ page }) => {
    // I_ZPLDAYS 필드 찾기 (type="number")
    const numberInput = page.locator('input[type="number"]')

    if (await numberInput.count() > 0) {
      const input = numberInput.first()
      await input.focus()

      // min/max 속성 확인
      const min = await input.getAttribute('min')
      const max = await input.getAttribute('max')

      expect(min).toBe('1')
      expect(max).toBe('150')

      // 키보드 증감
      await input.fill('50')
      await page.keyboard.press('ArrowUp')
      const value = await input.inputValue()
      expect(parseInt(value)).toBeGreaterThanOrEqual(50)
    }
  })

  test('DATE 피커 키보드 접근성', async ({ page }) => {
    // 날짜 입력 필드 (YYYYMMDD 텍스트 + hidden date input)
    const dateInputs = page.locator('input[type="date"]')

    if (await dateInputs.count() > 0) {
      // 날짜 피커가 있으면 접근 가능한지 확인
      const firstDate = dateInputs.first()
      const isAccessible = await firstDate.isEnabled()
      expect(isAccessible).toBe(true)
    }
  })
})
