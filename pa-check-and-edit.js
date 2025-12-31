/**
 * PA PREMO-Gmail-Auth 플로우 확인 및 편집
 * 정확한 선택자 사용
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🔍 PREMO-Gmail-Auth 확인 및 편집...\n');

  const userDataDir = 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data';

  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: 'msedge',
      args: ['--start-maximized'],
      viewport: { width: 1400, height: 900 }
    });
  } catch (err) {
    console.log('⚠️ Edge 시작 실패:', err.message);
    process.exit(1);
  }

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. 플로우 목록
    console.log('[1] 플로우 목록...');
    await page.goto('https://make.powerautomate.com/manage/flows', { timeout: 60000 });
    await page.waitForTimeout(5000);

    // 2. PREMO-Gmail-Auth 클릭
    console.log('[2] PREMO-Gmail-Auth 클릭...');
    await page.click('text=PREMO-Gmail-Auth');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pce-1.png' });

    // 3. Edit 버튼 클릭 (정확한 선택자)
    console.log('[3] Edit 버튼 클릭...');
    // 툴바의 Edit 버튼 (펜 아이콘)
    const editButton = page.locator('button[aria-label="Edit"], button:has-text("Edit")').first();

    // 버튼이 보이는지 확인
    const isVisible = await editButton.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   Edit 버튼 보임: ${isVisible}`);

    if (isVisible) {
      await editButton.click();
      console.log('   Edit 클릭됨');

      // 편집 화면 로드 대기 (URL 변경 또는 캔버스 표시)
      await page.waitForTimeout(10000);

      const newUrl = page.url();
      console.log(`   URL: ${newUrl}`);

      if (newUrl.includes('definition') || newUrl.includes('edit')) {
        console.log('   ✓ 편집 화면 진입');
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pce-2.png' });

    // 4. 현재 플로우 구조 확인
    console.log('[4] 플로우 구조 확인...');

    // 트리거 카드 텍스트 확인
    const triggerText = await page.locator('[class*="card"], [class*="trigger"]').first().textContent().catch(() => 'N/A');
    console.log(`   트리거: ${triggerText.substring(0, 50)}...`);

    // 액션 카드 확인
    const actionCards = await page.locator('[class*="action"], [class*="card"]').count().catch(() => 0);
    console.log(`   카드 수: ${actionCards}`);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pce-3.png' });

    // 5. 이미 Outlook Send email이 있는지 확인
    console.log('[5] Outlook 액션 확인...');
    const hasOutlookAction = await page.locator('text=/Send an email/i').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`   Outlook Send email 존재: ${hasOutlookAction}`);

    if (hasOutlookAction) {
      console.log('   ✓ Outlook 액션이 이미 존재합니다!');

      // 액션 카드 클릭하여 설정 확인
      const outlookCard = page.locator('text=/Send an email/i').first();
      await outlookCard.click().catch(() => {});
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pce-outlook.png' });

    } else {
      console.log('   Outlook 액션 없음 - 추가 필요');

      // + 버튼 클릭
      console.log('[6] 액션 추가...');
      const plusButton = page.locator('button:has-text("New step"), [aria-label*="Insert"], [aria-label*="Add"]').first();
      if (await plusButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await plusButton.click();
        await page.waitForTimeout(2000);
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pce-4.png' });

      // Add an action 클릭
      const addActionBtn = page.locator('button:has-text("Add an action")').first();
      if (await addActionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addActionBtn.click();
        await page.waitForTimeout(2000);
      }

      // Office 365 Outlook 검색
      console.log('[7] Outlook 검색...');
      const searchInput = page.locator('input[placeholder*="Search"]').last();
      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill('Office 365 Outlook Send');
        await page.waitForTimeout(3000);
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pce-5.png' });

      // Send an email (V2) 클릭
      const sendV2 = page.locator('text=Send an email (V2)').first();
      if (await sendV2.isVisible({ timeout: 5000 }).catch(() => false)) {
        await sendV2.click();
        await page.waitForTimeout(4000);
        console.log('   ✓ Send an email (V2) 추가됨');
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pce-6.png' });

      // To 필드에 Expression
      console.log('[8] To Expression...');
      const toInput = page.locator('[aria-label="To"], [placeholder*="To"]').first();
      if (await toInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await toInput.click();
        await page.waitForTimeout(1000);

        // Expression 탭
        await page.click('text=Expression').catch(() => {});
        await page.waitForTimeout(1000);

        // Expression 입력
        const fxArea = page.locator('textarea, input[type="text"]').last();
        if (await fxArea.isVisible({ timeout: 2000 }).catch(() => false)) {
          await fxArea.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");

          // Add 클릭
          await page.click('button:has-text("Add")').catch(() => {});
          await page.waitForTimeout(1500);
          console.log('   ✓ Expression 추가');
        }
      }

      // Subject, Body 동적 콘텐츠
      console.log('[9] Subject/Body...');
      // Subject
      const subjInput = page.locator('[aria-label="Subject"]').last();
      if (await subjInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await subjInput.click();
        await page.click('text=Dynamic').catch(() => {});
        await page.click('button[aria-label*="Subject"]').catch(() => {});
      }
      // Body
      const bodyInput = page.locator('[aria-label="Body"]').first();
      if (await bodyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await bodyInput.click();
        await page.click('text=Dynamic').catch(() => {});
        await page.click('button[aria-label*="Body"]').catch(() => {});
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pce-7.png' });
    }

    // 10. Save (편집 화면에 있을 때만)
    console.log('[10] Save...');
    const saveButton = page.locator('button[aria-label="Save"], button:has-text("Save")').first();
    const saveVisible = await saveButton.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`   Save 버튼 보임: ${saveVisible}`);

    if (saveVisible) {
      // Save As가 아닌 Save인지 확인
      const buttonText = await saveButton.textContent().catch(() => '');
      console.log(`   버튼 텍스트: ${buttonText}`);

      if (buttonText.includes('Save') && !buttonText.includes('As')) {
        await saveButton.click();
        await page.waitForTimeout(5000);
        console.log('   ✓ 저장됨');
      }
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pce-final.png' });

    // 최종 상태
    console.log('\n===== 최종 상태 =====');
    const finalUrl = page.url();
    console.log(`URL: ${finalUrl}`);

    console.log('\n✅ 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pce-error.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await page.waitForTimeout(120000);
  await context.close();
}

main();
