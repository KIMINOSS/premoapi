/**
 * Power Automate - authpremoapi@gmail.com Gmail 트리거 설정
 * 기존 플로우의 Outlook 트리거를 Gmail로 변경
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🔧 PA 플로우 Gmail 트리거 설정 (authpremoapi@gmail.com)...\n');

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

    // 2. My flows
    console.log('[2] My flows...');
    const myFlows = page.locator('text=My flows').first();
    if (await myFlows.isVisible({ timeout: 10000 }).catch(() => false)) {
      await myFlows.click();
      await page.waitForTimeout(5000);
    }

    // 3. PREMO-Gmail-Auth 플로우 선택
    console.log('[3] PREMO-Gmail-Auth 플로우...');
    const flowLink = page.locator('text=PREMO-Gmail-Auth').first();
    if (await flowLink.isVisible({ timeout: 10000 }).catch(() => false)) {
      await flowLink.click();
      await page.waitForTimeout(3000);
    }

    // ESC로 패널 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // 4. Edit 클릭
    console.log('[4] Edit 클릭...');
    const editBtn = page.locator('button:has-text("Edit")').first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(10000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-edit-flow.png', fullPage: true });
    console.log('📸 플로우 편집 화면');

    // 5. 현재 트리거 확인 및 클릭
    console.log('[5] 트리거 확인...');

    // 트리거 카드 클릭 (첫 번째 카드)
    const triggerCard = page.locator('[class*="msla-panel-card-container"]').first();
    if (await triggerCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await triggerCard.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-trigger-panel.png', fullPage: true });

    // 6. 트리거 변경 (Change 또는 Delete + Add)
    console.log('[6] 트리거 변경 시도...');

    // Change connection 또는 Delete trigger 찾기
    const changeBtn = page.locator('text=/Change|변경/i').first();
    const deleteBtn = page.locator('button:has-text("Delete"), [aria-label*="Delete"]').first();

    if (await changeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('   Change 버튼 발견');
      await changeBtn.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-trigger-options.png', fullPage: true });

    console.log('\n════════════════════════════════════════════════════════');
    console.log('📌 현재 상태 캡처 완료');
    console.log('');
    console.log('📋 수동 설정 필요:');
    console.log('   1. 트리거를 "Gmail - When a new email arrives" 로 변경');
    console.log('   2. Gmail 계정: authpremoapi@gmail.com 연결');
    console.log('   3. Subject Filter: [TO:');
    console.log('   4. 저장');
    console.log('════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-error-setup.png', fullPage: true });
  }

  console.log('\n⏳ 브라우저 120초 유지 (수동 설정용)...');
  await page.waitForTimeout(120000);
  await context.close();
}

main();
