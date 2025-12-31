/**
 * Power Automate 플로우 수정 - Outlook 트리거로 변경
 * Gmail 트리거 → Outlook 트리거
 */
const { chromium } = require('playwright');

const FLOW_URL = 'https://make.powerautomate.com/environments/Default-3f6aef3c-3e2a-4d71-8e86-1f14f6b82a9d/flows/514fa3b0-89d6-4dec-a58a-4849e8ada79d';

async function main() {
  console.log('🔧 Power Automate 플로우 수정 시작...');
  console.log('   Gmail 트리거 → Outlook 트리거로 변경\n');

  const userDataDir = 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data';

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'msedge',
    args: ['--start-maximized'],
    viewport: { width: 1400, height: 900 }
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. 플로우 페이지로 이동
    console.log('[1] 플로우 페이지 이동...');
    await page.goto(FLOW_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // 2. Edit 버튼 클릭
    console.log('[2] Edit 버튼 클릭...');
    const editBtn = page.locator('button:has-text("Edit")').first();
    await editBtn.click();
    await page.waitForTimeout(5000);

    // 3. 기존 Gmail 트리거 삭제
    console.log('[3] 기존 트리거 확인...');

    // 트리거 카드 클릭 (첫 번째 카드)
    const triggerCard = page.locator('[class*="msla-panel-card"]').first();
    if (await triggerCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await triggerCard.click();
      await page.waitForTimeout(2000);

      // 삭제 버튼 (... 메뉴)
      const moreBtn = page.locator('[aria-label*="More"], [class*="more-commands"]').first();
      if (await moreBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await moreBtn.click();
        await page.waitForTimeout(1000);

        const deleteOption = page.locator('text=/Delete|삭제/i').first();
        if (await deleteOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('[3-1] 기존 트리거 삭제...');
          await deleteOption.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // 4. 새 Outlook 트리거 추가
    console.log('[4] 새 Outlook 트리거 추가...');

    // Add trigger 버튼 찾기
    const addTriggerBtn = page.locator('text=/Add a trigger|트리거 추가/i').first();
    if (await addTriggerBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addTriggerBtn.click();
      await page.waitForTimeout(2000);
    }

    // Outlook 검색
    const searchBox = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchBox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchBox.fill('Outlook when a new email arrives');
      await page.waitForTimeout(2000);
    }

    // "When a new email arrives (V3)" 선택
    const outlookTrigger = page.locator('text=/When a new email arrives.*V3|새 전자 메일이 도착하면/i').first();
    if (await outlookTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('[4-1] Outlook 트리거 선택...');
      await outlookTrigger.click();
      await page.waitForTimeout(3000);
    }

    // 5. 트리거 설정 - Subject Filter
    console.log('[5] 트리거 필터 설정...');

    // Subject Filter 필드 찾기
    const subjectFilter = page.locator('input[aria-label*="Subject Filter"], input[placeholder*="Subject"]').first();
    if (await subjectFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await subjectFilter.fill('[TO:');
      console.log('   Subject Filter: [TO:');
    }

    // Folder 설정 (Inbox)
    const folderField = page.locator('[aria-label*="Folder"], [placeholder*="Folder"]').first();
    if (await folderField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await folderField.click();
      await page.waitForTimeout(1000);
      const inboxOption = page.locator('text=/Inbox|받은 편지함/i').first();
      if (await inboxOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await inboxOption.click();
      }
    }

    await page.waitForTimeout(2000);

    // 6. 저장
    console.log('[6] 저장...');
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
    }

    // 스크린샷
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-outlook-trigger.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: pa-outlook-trigger.png');

    console.log('\n════════════════════════════════════════════════════════');
    console.log('✅ Power Automate 플로우 수정 완료!');
    console.log('════════════════════════════════════════════════════════');
    console.log('트리거: Outlook - When a new email arrives (V3)');
    console.log('필터: Subject contains "[TO:"');
    console.log('액션: Subject 파싱 → 해당 주소로 발송');
    console.log('════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-error.png', fullPage: true });
  }

  console.log('\n📌 브라우저 열린 상태 유지 (수동 확인용)');
  await page.waitForTimeout(30000);
  await context.close();
}

main();
