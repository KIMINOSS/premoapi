/**
 * Power Automate - 플로우 편집 캔버스 진입
 * Details 패널 닫고 Edit 클릭
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🔧 Power Automate 플로우 편집 진입...\n');

  const userDataDir = 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data';

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'msedge',
    args: ['--start-maximized'],
    viewport: { width: 1400, height: 900 }
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. 플로우 상세 페이지로 직접 이동
    console.log('[1] 플로우 페이지 이동...');
    await page.goto('https://make.powerautomate.com/environments/Default-3f6aef3c-3e2a-4d71-8e86-1f14f6b82a9d/flows/514fa3b0-89d6-4dec-a58a-4849e8ada79d', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    await page.waitForTimeout(5000);

    // 2. Details 패널 닫기
    console.log('[2] Details 패널 닫기...');
    const closeSelectors = [
      'button[aria-label="Close"]',
      '.ms-Panel-closeButton',
      '[data-icon-name="Cancel"]',
      'button:has([data-icon-name="Cancel"])',
      '.ms-Dialog-button--close'
    ];

    for (const sel of closeSelectors) {
      const closeBtn = page.locator(sel).first();
      if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`   패널 닫기: ${sel}`);
        await closeBtn.click();
        await page.waitForTimeout(1000);
        break;
      }
    }

    // ESC 키로도 시도
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-before-edit.png', fullPage: true });

    // 3. 상단 툴바의 Edit 클릭
    console.log('[3] 툴바 Edit 버튼 클릭...');

    // 툴바 영역의 Edit 버튼 (연필 아이콘)
    const toolbarEdit = page.locator('[data-automation-id="commandBarEdit"], [aria-label="Edit"], button:has-text("Edit")').first();

    if (await toolbarEdit.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toolbarEdit.click();
      console.log('   Edit 클릭됨');
      await page.waitForTimeout(8000);
    } else {
      // 대안: 직접 편집 URL로 이동
      console.log('   Edit 버튼 없음 - 편집 URL로 직접 이동');
      await page.goto('https://make.powerautomate.com/environments/Default-3f6aef3c-3e2a-4d71-8e86-1f14f6b82a9d/flows/514fa3b0-89d6-4dec-a58a-4849e8ada79d/edit', {
        waitUntil: 'networkidle',
        timeout: 60000
      });
      await page.waitForTimeout(8000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-canvas.png', fullPage: true });
    console.log('📸 캔버스 스크린샷');

    // 4. 현재 트리거 확인
    console.log('[4] 트리거 확인...');

    // 트리거 카드 텍스트 확인
    const pageContent = await page.content();

    if (pageContent.includes('Office 365 Outlook') || pageContent.includes('Outlook')) {
      console.log('   ✅ 현재 트리거: Outlook');
    } else if (pageContent.includes('Gmail')) {
      console.log('   ⚠️ 현재 트리거: Gmail - 변경 필요');
    }

    // 트리거 카드 클릭해서 상세 확인
    const triggerCard = page.locator('[class*="msla-panel-card"], [class*="trigger-card"]').first();
    if (await triggerCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await triggerCard.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-trigger-detail.png', fullPage: true });
    console.log('📸 트리거 상세 스크린샷');

    console.log('\n════════════════════════════════════════════════════════');
    console.log('📌 Power Automate 플로우 편집 화면');
    console.log('════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-error-canvas.png', fullPage: true });
  }

  console.log('\n⏳ 브라우저 60초 유지...');
  await page.waitForTimeout(60000);
  await context.close();
}

main();
