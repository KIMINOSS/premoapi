/**
 * PA 편집 모드에서 Office 365 Outlook 선택
 * Add an action 패널에서 Office 365 Outlook → Send an email (V2)
 */
const { chromium } = require('playwright');

async function main() {
  console.log('📧 Office 365 Outlook 선택...\n');

  const userDataDir = 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data';

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
    // 1. 플로우 상세 페이지
    console.log('[1] 플로우 상세 페이지...');
    const detailsUrl = `https://make.powerautomate.com/environments/${envId}/flows/${flowId}/details`;
    await page.goto(detailsUrl, { timeout: 60000 });
    await page.waitForTimeout(5000);

    // 2. Edit 클릭
    console.log('[2] Edit 클릭...');
    const editBtn = page.locator('button:has-text("Edit"), span:has-text("Edit")').first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(8000);
      console.log('   ✓ Edit 클릭됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pso-1.png' });

    // 3. + 버튼 클릭 (마지막 것)
    console.log('[3] + 버튼 클릭...');
    await page.waitForTimeout(3000);

    // 캔버스의 + 버튼 (Compose 아래)
    const plusButtons = await page.locator('[class*="msla-plus"], svg circle').all();
    console.log(`   + 버튼 수: ${plusButtons.length}`);

    // 마지막 + 클릭
    if (plusButtons.length > 0) {
      await plusButtons[plusButtons.length - 1].click({ force: true });
      await page.waitForTimeout(3000);
      console.log('   ✓ + 버튼 클릭됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pso-2.png' });

    // 4. Add an action 패널 확인
    console.log('[4] Add an action 패널 확인...');
    const addActionPanel = page.locator('text=Add an action').first();
    const panelVisible = await addActionPanel.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   패널 보임: ${panelVisible}`);

    if (!panelVisible) {
      // + 아이콘을 직접 클릭
      const plusIcon = page.locator('svg.msla-button-icon, [class*="edge-drop"]').last();
      if (await plusIcon.isVisible({ timeout: 3000 }).catch(() => false)) {
        await plusIcon.click({ force: true });
        await page.waitForTimeout(3000);
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pso-3.png' });

    // 5. Office 365 Outlook 클릭 (By connector 섹션)
    console.log('[5] Office 365 Outlook 선택...');

    // Office 365 Outlook 항목 찾기
    const outlookItem = page.locator('text=Office 365 Outlook').first();
    if (await outlookItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await outlookItem.click();
      await page.waitForTimeout(3000);
      console.log('   ✓ Office 365 Outlook 클릭됨');
    } else {
      // 스크롤하여 찾기
      await page.locator('[class*="operation-search"]').first().evaluate(el => el.scrollTop = 500);
      await page.waitForTimeout(1000);

      const outlookItem2 = page.locator('text=Office 365 Outlook').first();
      if (await outlookItem2.isVisible({ timeout: 3000 }).catch(() => false)) {
        await outlookItem2.click();
        await page.waitForTimeout(3000);
        console.log('   ✓ Office 365 Outlook 클릭됨 (스크롤 후)');
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pso-4.png' });

    // 6. Send an email (V2) 선택
    console.log('[6] Send an email (V2) 선택...');
    await page.waitForTimeout(2000);

    // Actions 목록에서 Send an email (V2) 찾기
    const sendEmailV2 = page.locator('text=Send an email (V2)').first();
    if (await sendEmailV2.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sendEmailV2.click();
      await page.waitForTimeout(5000);
      console.log('   ✓ Send an email (V2) 선택됨');
    } else {
      // 검색으로 찾기
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill('Send an email');
        await page.waitForTimeout(2000);

        const sendV2Alt = page.locator('text=Send an email (V2)').first();
        if (await sendV2Alt.isVisible({ timeout: 3000 }).catch(() => false)) {
          await sendV2Alt.click();
          await page.waitForTimeout(5000);
          console.log('   ✓ Send an email (V2) 검색 후 선택됨');
        }
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pso-5.png' });

    // 7. Outlook 액션 카드 확인
    console.log('[7] Outlook 액션 확인...');
    await page.waitForTimeout(2000);

    const outlookCard = await page.locator('text=/Send an email/i').isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   Outlook 카드 추가됨: ${outlookCard}`);

    if (outlookCard) {
      // 8. To 필드 Expression 입력
      console.log('[8] To Expression 입력...');

      // Send an email 카드 클릭하여 상세 패널 열기
      const emailCard = page.locator('text=/Send an email/i').first();
      await emailCard.click().catch(() => {});
      await page.waitForTimeout(2000);

      // To 필드 찾기
      const toField = page.locator('[aria-label="To"], [placeholder*="Enter email"], input[name*="to"]').first();
      if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
        await toField.click();
        await page.waitForTimeout(1500);
        console.log('   To 필드 클릭됨');

        // Expression 탭
        const exprTab = page.locator('button:has-text("Expression"), [role="tab"]:has-text("Expression")').first();
        if (await exprTab.isVisible({ timeout: 3000 }).catch(() => false)) {
          await exprTab.click();
          await page.waitForTimeout(1000);
          console.log('   Expression 탭 클릭됨');
        }

        // Expression 입력
        const fxInput = page.locator('textarea, input[placeholder*="fx"]').first();
        if (await fxInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await fxInput.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");

          const addBtn = page.locator('button:has-text("Add"), button:has-text("OK")').first();
          if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await addBtn.click();
            await page.waitForTimeout(1500);
            console.log('   ✓ To Expression 추가됨');
          }
        }
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pso-6.png' });

      // 9. Subject 동적 콘텐츠
      console.log('[9] Subject...');
      const subjField = page.locator('[aria-label="Subject"]').last();
      if (await subjField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await subjField.click();
        await page.waitForTimeout(1000);

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

      // 10. Body 동적 콘텐츠
      console.log('[10] Body...');
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
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pso-7.png' });
    }

    // 11. Save
    console.log('[11] Save...');
    const saveBtn = page.locator('button:has-text("Save"), [aria-label="Save"]').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
      console.log('   ✓ 저장됨');
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pso-final.png' });

    // 최종 확인
    console.log('\n===== 최종 상태 =====');
    const finalOutlook = await page.locator('text=/Send an email/i').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Outlook 액션: ${finalOutlook ? '존재' : '없음'}`);

    console.log('\n✅ 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pso-error.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await page.waitForTimeout(120000);
  await context.close();
}

main();
