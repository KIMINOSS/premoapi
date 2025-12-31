/**
 * Power Automate - 플로우 확인 (홈에서 시작)
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🔍 Power Automate 플로우 확인...\n');

  const userDataDir = 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data';

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'msedge',
    args: ['--start-maximized'],
    viewport: { width: 1400, height: 900 }
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. Power Automate 홈
    console.log('[1] Power Automate 홈...');
    await page.goto('https://make.powerautomate.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(8000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-home-check.png', fullPage: true });

    // 2. My flows 클릭
    console.log('[2] My flows...');
    const myFlows = page.locator('text=My flows').first();
    if (await myFlows.isVisible({ timeout: 10000 }).catch(() => false)) {
      await myFlows.click();
      await page.waitForTimeout(5000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-myflows.png', fullPage: true });

    // 3. PREMO-Gmail-Auth 플로우 클릭
    console.log('[3] PREMO-Gmail-Auth 플로우...');
    const flowLink = page.locator('text=PREMO-Gmail-Auth').first();
    if (await flowLink.isVisible({ timeout: 10000 }).catch(() => false)) {
      await flowLink.click();
      await page.waitForTimeout(5000);
    }

    // Details 패널 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-flow-view.png', fullPage: true });

    // 4. Edit 버튼 클릭
    console.log('[4] Edit 클릭...');

    // 상단 툴바에서 Edit 찾기
    const editBtn = page.locator('button:has-text("Edit"), [aria-label*="Edit"]').first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      console.log('   Edit 클릭됨');
      await page.waitForTimeout(10000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-edit-view.png', fullPage: true });
    console.log('📸 편집 화면 스크린샷');

    // 5. 트리거 확인
    console.log('[5] 트리거 확인...');

    // 페이지 내용 확인
    const bodyText = await page.locator('body').textContent();

    if (bodyText.includes('Office 365 Outlook')) {
      console.log('   ✅ Outlook 트리거 확인됨');
    }
    if (bodyText.includes('Gmail')) {
      console.log('   ⚠️ Gmail 트리거 발견');
    }
    if (bodyText.includes('When a new email arrives')) {
      console.log('   ✅ 이메일 트리거 확인됨');
    }

    console.log('\n════════════════════════════════════════════════════════');
    console.log('📌 플로우 상태 확인 완료');
    console.log('════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-error-check.png', fullPage: true });
  }

  console.log('\n⏳ 브라우저 90초 유지...');
  await page.waitForTimeout(90000);
  await context.close();
}

main();
