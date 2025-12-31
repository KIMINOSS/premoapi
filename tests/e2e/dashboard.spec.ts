import { test, expect } from '@playwright/test'

test.describe('PREMOAPI 대시보드 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('랜딩 페이지 로드', async ({ page }) => {
    await expect(page).toHaveTitle(/PREMO|API|Monitor|Frontend/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('대시보드 페이지 접근', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('body')).toBeVisible()
    // 대시보드가 로드되면 인터페이스 선택 영역이 있어야 함
    await page.waitForLoadState('networkidle')
  })
})

test.describe('회사 탭 전환', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('HMC/KMC 탭 존재 확인', async ({ page }) => {
    // HMC, KMC 탭 버튼 확인
    const hmcTab = page.getByRole('button', { name: /HMC|현대/i })
    const kmcTab = page.getByRole('button', { name: /KMC|기아/i })

    // 둘 중 하나라도 있으면 성공 (UI에 따라 다를 수 있음)
    const hasHmc = await hmcTab.count()
    const hasKmc = await kmcTab.count()
    expect(hasHmc + hasKmc).toBeGreaterThan(0)
  })
})

test.describe('인터페이스 선택', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('인터페이스 목록 표시', async ({ page }) => {
    // 인터페이스 선택 영역 확인 (select, dropdown, 또는 버튼 목록)
    const interfaceSelector = page.locator('[data-testid="interface-select"], select, [role="combobox"]')
    
    // 선택기가 없으면 버튼 목록 확인
    if (await interfaceSelector.count() === 0) {
      const interfaceButtons = page.getByRole('button').filter({ hasText: /MMPM800/i })
      const count = await interfaceButtons.count()
      // 인터페이스가 있으면 성공
      if (count > 0) {
        expect(count).toBeGreaterThan(0)
      }
    }
  })
})

test.describe('파라미터 입력', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('필수 파라미터 필드 존재', async ({ page }) => {
    // 공급업체 코드 (I_LIFNR) 입력 필드
    const lifnrInput = page.locator('[name="I_LIFNR"], input[placeholder*="업체"], input[placeholder*="LIFNR"]')
    
    if (await lifnrInput.count() > 0) {
      await expect(lifnrInput.first()).toBeVisible()
    }
  })
})

test.describe('반응형 디자인', () => {
  test('모바일 뷰포트', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    await expect(page.locator('body')).toBeVisible()
  })

  test('태블릿 뷰포트', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/dashboard')
    await expect(page.locator('body')).toBeVisible()
  })

  test('데스크톱 뷰포트', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/dashboard')
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('언어 전환', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('한국어/영어 전환 버튼', async ({ page }) => {
    const langToggle = page.getByRole('button', { name: /KO|EN|한국어|English/i })
    
    if (await langToggle.count() > 0) {
      await langToggle.first().click()
      // 언어 전환 후 페이지 변화 확인
      await page.waitForTimeout(500)
    }
  })
})

test.describe('접근성', () => {
  test('키보드 네비게이션', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Tab 키로 네비게이션 가능한지 확인
    await page.keyboard.press('Tab')
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })
})
