/**
 * Power Automate - 플로우 실행 기록 확인
 */
const { chromium } = require('playwright');

async function main() {
  console.log('📊 Power Automate 실행 기록 확인...\n');

  const userDataDir = 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data';

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'msedge',
    args: ['--start-maximized'],
    viewport: { width: 1400, height: 900 }
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    // 플로우 상세 페이지
    console.log('[1] 플로우 페이지...');
    await page.goto('https://make.powerautomate.com/environments/Default-3f6aef3c-3e2a-4d71-8e86-1f14f6b82a9d/flows/514fa3b0-89d6-4dec-a58a-4849e8ada79d', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(5000);

    // Details 패널 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // All runs 클릭
    console.log('[2] All runs 확인...');
    const allRuns = page.locator('text=All runs').first();
    if (await allRuns.isVisible({ timeout: 5000 }).catch(() => false)) {
      await allRuns.click();
      await page.waitForTimeout(5000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-runs.png', fullPage: true });
    console.log('📸 실행 기록 스크린샷');

    console.log('\n✅ 실행 기록 확인 완료');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-runs-error.png', fullPage: true });
  }

  console.log('\n⏳ 30초 유지...');
  await page.waitForTimeout(30000);
  await context.close();
}

main();
