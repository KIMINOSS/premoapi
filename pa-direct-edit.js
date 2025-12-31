/**
 * PA PREMO-Gmail-Auth 플로우 직접 편집
 * 편집 URL로 직접 이동하여 캔버스 진입
 */
const { chromium } = require('playwright');

async function main() {
  console.log('✏️ PREMO-Gmail-Auth 직접 편집...\n');

  const userDataDir = 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data';

  // 플로우 정보 (이전 스크린샷에서 확인)
  const envId = 'Default-ef30448f-b0ea-4625-99b6-991583884a18';
  const flowId = '514fa3b0-89d6-4dec-a58a-4849e8ada79d';
  const editUrl = `https://make.powerautomate.com/environments/${envId}/flows/${flowId}/definition`;

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
    // 1. 편집 URL로 직접 이동
    console.log('[1] 편집 화면으로 직접 이동...');
    console.log(`   URL: ${editUrl}`);
    await page.goto(editUrl, { timeout: 60000 });
    await page.waitForTimeout(10000);

    // URL 확인
    const currentUrl = page.url();
    console.log(`   현재 URL: ${currentUrl}`);

    if (currentUrl.includes('definition')) {
      console.log('   ✓ 편집 화면 진입 성공');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pde-1.png' });

    // 2. 캔버스 로드 대기
    console.log('[2] 캔버스 로드 대기...');
    await page.waitForTimeout(5000);

    // 트리거 카드 확인
    const triggerCard = page.locator('[class*="msla-panel"], [class*="card-container"], [data-automation-id*="card"]').first();
    const triggerVisible = await triggerCard.isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`   트리거 카드 보임: ${triggerVisible}`);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pde-2.png' });

    // 3. 현재 플로우 구조 확인
    console.log('[3] 플로우 구조 확인...');

    // 모든 카드/노드 수 확인
    const allCards = await page.locator('[class*="node"], [class*="card"]').count().catch(() => 0);
    console.log(`   노드/카드 수: ${allCards}`);

    // Outlook 액션 존재 확인
    const outlookExists = await page.locator('text=/Send an email/i').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`   Outlook 액션 존재: ${outlookExists}`);

    if (outlookExists) {
      console.log('   ✓ Outlook 액션이 이미 존재합니다!');
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pde-outlook-exists.png' });
    } else {
      // 4. + 버튼 찾기 (New Designer의 + 아이콘)
      console.log('[4] + 버튼 클릭...');

      // 캔버스에서 + 버튼 찾기 (여러 선택자 시도)
      const plusSelectors = [
        'button[aria-label*="Insert"]',
        'button[aria-label*="Add"]',
        '[class*="edge-button"]',
        '[class*="plus"]',
        'svg[class*="plus"]',
        '[data-automation-id*="add"]'
      ];

      let plusClicked = false;
      for (const selector of plusSelectors) {
        const plusBtn = page.locator(selector).first();
        if (await plusBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await plusBtn.click({ force: true });
          plusClicked = true;
          console.log(`   ✓ + 버튼 클릭됨 (${selector})`);
          await page.waitForTimeout(2000);
          break;
        }
      }

      if (!plusClicked) {
        // 캔버스 클릭 후 + 버튼 찾기
        console.log('   + 버튼 직접 찾기 실패 - 캔버스에서 찾기');
        await page.keyboard.press('Tab');
        await page.waitForTimeout(1000);
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pde-3.png' });

      // 5. Add an action 클릭
      console.log('[5] Add an action...');
      const addAction = page.locator('button:has-text("Add an action"), [aria-label*="Add an action"]').first();
      if (await addAction.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addAction.click();
        await page.waitForTimeout(3000);
        console.log('   ✓ Add an action 클릭됨');
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pde-4.png' });

      // 6. Office 365 Outlook 검색
      console.log('[6] Office 365 Outlook 검색...');
      const searchInput = page.locator('input[placeholder*="Search"]').last();
      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.fill('Office 365 Outlook');
        await page.waitForTimeout(3000);
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pde-5.png' });

      // 7. Office 365 Outlook Connector 클릭
      console.log('[7] Outlook Connector 선택...');
      // Connectors 섹션에서 Office 365 Outlook 클릭
      const outlookConnector = page.locator('[class*="connector"], [role="option"]').filter({ hasText: 'Office 365 Outlook' }).first();
      if (await outlookConnector.isVisible({ timeout: 5000 }).catch(() => false)) {
        await outlookConnector.click({ force: true });
        await page.waitForTimeout(3000);
        console.log('   ✓ Outlook Connector 클릭됨');
      } else {
        // 대안: 텍스트로 클릭
        await page.click('text=Office 365 Outlook', { force: true }).catch(() => {});
        await page.waitForTimeout(3000);
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pde-6.png' });

      // 8. Send an email (V2) 선택
      console.log('[8] Send an email (V2) 선택...');
      // Actions 목록에서 선택
      const sendEmailV2 = page.locator('text=Send an email (V2)').first();
      if (await sendEmailV2.isVisible({ timeout: 5000 }).catch(() => false)) {
        await sendEmailV2.click({ force: true });
        await page.waitForTimeout(5000);
        console.log('   ✓ Send an email (V2) 선택됨');
      } else {
        // 검색으로 찾기
        const searchInput2 = page.locator('input[placeholder*="Search"]').last();
        if (await searchInput2.isVisible({ timeout: 2000 }).catch(() => false)) {
          await searchInput2.fill('Send an email');
          await page.waitForTimeout(2000);
        }
        const sendV2Alt = page.locator('text=/Send an email.*V2/i').first();
        if (await sendV2Alt.isVisible({ timeout: 3000 }).catch(() => false)) {
          await sendV2Alt.click({ force: true });
          await page.waitForTimeout(5000);
          console.log('   ✓ Send an email (V2) 선택됨 (검색)');
        }
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pde-7.png' });

      // 9. To 필드에 Expression 입력
      console.log('[9] To Expression 입력...');
      const toField = page.locator('[aria-label="To"], input[name*="to" i]').first();
      if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
        await toField.click();
        await page.waitForTimeout(1500);

        // Expression 탭 클릭
        const exprTab = page.locator('button:has-text("Expression"), [role="tab"]:has-text("Expression")').first();
        if (await exprTab.isVisible({ timeout: 3000 }).catch(() => false)) {
          await exprTab.click();
          await page.waitForTimeout(1000);
        }

        // Expression 입력
        const fxInput = page.locator('textarea, input[type="text"]').last();
        if (await fxInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await fxInput.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");

          // Add 버튼
          const addBtn = page.locator('button:has-text("Add"), button:has-text("OK")').first();
          if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await addBtn.click();
            await page.waitForTimeout(1500);
            console.log('   ✓ To Expression 추가됨');
          }
        }
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pde-8.png' });

      // 10. Subject 필드
      console.log('[10] Subject...');
      const subjField = page.locator('[aria-label="Subject"]').last();
      if (await subjField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await subjField.click();
        await page.waitForTimeout(1000);

        // Dynamic content 탭
        const dynTab = page.locator('button:has-text("Dynamic")').first();
        if (await dynTab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await dynTab.click();
          await page.waitForTimeout(1000);
        }

        // Subject 동적 콘텐츠
        const subjDyn = page.locator('button[aria-label*="Subject"]').first();
        if (await subjDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await subjDyn.click();
          console.log('   ✓ Subject 동적 콘텐츠');
        }
      }

      // 11. Body 필드
      console.log('[11] Body...');
      const bodyField = page.locator('[aria-label="Body"]').first();
      if (await bodyField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await bodyField.click();
        await page.waitForTimeout(1000);

        const dynTab2 = page.locator('button:has-text("Dynamic")').first();
        if (await dynTab2.isVisible({ timeout: 2000 }).catch(() => false)) {
          await dynTab2.click();
          await page.waitForTimeout(1000);
        }

        const bodyDyn = page.locator('button[aria-label*="Body"]').first();
        if (await bodyDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await bodyDyn.click();
          console.log('   ✓ Body 동적 콘텐츠');
        }
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pde-9.png' });
    }

    // 12. Save 버튼 클릭
    console.log('[12] Save...');
    // 편집 화면의 Save 버튼 (상단 툴바)
    const saveBtn = page.locator('button[aria-label="Save"], button:has-text("Save")').first();
    const saveVisible = await saveBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   Save 버튼 보임: ${saveVisible}`);

    if (saveVisible) {
      // Save 버튼 텍스트 확인 (Save As가 아닌지)
      const btnText = await saveBtn.textContent().catch(() => '');
      console.log(`   버튼 텍스트: "${btnText}"`);

      if (btnText.toLowerCase().includes('save') && !btnText.toLowerCase().includes('as')) {
        await saveBtn.click();
        await page.waitForTimeout(5000);
        console.log('   ✓ 저장됨');
      } else {
        console.log('   ⚠️ Save As 버튼 - 클릭 안 함');
      }
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pde-final.png' });

    // 최종 확인
    console.log('\n===== 최종 상태 =====');
    const finalUrl = page.url();
    console.log(`URL: ${finalUrl}`);

    // Outlook 액션 존재 재확인
    const outlookFinal = await page.locator('text=/Send an email/i').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Outlook 액션: ${outlookFinal ? '존재' : '없음'}`);

    console.log('\n✅ 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pde-error.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await page.waitForTimeout(120000);
  await context.close();
}

main();
