/**
 * PA Gmail 플로우 생성 v4 - 라디오 버튼 클릭
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🆕 PA Gmail 플로우 생성 v4...\n');

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
    console.log('[3] 플로우 이름...');
    const nameInput = page.locator('[role="dialog"] input').first();
    await nameInput.fill('PREMO-Gmail-Relay');
    await page.waitForTimeout(1000);

    // 4. Gmail 검색
    console.log('[4] Gmail 검색...');
    const searchInput = page.locator('[role="dialog"] input').nth(1);
    await searchInput.fill('Gmail when new');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc4-1.png' });

    // 5. Gmail 트리거 라디오 버튼 클릭
    console.log('[5] Gmail 트리거 라디오 버튼 클릭...');
    // Gmail의 "When a new email arrives" 행의 라디오 버튼 찾기
    // data-test 속성으로 찾기
    const gmailRow = page.locator('[data-test*="shared_gmail"][data-test*="OnNewEmail"]').first();
    if (await gmailRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      // 해당 행 내의 라디오 버튼 또는 행 자체 클릭
      const radio = gmailRow.locator('[role="radio"], input[type="radio"], circle').first();
      if (await radio.isVisible({ timeout: 2000 }).catch(() => false)) {
        await radio.click();
        console.log('   ✓ 라디오 버튼 클릭됨');
      } else {
        // 행 전체 클릭
        await gmailRow.click();
        console.log('   ✓ 행 클릭됨');
      }
    } else {
      // 대안: 첫번째 라디오 버튼 클릭
      console.log('   Gmail 행 못 찾음 - 첫번째 라디오 클릭');
      const firstRadio = page.locator('[role="dialog"] [role="radio"], [role="dialog"] .ms-ChoiceField-field').first();
      if (await firstRadio.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstRadio.click();
        console.log('   ✓ 첫번째 라디오 클릭됨');
      }
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc4-2.png' });

    // 6. Create 버튼 상태 확인 및 클릭
    console.log('[6] Create 버튼...');
    await page.waitForTimeout(1000);

    const createBtn = page.locator('[data-test="flow-modal-create-button"]').first();
    const isDisabled = await createBtn.isDisabled().catch(() => true);
    console.log(`   Create 비활성화: ${isDisabled}`);

    if (!isDisabled) {
      await createBtn.click();
      console.log('   ✓ Create 클릭됨');
      await page.waitForTimeout(12000);
    } else {
      // force 클릭 시도
      console.log('   force 클릭 시도...');
      await createBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(5000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc4-3.png' });

    // 7. URL 확인
    const url = page.url();
    console.log(`[7] URL: ${url}`);

    if (url.includes('definition') || url.includes('edit') || url.includes('flow')) {
      console.log('   ✓ 플로우 편집 화면');

      // Gmail 연결
      console.log('[8] Gmail 연결...');
      const signIn = page.locator('button:has-text("Sign in")').first();
      if (await signIn.isVisible({ timeout: 8000 }).catch(() => false)) {
        await signIn.click();
        await page.waitForTimeout(5000);

        const pages = context.pages();
        for (const p of pages) {
          if (p.url().includes('google.com')) {
            const account = p.locator('div[data-email="authpremoapi@gmail.com"]').first();
            if (await account.isVisible({ timeout: 5000 }).catch(() => false)) {
              await account.click();
              await page.waitForTimeout(8000);
            }
          }
        }
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc4-4.png' });

      // Subject Filter
      console.log('[9] Subject Filter...');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);

      const triggerCard = page.locator('[class*="msla-panel-card"]').first();
      if (await triggerCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await triggerCard.click();
        await page.waitForTimeout(2000);
      }

      const advOpt = page.locator('text=/Show advanced/i').first();
      if (await advOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
        await advOpt.click();
        await page.waitForTimeout(2000);
      }

      const subjFilter = page.locator('input[aria-label*="Subject"]').first();
      if (await subjFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
        await subjFilter.fill('[TO:');
        console.log('   ✓ [TO:');
      }

      // New step
      console.log('[10] Outlook 액션...');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);

      const newStep = page.locator('button:has-text("New step")').first();
      if (await newStep.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newStep.click();
        await page.waitForTimeout(2000);
      }

      const addAction = page.locator('text=/Add an action/i').first();
      if (await addAction.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addAction.click();
        await page.waitForTimeout(2000);
      }

      const actionSearch = page.locator('input[placeholder*="Search"]').last();
      if (await actionSearch.isVisible({ timeout: 3000 }).catch(() => false)) {
        await actionSearch.fill('Outlook Send email V2');
        await page.waitForTimeout(3000);
      }

      const sendEmail = page.locator('text=Send an email (V2)').first();
      if (await sendEmail.isVisible({ timeout: 5000 }).catch(() => false)) {
        await sendEmail.click();
        await page.waitForTimeout(3000);
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc4-5.png' });

      // To Expression
      console.log('[11] To Expression...');
      const toField = page.locator('[aria-label="To"]').first();
      if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
        await toField.click();
        await page.waitForTimeout(1500);

        const exprTab = page.locator('button:has-text("Expression")').first();
        if (await exprTab.isVisible({ timeout: 3000 }).catch(() => false)) {
          await exprTab.click();
          await page.waitForTimeout(1000);
        }

        const fxInput = page.locator('textarea').first();
        if (await fxInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await fxInput.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");

          const addBtn = page.locator('button:has-text("Add")').first();
          if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await addBtn.click();
            await page.waitForTimeout(1500);
          }
        }
      }

      // Subject/Body
      console.log('[12] Subject/Body...');
      const subjField = page.locator('[aria-label="Subject"]').last();
      if (await subjField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await subjField.click();
        await page.waitForTimeout(1000);
        const dynBtn = page.locator('button:has-text("Dynamic")').first();
        if (await dynBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await dynBtn.click();
          await page.waitForTimeout(500);
        }
        const subjDyn = page.locator('button[aria-label="Subject"]').first();
        if (await subjDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await subjDyn.click();
        }
      }

      const bodyField = page.locator('[aria-label="Body"]').first();
      if (await bodyField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await bodyField.click();
        await page.waitForTimeout(1000);
        const dynBtn2 = page.locator('button:has-text("Dynamic")').first();
        if (await dynBtn2.isVisible({ timeout: 2000 }).catch(() => false)) {
          await dynBtn2.click();
          await page.waitForTimeout(500);
        }
        const bodyDyn = page.locator('button[aria-label="Body"]').first();
        if (await bodyDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await bodyDyn.click();
        }
      }

      // Save
      console.log('[13] Save...');
      const saveBtn = page.locator('button:has-text("Save")').first();
      if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(5000);
        console.log('   ✓ 저장됨');
      }
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc4-final.png' });
    console.log('\n✅ 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc4-error.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await page.waitForTimeout(120000);
  await context.close();
}

main();
