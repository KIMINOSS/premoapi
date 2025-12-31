/**
 * PA - 새 Gmail→Outlook 플로우 생성
 * authpremoapi@gmail.com에서 수신 → Subject 파싱 → 최종 수신자에게 발송
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🆕 새 PA 플로우 생성 (Gmail → Outlook)...\n');

  const userDataDir = 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data';

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'msedge',
    args: ['--start-maximized'],
    viewport: { width: 1400, height: 900 }
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. Create 페이지로 이동
    console.log('[1] Create 페이지...');
    await page.goto('https://make.powerautomate.com/create', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-create.png', fullPage: true });

    // 2. Automated cloud flow 선택
    console.log('[2] Automated cloud flow 선택...');
    const automatedFlow = page.locator('text=/Automated cloud flow|자동화된 클라우드 흐름/i').first();
    if (await automatedFlow.isVisible({ timeout: 10000 }).catch(() => false)) {
      await automatedFlow.click();
      await page.waitForTimeout(3000);
    }

    // 3. 플로우 이름 입력
    console.log('[3] 플로우 이름 입력...');
    const nameInput = page.locator('input[placeholder*="flow name"], input[aria-label*="Flow name"]').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill('PREMO-AuthEmail-Forward');
      await page.waitForTimeout(1000);
    }

    // 4. Gmail 트리거 검색
    console.log('[4] Gmail 트리거 검색...');
    const triggerSearch = page.locator('input[placeholder*="Search"], input[placeholder*="trigger"]').first();
    if (await triggerSearch.isVisible({ timeout: 5000 }).catch(() => false)) {
      await triggerSearch.fill('Gmail when new email');
      await page.waitForTimeout(2000);
    }

    // Gmail 트리거 선택
    const gmailTrigger = page.locator('text=/Gmail.*When a new email arrives|Gmail.*새 전자 메일/i').first();
    if (await gmailTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await gmailTrigger.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-new-flow-trigger.png', fullPage: true });

    // 5. Create 버튼 클릭
    console.log('[5] Create 버튼 클릭...');
    const createBtn = page.locator('button:has-text("Create"), button:has-text("만들기")').first();
    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(8000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-new-flow-created.png', fullPage: true });

    console.log('\n════════════════════════════════════════════════════════');
    console.log('📌 새 플로우 생성됨');
    console.log('');
    console.log('📋 브라우저에서 설정 완료:');
    console.log('   1. Gmail 연결: authpremoapi@gmail.com');
    console.log('   2. Subject Filter: [TO:');
    console.log('   3. + New step → Outlook "Send an email (V2)"');
    console.log('   4. To: 수식 - split(split(triggerOutputs()?[\'body/subject\'],\'[TO:\')[1],\']\')[0]');
    console.log('   5. Subject: triggerBody()?[\'subject\']');
    console.log('   6. Body: triggerBody()?[\'body\']');
    console.log('   7. Save');
    console.log('════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-new-error.png', fullPage: true });
  }

  console.log('\n⏳ 브라우저 180초 유지...');
  await page.waitForTimeout(180000);
  await context.close();
}

main();
