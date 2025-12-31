/**
 * PA Gmail→Outlook 릴레이 플로우 완전 생성
 * Gmail [TO:xxx@xxx.com] → Outlook으로 전달
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🆕 PA Gmail→Outlook 릴레이 플로우 생성...\n');

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
    // 1. Create 페이지
    console.log('[1] Create 페이지...');
    await page.goto('https://make.powerautomate.com/create', { timeout: 60000 });
    await page.waitForTimeout(6000);

    // 2. Automated cloud flow
    console.log('[2] Automated cloud flow...');
    const autoFlow = page.locator('text=Automated cloud flow').first();
    await autoFlow.click();
    await page.waitForTimeout(5000);

    // 3. 플로우 이름
    console.log('[3] 플로우 이름: PREMO-Gmail-Relay...');
    const nameInput = page.locator('[role="dialog"] input').first();
    await nameInput.fill('PREMO-Gmail-Relay');
    await page.waitForTimeout(1000);

    // 4. Gmail 검색
    console.log('[4] Gmail 검색...');
    const searchInput = page.locator('[role="dialog"] input').nth(1);
    await searchInput.fill('Gmail when new');
    await page.waitForTimeout(3000);

    // 5. Gmail 트리거 선택 (라디오 버튼)
    console.log('[5] Gmail 트리거 선택...');
    const gmailRow = page.locator('[data-test*="shared_gmail"][data-test*="OnNewEmail"]').first();
    if (await gmailRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await gmailRow.click();
      console.log('   ✓ Gmail 행 클릭됨');
    } else {
      // 대안: 첫번째 라디오
      const radio = page.locator('[role="dialog"] .ms-ChoiceField-field, [role="dialog"] [role="radio"]').first();
      if (await radio.isVisible({ timeout: 3000 }).catch(() => false)) {
        await radio.click();
        console.log('   ✓ 라디오 버튼 클릭됨');
      }
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcc-1.png' });

    // 6. Create 버튼
    console.log('[6] Create 버튼...');
    const createBtn = page.locator('[data-test="flow-modal-create-button"]').first();
    await page.waitForTimeout(1000);

    const isDisabled = await createBtn.isDisabled().catch(() => true);
    console.log(`   비활성화: ${isDisabled}`);

    if (!isDisabled) {
      await createBtn.click();
      console.log('   ✓ Create 클릭됨');
    } else {
      await createBtn.click({ force: true });
      console.log('   ✓ Create force 클릭');
    }
    await page.waitForTimeout(12000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcc-2.png' });

    // 7. 플로우 편집 화면 확인
    const url = page.url();
    console.log(`[7] URL: ${url}`);

    if (!url.includes('flow') && !url.includes('definition')) {
      console.log('   ⚠️ 플로우 생성 실패 - URL 이동 안됨');
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcc-error.png' });
      throw new Error('플로우 생성 실패');
    }
    console.log('   ✓ 플로우 편집 화면');

    // 8. Gmail 연결 확인
    console.log('[8] Gmail 연결...');
    await page.waitForTimeout(3000);

    // Sign in 버튼 있으면 클릭
    const signIn = page.locator('button:has-text("Sign in")').first();
    if (await signIn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('   Sign in 버튼 발견');
      await signIn.click();
      await page.waitForTimeout(5000);

      // Google 계정 선택 팝업
      const pages = context.pages();
      for (const p of pages) {
        if (p.url().includes('google.com') || p.url().includes('accounts.google')) {
          console.log('   Google 로그인 팝업');
          const account = p.locator('div[data-email="authpremoapi@gmail.com"]').first();
          if (await account.isVisible({ timeout: 8000 }).catch(() => false)) {
            await account.click();
            console.log('   ✓ authpremoapi@gmail.com 선택됨');
            await page.waitForTimeout(10000);
          }
        }
      }
    } else {
      console.log('   Gmail 이미 연결됨 또는 연결 패널 없음');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcc-3.png' });

    // 9. 트리거 카드 클릭 → Subject Filter
    console.log('[9] Subject Filter 설정...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // 트리거 카드 클릭
    const triggerCard = page.locator('[class*="msla-panel-card"], [data-automation-id*="gmail"]').first();
    if (await triggerCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await triggerCard.click();
      await page.waitForTimeout(2000);
    }

    // Show advanced options
    const advOpt = page.locator('text=/Show advanced/i, button:has-text("Show all")').first();
    if (await advOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
      await advOpt.click();
      await page.waitForTimeout(2000);
    }

    // Subject Filter 입력
    const subjFilter = page.locator('input[aria-label*="Subject"]').first();
    if (await subjFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await subjFilter.fill('[TO:');
      console.log('   ✓ Subject Filter: [TO:');
    } else {
      console.log('   Subject Filter 필드 못 찾음');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcc-4.png' });

    // 10. New step → Outlook 액션
    console.log('[10] Outlook 액션 추가...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // + 버튼 또는 New step
    const newStepBtn = page.locator('button:has-text("New step"), [aria-label*="Insert a new step"]').first();
    if (await newStepBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newStepBtn.click();
      await page.waitForTimeout(2000);
    } else {
      // 캔버스의 + 아이콘
      const plusIcon = page.locator('svg circle').first();
      if (await plusIcon.isVisible({ timeout: 3000 }).catch(() => false)) {
        await plusIcon.click();
        await page.waitForTimeout(2000);
      }
    }

    // Add an action
    const addAction = page.locator('button:has-text("Add an action"), text=/Add an action/i').first();
    if (await addAction.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addAction.click();
      await page.waitForTimeout(2000);
    }

    // Outlook Send 검색
    const actionSearch = page.locator('input[placeholder*="Search"]').last();
    if (await actionSearch.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionSearch.fill('Office 365 Outlook Send email V2');
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcc-5.png' });

    // Send an email (V2) 선택
    const sendEmailV2 = page.locator('text=Send an email (V2)').first();
    if (await sendEmailV2.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sendEmailV2.click();
      await page.waitForTimeout(4000);
      console.log('   ✓ Send an email (V2) 선택됨');
    } else {
      console.log('   ⚠️ Outlook 액션 못 찾음');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcc-6.png' });

    // 11. To 필드 - Expression
    console.log('[11] To Expression 설정...');
    const toField = page.locator('[aria-label="To"]').first();
    if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toField.click();
      await page.waitForTimeout(1500);

      // Expression 탭 클릭
      const exprTab = page.locator('button:has-text("Expression"), [role="tab"]:has-text("Expression")').first();
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
          console.log('   ✓ Expression 추가됨');
        }
      }
    } else {
      console.log('   To 필드 못 찾음');
    }

    // 12. Subject 필드 - Dynamic content
    console.log('[12] Subject 설정...');
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

      // Subject 동적 콘텐츠 선택
      const subjDyn = page.locator('button[aria-label="Subject"]').first();
      if (await subjDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await subjDyn.click();
        console.log('   ✓ Subject 동적 콘텐츠');
      }
    }

    // 13. Body 필드 - Dynamic content
    console.log('[13] Body 설정...');
    const bodyField = page.locator('[aria-label="Body"]').first();
    if (await bodyField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bodyField.click();
      await page.waitForTimeout(1000);

      // Dynamic content 탭
      const dynTab2 = page.locator('button:has-text("Dynamic")').first();
      if (await dynTab2.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dynTab2.click();
        await page.waitForTimeout(1000);
      }

      // Body 동적 콘텐츠 선택
      const bodyDyn = page.locator('button[aria-label="Body"]').first();
      if (await bodyDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await bodyDyn.click();
        console.log('   ✓ Body 동적 콘텐츠');
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcc-7.png' });

    // 14. Save
    console.log('[14] Save...');
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
      console.log('   ✓ 저장됨');
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcc-final.png' });
    console.log('\n✅ 플로우 생성 완료!');
    console.log('\n플로우 구성:');
    console.log('  트리거: Gmail - When a new email arrives');
    console.log('  필터: Subject contains [TO:');
    console.log('  액션: Outlook - Send an email (V2)');
    console.log('  To: Expression으로 Subject에서 이메일 추출');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcc-error.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await page.waitForTimeout(120000);
  await context.close();
}

main();
