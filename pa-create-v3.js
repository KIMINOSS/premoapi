/**
 * PA Gmail 플로우 생성 v3 - Gmail 트리거 정확 선택
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🆕 PA Gmail 플로우 생성 v3...\n');

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
    console.log('⚠️ Edge 충돌');
    process.exit(1);
  }

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. Create 페이지
    console.log('[1] Create 페이지...');
    await page.goto('https://make.powerautomate.com/create', { timeout: 60000 });
    await page.waitForTimeout(6000);

    // 2. Automated cloud flow
    console.log('[2] Automated cloud flow...');
    await page.click('text=Automated cloud flow');
    await page.waitForTimeout(5000);

    // 3. 플로우 이름
    console.log('[3] 플로우 이름: PREMO-Gmail-Relay...');
    const nameInput = page.locator('[role="dialog"] input').first();
    await nameInput.fill('PREMO-Gmail-Relay');
    await page.waitForTimeout(1000);

    // 4. Gmail 검색
    console.log('[4] Gmail 검색...');
    const searchInput = page.locator('[role="dialog"] input').nth(1);
    await searchInput.fill('Gmail');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc3-1.png' });

    // 5. Gmail 트리거 선택 (data-test 속성 사용)
    console.log('[5] Gmail "When a new email arrives" 선택...');
    // Gmail API의 OnNewEmail 트리거를 정확히 선택
    const gmailTrigger = page.locator('[data-test*="shared_gmail"][data-test*="OnNewEmail"]').first();
    if (await gmailTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await gmailTrigger.click();
      console.log('   ✓ Gmail 트리거 선택됨 (data-test)');
    } else {
      // 대안: 첫번째 "When a new email arrives" 텍스트
      const triggers = await page.locator('text=When a new email arrives').all();
      console.log(`   트리거 수: ${triggers.length}`);
      if (triggers.length > 0) {
        await triggers[0].click();
        console.log('   ✓ 첫번째 트리거 선택됨');
      }
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc3-2.png' });

    // 6. Create 버튼
    console.log('[6] Create 버튼...');
    const createBtn = page.locator('[role="dialog"] button:has-text("Create")').first();
    await page.waitForTimeout(1000);

    const isDisabled = await createBtn.isDisabled().catch(() => true);
    console.log(`   Create 버튼 비활성화: ${isDisabled}`);

    if (!isDisabled) {
      await createBtn.click();
      console.log('   ✓ Create 클릭됨');
      await page.waitForTimeout(12000);
    } else {
      console.log('   ❌ Create 비활성화 - 라디오 버튼 클릭 시도');
      // 라디오 버튼 찾기
      const radio = page.locator('[role="dialog"] [role="radio"], [role="dialog"] input[type="radio"]').first();
      if (await radio.isVisible({ timeout: 3000 }).catch(() => false)) {
        await radio.click();
        await page.waitForTimeout(1000);
        await createBtn.click();
        await page.waitForTimeout(12000);
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc3-3.png' });

    // 7. 플로우 편집 화면
    console.log('[7] 플로우 편집 화면...');
    const url = page.url();
    console.log(`   URL: ${url}`);

    // Gmail Sign in 확인
    console.log('[8] Gmail 연결...');
    const signIn = page.locator('button:has-text("Sign in")').first();
    if (await signIn.isVisible({ timeout: 8000 }).catch(() => false)) {
      console.log('   Sign in 클릭');
      await signIn.click();
      await page.waitForTimeout(5000);

      // Google 팝업 처리
      const pages = context.pages();
      console.log(`   페이지 수: ${pages.length}`);
      for (const p of pages) {
        if (p.url().includes('google.com')) {
          console.log('   Google 로그인 페이지');
          const account = p.locator('div[data-email="authpremoapi@gmail.com"]').first();
          if (await account.isVisible({ timeout: 5000 }).catch(() => false)) {
            await account.click();
            console.log('   ✓ 계정 선택됨');
            await page.waitForTimeout(8000);
          }
        }
      }
    } else {
      console.log('   Gmail 이미 연결됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc3-4.png' });

    // 8. 트리거 카드 클릭 → Subject Filter
    console.log('[9] Subject Filter 설정...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    const triggerCard = page.locator('[class*="msla-panel-card"]').first();
    if (await triggerCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await triggerCard.click();
      await page.waitForTimeout(2000);
    }

    // Show advanced options
    const advOpt = page.locator('text=/Show advanced/i').first();
    if (await advOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
      await advOpt.click();
      await page.waitForTimeout(2000);
    }

    const subjFilter = page.locator('input[aria-label*="Subject"]').first();
    if (await subjFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await subjFilter.fill('[TO:');
      console.log('   ✓ Subject Filter: [TO:');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc3-5.png' });

    // 9. New step → Outlook
    console.log('[10] Outlook 액션 추가...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    const newStep = page.locator('button:has-text("New step")').first();
    if (await newStep.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newStep.click();
      await page.waitForTimeout(2000);
    }

    // Add an action
    const addAction = page.locator('text=/Add an action/i').first();
    if (await addAction.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addAction.click();
      await page.waitForTimeout(2000);
    }

    // Outlook Send 검색
    const actionSearch = page.locator('input[placeholder*="Search"]').last();
    if (await actionSearch.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionSearch.fill('Office 365 Outlook Send email');
      await page.waitForTimeout(3000);
    }

    // Send an email (V2) 선택
    const sendEmailV2 = page.locator('[data-test*="Send_an_email"][data-test*="V2"], text=Send an email (V2)').first();
    if (await sendEmailV2.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sendEmailV2.click();
      await page.waitForTimeout(3000);
      console.log('   ✓ Send an email (V2) 선택됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc3-6.png' });

    // 10. To 필드 Expression
    console.log('[11] To Expression...');
    const toField = page.locator('[aria-label="To"]').first();
    if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toField.click();
      await page.waitForTimeout(1500);

      // Expression 탭
      const exprTab = page.locator('[role="tab"]:has-text("Expression"), button:has-text("Expression")').first();
      if (await exprTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exprTab.click();
        await page.waitForTimeout(1000);
      }

      // fx 입력
      const fxInput = page.locator('textarea').first();
      if (await fxInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fxInput.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");
        console.log('   ✓ Expression 입력됨');

        // Add 버튼
        const addBtn = page.locator('button:has-text("Add")').first();
        if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await addBtn.click();
          await page.waitForTimeout(1500);
        }
      }
    }

    // 11. Subject/Body 동적 콘텐츠
    console.log('[12] Subject/Body...');
    // Subject
    const subjField = page.locator('[aria-label="Subject"]').last();
    if (await subjField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await subjField.click();
      await page.waitForTimeout(1000);
      const dynTab = page.locator('button:has-text("Dynamic")').first();
      if (await dynTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dynTab.click();
        await page.waitForTimeout(500);
      }
      const subjDyn = page.locator('button[aria-label="Subject"]').first();
      if (await subjDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await subjDyn.click();
      }
    }

    // Body
    const bodyField = page.locator('[aria-label="Body"]').first();
    if (await bodyField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bodyField.click();
      await page.waitForTimeout(1000);
      const dynTab2 = page.locator('button:has-text("Dynamic")').first();
      if (await dynTab2.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dynTab2.click();
        await page.waitForTimeout(500);
      }
      const bodyDyn = page.locator('button[aria-label="Body"]').first();
      if (await bodyDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await bodyDyn.click();
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc3-7.png' });

    // 12. Save
    console.log('[13] Save...');
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
      console.log('   ✓ 저장됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc3-final.png' });

    console.log('\n✅ 플로우 생성 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc3-error.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await page.waitForTimeout(120000);
  await context.close();
}

main();
