/**
 * Power Automate - Outlook 트리거로 변경 v2
 * 더 유연한 셀렉터 및 디버깅 추가
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🔧 Power Automate 트리거 변경 v2...\n');

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
    await page.goto('https://make.powerautomate.com/', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    await page.waitForTimeout(5000);

    // 스크린샷 1
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-home.png', fullPage: true });
    console.log('📸 홈 스크린샷');

    // 2. My flows 메뉴 클릭
    console.log('[2] My flows 메뉴...');
    const myFlowsSelectors = [
      'text=My flows',
      '[aria-label*="My flows"]',
      'nav >> text=My flows',
      'text=내 흐름'
    ];

    for (const sel of myFlowsSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`   Found: ${sel}`);
        await el.click();
        await page.waitForTimeout(3000);
        break;
      }
    }

    // 3. PREMO-Gmail-Auth 플로우 찾기
    console.log('[3] PREMO-Gmail-Auth 플로우...');
    await page.waitForTimeout(2000);

    const flowItem = page.locator('text=PREMO-Gmail-Auth').first();
    if (await flowItem.isVisible({ timeout: 10000 }).catch(() => false)) {
      await flowItem.click();
      await page.waitForTimeout(4000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-flow-detail.png', fullPage: true });
    console.log('📸 플로우 상세 스크린샷');

    // 4. Edit 버튼 클릭 (다양한 시도)
    console.log('[4] Edit 버튼 클릭...');

    const editSelectors = [
      'button:has-text("Edit")',
      '[data-automation-id="EditButton"]',
      'button[aria-label*="Edit"]',
      '[class*="command"] >> text=Edit',
      'button >> text=Edit',
      '[role="menubar"] >> text=Edit'
    ];

    let editClicked = false;
    for (const sel of editSelectors) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`   Edit 버튼 발견: ${sel}`);
        await btn.click();
        editClicked = true;
        await page.waitForTimeout(8000);
        break;
      }
    }

    if (!editClicked) {
      console.log('   ⚠️ Edit 버튼 못찾음 - 페이지 요소 확인');
      // 버튼들 목록 출력
      const buttons = await page.locator('button').allTextContents();
      console.log('   버튼들:', buttons.slice(0, 10).join(', '));
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-edit-mode-v2.png', fullPage: true });
    console.log('📸 Edit 모드 스크린샷');

    // 5. 트리거 카드 확인
    console.log('[5] 트리거 확인...');
    await page.waitForTimeout(3000);

    // 현재 트리거 찾기
    const triggerTexts = [
      'When a new email arrives',
      '새 전자 메일이 도착',
      'Gmail',
      'Outlook'
    ];

    for (const txt of triggerTexts) {
      const trigger = page.locator(`text=${txt}`).first();
      if (await trigger.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`   현재 트리거: ${txt}`);
      }
    }

    // 6. Add trigger 버튼 찾기 (트리거가 없는 경우)
    console.log('[6] Add trigger 확인...');
    const addTriggerBtn = page.locator('text=/Add a trigger|트리거 추가/i').first();
    if (await addTriggerBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('   Add trigger 버튼 발견');
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-trigger-state.png', fullPage: true });

    console.log('\n════════════════════════════════════════════════════════');
    console.log('📌 현재 상태 캡처 완료');
    console.log('════════════════════════════════════════════════════════');
    console.log('스크린샷 파일들:');
    console.log('  - pa-home.png');
    console.log('  - pa-flow-detail.png');
    console.log('  - pa-edit-mode-v2.png');
    console.log('  - pa-trigger-state.png');
    console.log('════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-error-v2.png', fullPage: true });
  }

  console.log('\n⏳ 브라우저 60초 유지 (수동 확인용)...');
  await page.waitForTimeout(60000);
  await context.close();
}

main();
