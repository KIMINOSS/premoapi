/**
 * PA Gmail 플로우 전체 설정
 * - Gmail 트리거 (authpremoapi@gmail.com)
 * - Subject Filter: [TO:
 * - Outlook Send email 액션
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🚀 PA Gmail→Outlook 플로우 생성...\n');

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
    console.log('⚠️ Edge 프로필 충돌 - 기존 Edge 사용 중');
    console.log('   기존 Edge 닫고 다시 실행해주세요');
    process.exit(1);
  }

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. Create 페이지
    console.log('[1] Power Automate Create...');
    await page.goto('https://make.powerautomate.com/create', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pg1.png' });

    // 2. Automated cloud flow
    console.log('[2] Automated cloud flow 선택...');
    const automatedFlow = page.locator('text=Automated cloud flow').first();
    if (await automatedFlow.isVisible({ timeout: 10000 }).catch(() => false)) {
      await automatedFlow.click();
      await page.waitForTimeout(4000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pg2.png' });

    // 3. 플로우 이름 입력
    console.log('[3] 플로우 이름: PREMO-Gmail-Forward...');
    const nameInput = page.locator('input').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill('PREMO-Gmail-Forward');
      await page.waitForTimeout(1000);
    }

    // 4. Gmail 검색
    console.log('[4] Gmail 트리거 검색...');
    const searchInputs = await page.locator('input[placeholder*="Search"], input[placeholder*="search"]').all();
    for (const input of searchInputs) {
      if (await input.isVisible().catch(() => false)) {
        await input.fill('Gmail');
        await page.waitForTimeout(2000);
        break;
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pg3.png' });

    // 5. Gmail 커넥터 클릭
    console.log('[5] Gmail 커넥터 선택...');
    const gmailIcon = page.locator('[aria-label*="Gmail"], img[alt*="Gmail"], text=Gmail').first();
    if (await gmailIcon.isVisible({ timeout: 5000 }).catch(() => false)) {
      await gmailIcon.click();
      await page.waitForTimeout(2000);
    }

    // 6. "When a new email arrives" 트리거
    console.log('[6] When a new email arrives...');
    const trigger = page.locator('text=/When a new email arrives/i').first();
    if (await trigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await trigger.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pg4.png' });

    // 7. Create 버튼
    console.log('[7] Create 버튼 클릭...');
    const createBtn = page.locator('button:has-text("Create")').last();
    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const isDisabled = await createBtn.isDisabled();
      if (!isDisabled) {
        await createBtn.click();
        console.log('   Create 클릭됨');
        await page.waitForTimeout(8000);
      } else {
        console.log('   Create 버튼 비활성화 상태');
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pg5.png' });

    // 8. Gmail Sign in 처리
    console.log('[8] Gmail 연결 확인...');
    const signInBtn = page.locator('button:has-text("Sign in"), [aria-label*="Sign in"]').first();
    if (await signInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('   Gmail Sign in 필요 - 클릭');
      await signInBtn.click();
      await page.waitForTimeout(5000);

      // Google 로그인 팝업 처리
      const allPages = context.pages();
      console.log(`   열린 페이지: ${allPages.length}개`);

      for (const p of allPages) {
        const pUrl = p.url();
        if (pUrl.includes('accounts.google.com')) {
          console.log('   Google 로그인 페이지 발견');

          // 계정 선택
          const account = p.locator('div[data-email="authpremoapi@gmail.com"], text=authpremoapi@gmail.com').first();
          if (await account.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('   authpremoapi@gmail.com 선택');
            await account.click();
            await page.waitForTimeout(5000);
          } else {
            // 이메일 입력
            const emailInput = p.locator('input[type="email"]').first();
            if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
              await emailInput.fill('authpremoapi@gmail.com');
              await p.locator('button:has-text("Next"), button:has-text("다음")').first().click();
              await page.waitForTimeout(5000);
            }
          }
          await p.screenshot({ path: '/home/kogh/.playwright-mcp/pg-google.png' });
        }
      }
      await page.waitForTimeout(3000);
    } else {
      console.log('   Gmail 이미 연결됨 또는 Sign in 버튼 없음');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pg6.png' });

    // 9. Subject Filter 설정
    console.log('[9] Subject Filter: [TO:...');
    const subjectFilter = page.locator('input[aria-label*="Subject Filter"], input[placeholder*="Subject"]').first();
    if (await subjectFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await subjectFilter.clear();
      await subjectFilter.fill('[TO:');
      console.log('   Subject Filter 설정됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pg7.png' });

    // 10. New step 추가
    console.log('[10] New step 추가...');
    const newStepBtn = page.locator('button:has-text("New step"), button[aria-label*="Insert a new step"]').first();
    if (await newStepBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newStepBtn.click();
      await page.waitForTimeout(2000);
    } else {
      // + 버튼 찾기
      const plusBtn = page.locator('button:has-text("+")').first();
      if (await plusBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await plusBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    // Add an action
    const addAction = page.locator('text=/Add an action/i').first();
    if (await addAction.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addAction.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pg8.png' });

    // 11. Outlook 검색
    console.log('[11] Office 365 Outlook Send email...');
    const actionSearch = page.locator('input[placeholder*="Search"]').last();
    if (await actionSearch.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionSearch.fill('Office 365 Outlook Send');
      await page.waitForTimeout(3000);
    }

    // Send an email (V2) 선택
    const sendEmail = page.locator('text=/Send an email.*V2/i').first();
    if (await sendEmail.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sendEmail.click();
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pg9.png' });

    // 12. To 필드 - Expression
    console.log('[12] To 필드 Expression...');
    const toField = page.locator('[aria-label="To"], input[aria-label*="To"]').first();
    if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toField.click();
      await page.waitForTimeout(1000);

      // Expression 탭
      const exprTab = page.locator('button:has-text("Expression"), text=Expression').first();
      if (await exprTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exprTab.click();
        await page.waitForTimeout(500);

        // fx 입력
        const fxInput = page.locator('input[placeholder*="fx"], textarea[placeholder*="fx"], input[aria-label*="Function"]').first();
        if (await fxInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await fxInput.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");
          console.log('   To Expression 입력됨');

          // Add 버튼
          const addBtn = page.locator('button:has-text("Add"), button:has-text("OK")').first();
          if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await addBtn.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pg10.png' });

    // 13. Subject - Dynamic content
    console.log('[13] Subject 필드...');
    const subjField = page.locator('[aria-label="Subject"], input[aria-label*="Subject"]').last();
    if (await subjField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await subjField.click();
      await page.waitForTimeout(1000);

      // Dynamic content 탭
      const dynTab = page.locator('button:has-text("Dynamic content"), text=Dynamic content').first();
      if (await dynTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dynTab.click();
        await page.waitForTimeout(500);
      }

      // Subject 선택
      const subjDyn = page.locator('[aria-label="Subject"], text=Subject >> nth=0').first();
      if (await subjDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await subjDyn.click();
        console.log('   Subject 동적 콘텐츠 선택됨');
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pg11.png' });

    // 14. Body - Dynamic content
    console.log('[14] Body 필드...');
    const bodyField = page.locator('[aria-label="Body"], [aria-label*="Body"]').first();
    if (await bodyField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bodyField.click();
      await page.waitForTimeout(1000);

      // Dynamic content
      const dynTab2 = page.locator('button:has-text("Dynamic content"), text=Dynamic content').first();
      if (await dynTab2.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dynTab2.click();
        await page.waitForTimeout(500);
      }

      // Body 선택
      const bodyDyn = page.locator('[aria-label="Body"], text=Body >> nth=0').first();
      if (await bodyDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await bodyDyn.click();
        console.log('   Body 동적 콘텐츠 선택됨');
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pg12.png' });

    // 15. Save
    console.log('[15] Save...');
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
      console.log('   저장됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pg-final.png' });

    console.log('\n✅ PA 플로우 생성 완료!');
    console.log('   스크린샷: pg1.png ~ pg-final.png');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pg-error.png' });
  }

  console.log('\n⏳ 브라우저 300초 유지 (수동 확인/수정 가능)...');
  await page.waitForTimeout(300000);
  await context.close();
}

main();
