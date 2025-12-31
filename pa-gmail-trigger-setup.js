/**
 * PA - Gmail 트리거로 변경 후 이메일 전달 설정
 * authpremoapi@gmail.com → Subject 파싱 → 최종수신자
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🔧 PA Gmail 트리거 설정...\n');

  const userDataDir = 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data';

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'msedge',
    args: ['--start-maximized'],
    viewport: { width: 1400, height: 900 }
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. 플로우 편집 페이지로 이동
    console.log('[1] 플로우 편집 페이지...');
    await page.goto('https://make.powerautomate.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(5000);

    // My flows 클릭
    await page.locator('text=My flows').first().click().catch(() => {});
    await page.waitForTimeout(3000);

    // PREMO-Gmail-Auth 클릭
    await page.locator('text=PREMO-Gmail-Auth').first().click().catch(() => {});
    await page.waitForTimeout(2000);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // Edit 클릭
    console.log('[2] Edit 모드 진입...');
    await page.locator('button:has-text("Edit")').first().click().catch(() => {});
    await page.waitForTimeout(8000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-before-change.png', fullPage: true });

    // 2. 기존 트리거 삭제
    console.log('[3] 기존 트리거 삭제...');

    // 트리거 카드의 ... 메뉴 클릭
    const triggerMenu = page.locator('[class*="msla-panel-card"] [aria-label*="More"], [class*="trigger"] button[aria-label*="menu"]').first();
    if (await triggerMenu.isVisible({ timeout: 5000 }).catch(() => false)) {
      await triggerMenu.click();
      await page.waitForTimeout(1000);

      // Delete 클릭
      const deleteOption = page.locator('text=Delete').first();
      if (await deleteOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await deleteOption.click();
        await page.waitForTimeout(2000);
      }
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-after-delete.png', fullPage: true });

    // 3. 새 Gmail 트리거 추가
    console.log('[4] Gmail 트리거 추가...');

    // Add a trigger 버튼 클릭
    const addTrigger = page.locator('text=/Add a trigger|트리거 추가/i').first();
    if (await addTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addTrigger.click();
      await page.waitForTimeout(3000);
    }

    // Gmail 검색
    const searchBox = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchBox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchBox.fill('Gmail');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-gmail-search.png', fullPage: true });

    // Gmail 커넥터 클릭
    const gmailConnector = page.locator('text=Gmail').first();
    if (await gmailConnector.isVisible({ timeout: 5000 }).catch(() => false)) {
      await gmailConnector.click();
      await page.waitForTimeout(2000);
    }

    // "When a new email arrives" 트리거 선택
    const emailTrigger = page.locator('text=/When a new email arrives|새 전자 메일/i').first();
    if (await emailTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailTrigger.click();
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-gmail-trigger.png', fullPage: true });

    console.log('\n════════════════════════════════════════════════════════');
    console.log('📌 Gmail 트리거 설정 진행 중');
    console.log('');
    console.log('📋 브라우저에서 설정:');
    console.log('   1. Gmail 계정 연결: authpremoapi@gmail.com');
    console.log('   2. Subject Filter: [TO:');
    console.log('   3. 액션 설정: Send an email (Outlook)');
    console.log('   4. To: Subject에서 파싱한 이메일');
    console.log('   5. 저장');
    console.log('════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-error.png', fullPage: true });
  }

  console.log('\n⏳ 브라우저 180초 유지...');
  await page.waitForTimeout(180000);
  await context.close();
}

main();
