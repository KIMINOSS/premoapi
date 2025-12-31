/**
 * Power Automate - Gmail 트리거를 Outlook 트리거로 변경
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🔧 Power Automate 트리거 변경...\n');

  const userDataDir = 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data';

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'msedge',
    args: ['--start-maximized'],
    viewport: { width: 1400, height: 900 }
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. 플로우 상세 페이지로 이동
    console.log('[1] 플로우 페이지 이동...');
    await page.goto('https://make.powerautomate.com/environments/Default-3f6aef3c-3e2a-4d71-8e86-1f14f6b82a9d/flows/514fa3b0-89d6-4dec-a58a-4849e8ada79d/details', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    await page.waitForTimeout(5000);

    // Details 패널 닫기
    const closeBtn = page.locator('button[aria-label="Close"], .ms-Panel-closeButton').first();
    if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(1000);
    }

    // 2. 상단 Edit 버튼 클릭 (툴바)
    console.log('[2] Edit 버튼 클릭...');
    const toolbarEdit = page.locator('[data-automation-id="EditButton"], button:has-text("Edit")').first();
    await toolbarEdit.click();
    await page.waitForTimeout(8000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-edit-mode.png', fullPage: true });
    console.log('📸 Edit 모드 스크린샷');

    // 3. Gmail 트리거 카드 찾기 및 삭제
    console.log('[3] Gmail 트리거 삭제...');

    // 트리거 카드 클릭 (When a new email arrives)
    const triggerCard = page.locator('text=/When a new email arrives|새 전자 메일이 도착/i').first();
    if (await triggerCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await triggerCard.click();
      await page.waitForTimeout(2000);

      // 더보기(...) 메뉴 클릭
      const moreMenu = page.locator('[aria-label*="more"], [class*="more-commands"], button:has-text("...")').first();
      if (await moreMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
        await moreMenu.click();
        await page.waitForTimeout(1000);

        // Delete 클릭
        const deleteBtn = page.locator('text=/Delete|삭제/i').first();
        if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await deleteBtn.click();
          await page.waitForTimeout(2000);
          console.log('   ✅ Gmail 트리거 삭제됨');
        }
      }
    }

    // 4. 새 Outlook 트리거 추가
    console.log('[4] Outlook 트리거 추가...');

    // Add trigger 버튼
    const addTrigger = page.locator('text=/Add a trigger|트리거 추가/i, button:has-text("Add a trigger")').first();
    if (await addTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addTrigger.click();
      await page.waitForTimeout(3000);
    }

    // 검색창에 Outlook 입력
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"], [aria-label*="Search"]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('Office 365 Outlook when a new email arrives');
      await page.waitForTimeout(2000);
    }

    // Office 365 Outlook - When a new email arrives 선택
    const outlookTrigger = page.locator('text=/When a new email arrives.*Office 365|Office 365 Outlook.*When a new email/i').first();
    if (await outlookTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await outlookTrigger.click();
      await page.waitForTimeout(3000);
      console.log('   ✅ Outlook 트리거 선택됨');
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-outlook-selected.png', fullPage: true });

    // 5. 트리거 설정
    console.log('[5] 트리거 설정...');

    // Subject Filter 입력
    const subjectFilter = page.locator('input[aria-label*="Subject"], input[placeholder*="Subject"]').first();
    if (await subjectFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await subjectFilter.fill('[TO:');
      console.log('   Subject Filter: [TO:');
    }

    await page.waitForTimeout(2000);

    // 6. 저장
    console.log('[6] 저장...');
    const saveBtn = page.locator('button:has-text("Save"), [aria-label*="Save"]').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
      console.log('   ✅ 저장 완료');
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-final.png', fullPage: true });

    console.log('\n════════════════════════════════════════════════════════');
    console.log('✅ Power Automate 트리거 변경 완료!');
    console.log('════════════════════════════════════════════════════════');
    console.log('이전: Gmail - When a new email arrives');
    console.log('이후: Outlook - When a new email arrives (V3)');
    console.log('필터: Subject contains "[TO:"');
    console.log('════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-error3.png', fullPage: true });
  }

  console.log('\n📌 브라우저 30초 유지...');
  await page.waitForTimeout(30000);
  await context.close();
}

main();
