/**
 * Power Automate 플로우 수정 - Outlook 트리거로 변경
 * 홈에서 플로우 접근
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🔧 Power Automate 플로우 수정...\n');

  const userDataDir = 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data';

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'msedge',
    args: ['--start-maximized'],
    viewport: { width: 1400, height: 900 }
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. Power Automate 홈으로 이동
    console.log('[1] Power Automate 홈 이동...');
    await page.goto('https://make.powerautomate.com/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);

    // 2. My flows 클릭
    console.log('[2] My flows 메뉴...');
    const myFlows = page.locator('text=/My flows|내 흐름/i').first();
    if (await myFlows.isVisible({ timeout: 10000 }).catch(() => false)) {
      await myFlows.click();
      await page.waitForTimeout(3000);
    }

    // 3. PREMO-Gmail-Auth 플로우 찾기
    console.log('[3] PREMO-Gmail-Auth 플로우 검색...');
    await page.waitForTimeout(2000);

    const flowItem = page.locator('text=PREMO-Gmail-Auth').first();
    if (await flowItem.isVisible({ timeout: 10000 }).catch(() => false)) {
      await flowItem.click();
      await page.waitForTimeout(3000);
    }

    // 4. Edit 버튼 클릭
    console.log('[4] Edit 클릭...');
    await page.waitForTimeout(2000);

    // Edit 버튼 다양한 셀렉터 시도
    const editSelectors = [
      'button:has-text("Edit")',
      '[aria-label*="Edit"]',
      'text=Edit',
      'button >> text=Edit'
    ];

    for (const selector of editSelectors) {
      const editBtn = page.locator(selector).first();
      if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`   Edit 버튼 발견: ${selector}`);
        await editBtn.click();
        await page.waitForTimeout(5000);
        break;
      }
    }

    // 스크린샷
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-flow-edit.png', fullPage: true });
    console.log('\n📸 스크린샷: pa-flow-edit.png');

    // 5. 트리거 변경 안내
    console.log('\n════════════════════════════════════════════════════════');
    console.log('📌 수동 설정 필요:');
    console.log('════════════════════════════════════════════════════════');
    console.log('1. 기존 Gmail 트리거 삭제 (... 메뉴 → Delete)');
    console.log('2. Add trigger → "Outlook" 검색');
    console.log('3. "When a new email arrives (V3)" 선택');
    console.log('4. Folder: Inbox');
    console.log('5. Subject Filter: [TO:');
    console.log('6. Save');
    console.log('════════════════════════════════════════════════════════');

    // 30초 대기 (수동 작업용)
    console.log('\n⏳ 30초 동안 브라우저 유지...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-error2.png', fullPage: true });
  }

  await context.close();
}

main();
