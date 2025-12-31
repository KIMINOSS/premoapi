/**
 * PA 새 Gmail 플로우 생성 (처음부터)
 * Gmail 트리거 → Outlook 전송
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🆕 새 Gmail→Outlook 플로우 생성...\n');

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
    console.log('⚠️ Edge 프로필 충돌');
    process.exit(1);
  }

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. Create 페이지
    console.log('[1] Create 페이지...');
    await page.goto('https://make.powerautomate.com/create', { timeout: 60000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pnf1.png' });

    // 2. Automated cloud flow
    console.log('[2] Automated cloud flow...');
    const autoFlow = page.locator('text=Automated cloud flow').first();
    await autoFlow.waitFor({ state: 'visible', timeout: 15000 });
    await autoFlow.click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pnf2.png' });

    // 3. 플로우 이름 입력
    console.log('[3] 플로우 이름: PREMO-Gmail-Relay...');
    const nameInput = page.locator('input').first();
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.fill('PREMO-Gmail-Relay');
    await page.waitForTimeout(1000);

    // 4. Gmail 검색
    console.log('[4] Gmail 트리거 검색...');
    const searchInputs = await page.locator('input').all();
    for (let i = 1; i < searchInputs.length; i++) {
      const placeholder = await searchInputs[i].getAttribute('placeholder');
      if (placeholder && placeholder.toLowerCase().includes('search')) {
        await searchInputs[i].fill('Gmail');
        console.log('   검색창 입력됨');
        break;
      }
    }
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pnf3.png' });

    // 5. Gmail 커넥터 선택
    console.log('[5] Gmail 커넥터...');
    const gmailOption = page.locator('[aria-label*="Gmail"], img[alt*="Gmail"]').first();
    if (await gmailOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await gmailOption.click();
      await page.waitForTimeout(2000);
    } else {
      const gmailText = page.locator('text=Gmail').first();
      if (await gmailText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await gmailText.click();
        await page.waitForTimeout(2000);
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pnf4.png' });

    // 6. When a new email arrives 선택
    console.log('[6] When a new email arrives...');
    const trigger = page.locator('text=/When a new email arrives/i').first();
    if (await trigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await trigger.click();
      await page.waitForTimeout(2000);
      console.log('   ✓ 트리거 선택됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pnf5.png' });

    // 7. Create 버튼
    console.log('[7] Create 버튼...');
    // 모든 버튼 찾기
    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      const text = await btn.textContent().catch(() => '');
      if (text.includes('Create') && !text.includes('created')) {
        const disabled = await btn.isDisabled();
        if (!disabled) {
          await btn.click();
          console.log('   ✓ Create 클릭됨');
          break;
        }
      }
    }
    await page.waitForTimeout(10000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pnf6.png' });

    // 8. Gmail 연결 (Sign in)
    console.log('[8] Gmail Sign in...');
    const signIn = page.locator('button:has-text("Sign in"), [aria-label*="Sign in"]').first();
    if (await signIn.isVisible({ timeout: 8000 }).catch(() => false)) {
      console.log('   Sign in 버튼 발견');
      await signIn.click();
      await page.waitForTimeout(5000);

      // Google 팝업 처리
      const pages = context.pages();
      console.log(`   열린 페이지: ${pages.length}개`);

      for (const p of pages) {
        const pUrl = p.url();
        if (pUrl.includes('accounts.google.com')) {
          console.log('   Google 로그인 페이지');

          // 계정 선택
          const account = p.locator('div[data-email="authpremoapi@gmail.com"], text=authpremoapi@gmail.com').first();
          if (await account.isVisible({ timeout: 5000 }).catch(() => false)) {
            await account.click();
            console.log('   ✓ authpremoapi@gmail.com 선택');
            await page.waitForTimeout(5000);
          }
          await p.screenshot({ path: '/home/kogh/.playwright-mcp/pnf-google.png' });
        }
      }
      await page.waitForTimeout(5000);
    } else {
      console.log('   Gmail 이미 연결됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pnf7.png' });

    // 9. Subject Filter 설정
    console.log('[9] Subject Filter: [TO:...');
    // ESC로 패널 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // 트리거 카드 클릭
    const triggerCard = page.locator('[class*="msla-panel-card"]').first();
    if (await triggerCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await triggerCard.click();
      await page.waitForTimeout(2000);
    }

    // Show advanced options
    const showAdvanced = page.locator('text=/Show advanced options|고급 옵션 표시/i').first();
    if (await showAdvanced.isVisible({ timeout: 3000 }).catch(() => false)) {
      await showAdvanced.click();
      await page.waitForTimeout(2000);
    }

    // Subject Filter 입력
    const subjFilter = page.locator('input[aria-label*="Subject"], input[placeholder*="Subject"]').first();
    if (await subjFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await subjFilter.fill('[TO:');
      console.log('   ✓ Subject Filter 설정됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pnf8.png' });

    // 10. + New step
    console.log('[10] New step 추가...');
    // ESC 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    const newStepBtn = page.locator('button:has-text("New step"), button[aria-label*="Insert"]').first();
    if (await newStepBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newStepBtn.click();
      await page.waitForTimeout(2000);
    }

    // Add an action
    const addAction = page.locator('text=/Add an action/i').first();
    if (await addAction.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addAction.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pnf9.png' });

    // 11. Outlook Send email 검색
    console.log('[11] Office 365 Outlook Send email...');
    const searchAction = page.locator('input[placeholder*="Search"]').last();
    if (await searchAction.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchAction.fill('Office 365 Outlook Send');
      await page.waitForTimeout(3000);
    }

    // Send an email (V2)
    const sendEmail = page.locator('text=/Send an email.*V2/i').first();
    if (await sendEmail.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sendEmail.click();
      await page.waitForTimeout(3000);
      console.log('   ✓ Send an email (V2) 선택됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pnf10.png' });

    // 12. To 필드 - Expression
    console.log('[12] To 필드 Expression...');
    const toField = page.locator('[aria-label="To"], input[aria-label*="To"]').first();
    if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toField.click();
      await page.waitForTimeout(2000);

      // Expression 탭
      const exprTab = page.locator('button:has-text("Expression"), [role="tab"]:has-text("Expression")').first();
      if (await exprTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exprTab.click();
        await page.waitForTimeout(1000);
      }

      // fx 입력
      const fxInput = page.locator('textarea, input[placeholder*="fx"]').first();
      if (await fxInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fxInput.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");
        console.log('   ✓ Expression 입력됨');

        // Add 버튼
        const addBtn = page.locator('button:has-text("Add"), button:has-text("OK")').first();
        if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await addBtn.click();
          await page.waitForTimeout(1500);
        }
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pnf11.png' });

    // 13. Subject - Dynamic content
    console.log('[13] Subject 필드...');
    const subjField = page.locator('[aria-label="Subject"]').last();
    if (await subjField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await subjField.click();
      await page.waitForTimeout(1500);

      // Dynamic content
      const dynTab = page.locator('button:has-text("Dynamic content")').first();
      if (await dynTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dynTab.click();
        await page.waitForTimeout(1000);
      }

      // Subject 선택
      const subjDyn = page.locator('button[aria-label="Subject"]').first();
      if (await subjDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await subjDyn.click();
        console.log('   ✓ Subject 동적 콘텐츠');
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pnf12.png' });

    // 14. Body
    console.log('[14] Body 필드...');
    const bodyField = page.locator('[aria-label="Body"]').first();
    if (await bodyField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bodyField.click();
      await page.waitForTimeout(1500);

      // Dynamic content
      const dynTab2 = page.locator('button:has-text("Dynamic content")').first();
      if (await dynTab2.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dynTab2.click();
        await page.waitForTimeout(1000);
      }

      // Body 선택
      const bodyDyn = page.locator('button[aria-label="Body"]').first();
      if (await bodyDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await bodyDyn.click();
        console.log('   ✓ Body 동적 콘텐츠');
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pnf13.png' });

    // 15. Save
    console.log('[15] Save...');
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
      console.log('   ✓ 저장됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pnf-final.png' });

    console.log('\n✅ 플로우 생성 완료!');
    console.log('   이름: PREMO-Gmail-Relay');
    console.log('   트리거: Gmail (authpremoapi@gmail.com)');
    console.log('   필터: [TO: 포함 메일');
    console.log('   액션: Outlook으로 최종 수신자에게 전송');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pnf-error.png' });
  }

  console.log('\n⏳ 브라우저 180초 유지...');
  await page.waitForTimeout(180000);
  await context.close();
}

main();
