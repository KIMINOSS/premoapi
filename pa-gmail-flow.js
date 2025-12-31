/**
 * PA Gmail 플로우 생성 - 단계별 정확한 설정
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🤖 PA Gmail 플로우 생성...\n');

  const userDataDir = 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data';

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'msedge',
    args: ['--start-maximized'],
    viewport: { width: 1400, height: 900 }
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. Create 페이지
    console.log('[1] Create 페이지...');
    await page.goto('https://make.powerautomate.com/create', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(5000);

    // 2. Automated cloud flow
    console.log('[2] Automated cloud flow 선택...');
    const automated = page.locator('text=Automated cloud flow').first();
    await automated.click({ timeout: 10000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-s1.png' });

    // 3. 플로우 이름 입력 (첫번째 input)
    console.log('[3] 플로우 이름 입력...');
    const nameField = page.locator('input[placeholder*="name"], input[aria-label*="Flow name"]').first();
    if (await nameField.isVisible({ timeout: 5000 })) {
      await nameField.clear();
      await nameField.fill('PREMO-Auth-Forward');
    }
    await page.waitForTimeout(1000);

    // 4. Gmail 트리거 검색 - 정확한 검색창 찾기
    console.log('[4] Gmail 트리거 검색...');

    // "Choose your flow's trigger" 아래의 검색창
    const triggerSearch = page.locator('input[placeholder*="Search"]').last();
    await triggerSearch.click();
    await triggerSearch.fill('Gmail when new email');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-s2.png' });

    // 5. Gmail 트리거 선택
    console.log('[5] Gmail 트리거 클릭...');
    const gmailTrigger = page.locator('text=When a new email arrives').first();
    if (await gmailTrigger.isVisible({ timeout: 5000 })) {
      await gmailTrigger.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-s3.png' });

    // 6. Create 버튼
    console.log('[6] Create 클릭...');
    const createBtn = page.locator('button:has-text("Create")').first();
    await createBtn.click({ timeout: 5000 });
    await page.waitForTimeout(10000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-s4.png' });

    // 7. Gmail 연결 확인
    console.log('[7] Gmail 연결...');

    // Sign in 버튼 찾기
    const signIn = page.locator('button:has-text("Sign in"), text=Sign in').first();
    if (await signIn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('   Sign in 클릭...');
      await signIn.click();
      await page.waitForTimeout(5000);

      // 팝업 처리
      const allPages = context.pages();
      if (allPages.length > 1) {
        const popup = allPages[allPages.length - 1];
        console.log('   Google 로그인 팝업 발견');

        // authpremoapi@gmail.com 선택 또는 입력
        const accountOption = popup.locator('text=authpremoapi@gmail.com').first();
        if (await accountOption.isVisible({ timeout: 5000 }).catch(() => false)) {
          await accountOption.click();
        } else {
          // 이메일 입력
          const emailField = popup.locator('input[type="email"]').first();
          if (await emailField.isVisible({ timeout: 5000 }).catch(() => false)) {
            await emailField.fill('authpremoapi@gmail.com');
            await popup.locator('button:has-text("Next"), button:has-text("다음")').first().click();
          }
        }
        await page.waitForTimeout(5000);

        await popup.screenshot({ path: '/home/kogh/.playwright-mcp/pa-google.png' });
      }
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-s5.png' });

    // 8. Subject Filter 입력
    console.log('[8] Subject Filter...');
    const subjectInput = page.locator('input[aria-label*="Subject"], input[placeholder*="Subject"]').first();
    if (await subjectInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await subjectInput.fill('[TO:');
    }
    await page.waitForTimeout(1000);

    // 9. New step 추가
    console.log('[9] New step...');
    const newStep = page.locator('button:has-text("New step"), text=New step').first();
    if (await newStep.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newStep.click();
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-s6.png' });

    // 10. Outlook 액션 검색
    console.log('[10] Outlook Send email 검색...');
    const actionSearch = page.locator('input[placeholder*="Search"]').last();
    if (await actionSearch.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionSearch.fill('Office 365 Outlook Send');
      await page.waitForTimeout(2000);
    }

    // Send an email (V2) 선택
    const sendEmail = page.locator('text=Send an email (V2)').first();
    if (await sendEmail.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sendEmail.click();
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-s7.png' });

    // 11. To 필드 - Expression 입력
    console.log('[11] To 필드 수식...');
    const toInput = page.locator('input[aria-label*="To"]').first();
    if (await toInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toInput.click();
      await page.waitForTimeout(500);

      // Expression 탭
      const exprTab = page.locator('button:has-text("Expression"), text=Expression').first();
      if (await exprTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exprTab.click();
        await page.waitForTimeout(500);

        // 수식 입력 필드
        const exprField = page.locator('textarea').first();
        await exprField.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");
        await page.waitForTimeout(500);

        // OK/추가 버튼
        const okBtn = page.locator('button:has-text("OK"), button:has-text("Add")').first();
        if (await okBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await okBtn.click();
        }
      }
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-s8.png' });

    // 12. Subject - Dynamic content
    console.log('[12] Subject 필드...');
    const subjInput = page.locator('input[aria-label*="Subject"]').last();
    if (await subjInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await subjInput.click();
      await page.waitForTimeout(500);

      // Dynamic content 탭
      const dynTab = page.locator('button:has-text("Dynamic content")').first();
      if (await dynTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dynTab.click();
        await page.waitForTimeout(500);
      }

      // Subject 선택
      const subjOption = page.locator('[aria-label*="Subject"], text=Subject').first();
      if (await subjOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await subjOption.click();
      }
    }

    // 13. Body - Dynamic content
    console.log('[13] Body 필드...');
    const bodyInput = page.locator('[aria-label*="Body"]').first();
    if (await bodyInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bodyInput.click();
      await page.waitForTimeout(500);

      const bodyOption = page.locator('text=Body').first();
      if (await bodyOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await bodyOption.click();
      }
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-s9.png' });

    // 14. Save
    console.log('[14] Save...');
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-done.png' });

    console.log('\n✅ 플로우 설정 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-err.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await page.waitForTimeout(120000);
  await context.close();
}

main();
