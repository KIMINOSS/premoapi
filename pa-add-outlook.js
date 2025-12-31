/**
 * PA 편집 모드에서 Outlook Send email 액션 추가
 * 이전 스크립트로 편집 모드 진입 확인됨
 */
const { chromium } = require('playwright');

async function main() {
  console.log('📧 Outlook Send email 액션 추가...\n');

  const userDataDir = 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data';

  // 플로우 정보
  const envId = 'Default-ef30448f-b0ea-4625-99b6-991583884a18';
  const flowId = '514fa3b0-89d6-4dec-a58a-4849e8ada79d';

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
    // 1. 플로우 상세 페이지로 이동
    console.log('[1] 플로우 상세 페이지...');
    const detailsUrl = `https://make.powerautomate.com/environments/${envId}/flows/${flowId}/details`;
    await page.goto(detailsUrl, { timeout: 60000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pao-1.png' });

    // 2. Edit 버튼 클릭
    console.log('[2] Edit 버튼 클릭...');
    const editBtn = page.locator('button:has-text("Edit"), span:has-text("Edit")').first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(8000);
      console.log('   ✓ Edit 클릭됨');
    }

    const currentUrl = page.url();
    console.log(`   URL: ${currentUrl}`);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pao-2.png' });

    // 3. 캔버스 확인
    console.log('[3] 캔버스 확인...');
    await page.waitForTimeout(3000);

    // 현재 플로우 구조 확인
    const triggerCard = page.locator('text=/When a new email arrives/i').first();
    const triggerVisible = await triggerCard.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   트리거 카드 보임: ${triggerVisible}`);

    const composeCard = page.locator('text=Compose').first();
    const composeVisible = await composeCard.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`   Compose 카드 보임: ${composeVisible}`);

    // Outlook 액션 이미 존재하는지 확인
    const outlookExists = await page.locator('text=/Send an email.*V2/i').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`   Outlook 액션 존재: ${outlookExists}`);

    if (outlookExists) {
      console.log('   ✓ Outlook 액션이 이미 존재합니다!');
    } else {
      // 4. 마지막 + 버튼 클릭 (Compose 아래)
      console.log('[4] + 버튼 클릭...');

      // + 버튼들 찾기
      const plusButtons = await page.locator('button[aria-label*="Insert"], [class*="msla-plus"]').all();
      console.log(`   + 버튼 수: ${plusButtons.length}`);

      // 마지막 + 버튼 클릭 (가장 아래에 있는 것)
      if (plusButtons.length > 0) {
        const lastPlus = plusButtons[plusButtons.length - 1];
        await lastPlus.click();
        await page.waitForTimeout(2000);
        console.log('   ✓ + 버튼 클릭됨');
      } else {
        // 대안: 캔버스의 + 아이콘 직접 찾기
        const plusIcon = page.locator('svg circle, [class*="edge-drop"]').last();
        if (await plusIcon.isVisible({ timeout: 3000 }).catch(() => false)) {
          await plusIcon.click();
          await page.waitForTimeout(2000);
        }
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pao-3.png' });

      // 5. Add an action 클릭
      console.log('[5] Add an action...');
      const addAction = page.locator('button:has-text("Add an action"), [aria-label*="Add an action"]').first();
      if (await addAction.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addAction.click();
        await page.waitForTimeout(3000);
        console.log('   ✓ Add an action 클릭됨');
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pao-4.png' });

      // 6. Office 365 Outlook 검색
      console.log('[6] Office 365 Outlook 검색...');
      const searchInput = page.locator('input[placeholder*="Search"]').last();
      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.fill('Office 365 Outlook Send');
        await page.waitForTimeout(3000);
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pao-5.png' });

      // 7. Send an email (V2) 선택
      console.log('[7] Send an email (V2) 선택...');

      // Actions 섹션에서 Send an email (V2) 찾기
      const sendEmailOptions = await page.locator('[class*="msla-op-search-list"] [class*="OperationSearchListItem"], [role="option"]').filter({ hasText: /Send an email.*V2/i }).all();
      console.log(`   Send an email 옵션 수: ${sendEmailOptions.length}`);

      if (sendEmailOptions.length > 0) {
        await sendEmailOptions[0].click({ force: true });
        await page.waitForTimeout(5000);
        console.log('   ✓ Send an email (V2) 선택됨');
      } else {
        // 대안: 텍스트로 직접 찾기
        const sendV2 = page.locator('text=Send an email (V2)').first();
        if (await sendV2.isVisible({ timeout: 5000 }).catch(() => false)) {
          await sendV2.click({ force: true });
          await page.waitForTimeout(5000);
          console.log('   ✓ Send an email (V2) 선택됨 (텍스트)');
        }
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pao-6.png' });

      // 8. To 필드에 Expression 입력
      console.log('[8] To Expression 입력...');
      await page.waitForTimeout(2000);

      // To 필드 찾기 (여러 선택자 시도)
      const toField = page.locator('[aria-label="To"], input[placeholder*="Enter email"], [data-automation-id*="to"]').first();
      const toVisible = await toField.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`   To 필드 보임: ${toVisible}`);

      if (toVisible) {
        await toField.click();
        await page.waitForTimeout(1500);

        // Expression 탭 클릭
        const exprTab = page.locator('button:has-text("Expression"), [role="tab"]:has-text("Expression")').first();
        if (await exprTab.isVisible({ timeout: 3000 }).catch(() => false)) {
          await exprTab.click();
          await page.waitForTimeout(1000);
          console.log('   Expression 탭 클릭됨');
        }

        // Expression 입력 필드
        const fxInput = page.locator('textarea, input[placeholder*="fx"]').first();
        if (await fxInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await fxInput.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");
          console.log('   Expression 입력됨');

          // Add 버튼 클릭
          const addBtn = page.locator('button:has-text("Add"), button:has-text("OK")').first();
          if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await addBtn.click();
            await page.waitForTimeout(1500);
            console.log('   ✓ To Expression 추가됨');
          }
        }
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pao-7.png' });

      // 9. Subject 필드
      console.log('[9] Subject...');
      const subjField = page.locator('[aria-label="Subject"]').last();
      if (await subjField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await subjField.click();
        await page.waitForTimeout(1000);

        // Dynamic content 탭
        const dynTab = page.locator('button:has-text("Dynamic content"), button:has-text("Dynamic")').first();
        if (await dynTab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await dynTab.click();
          await page.waitForTimeout(1000);
        }

        // Subject 동적 콘텐츠 선택
        const subjDyn = page.locator('button[aria-label*="Subject"], [data-automation-id*="subject"]').first();
        if (await subjDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await subjDyn.click();
          console.log('   ✓ Subject 동적 콘텐츠');
        }
      }

      // 10. Body 필드
      console.log('[10] Body...');
      const bodyField = page.locator('[aria-label="Body"]').first();
      if (await bodyField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await bodyField.click();
        await page.waitForTimeout(1000);

        const dynTab2 = page.locator('button:has-text("Dynamic content"), button:has-text("Dynamic")').first();
        if (await dynTab2.isVisible({ timeout: 2000 }).catch(() => false)) {
          await dynTab2.click();
          await page.waitForTimeout(1000);
        }

        const bodyDyn = page.locator('button[aria-label*="Body"], [data-automation-id*="body"]').first();
        if (await bodyDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await bodyDyn.click();
          console.log('   ✓ Body 동적 콘텐츠');
        }
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pao-8.png' });
    }

    // 11. Save 버튼 클릭
    console.log('[11] Save...');
    const saveBtn = page.locator('button:has-text("Save"), [aria-label="Save"]').first();
    const saveVisible = await saveBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   Save 버튼 보임: ${saveVisible}`);

    if (saveVisible) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
      console.log('   ✓ 저장됨');
    }

    // 12. 저장 결과 확인
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pao-final.png' });

    // 최종 확인
    console.log('\n===== 최종 상태 =====');
    const finalUrl = page.url();
    console.log(`URL: ${finalUrl}`);

    // Outlook 액션 재확인
    const outlookFinal = await page.locator('text=/Send an email/i').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Outlook 액션: ${outlookFinal ? '존재' : '없음'}`);

    console.log('\n✅ 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pao-error.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await page.waitForTimeout(120000);
  await context.close();
}

main();
