/**
 * PA 플로우 설정 계속 - Gmail 연결 후 Outlook 액션 추가
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🔧 PA 플로우 설정 계속...\n');

  const userDataDir = 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data';

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'msedge',
    args: ['--start-maximized'],
    viewport: { width: 1400, height: 900 }
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    // 현재 페이지 확인
    console.log('[1] 현재 페이지 확인...');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc1.png' });

    const url = page.url();
    console.log(`   URL: ${url}`);

    // Gmail Sign in 버튼 확인
    console.log('[2] Gmail 연결 확인...');
    const signIn = page.locator('button:has-text("Sign in"), [aria-label*="Sign in"]').first();
    if (await signIn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('   Gmail Sign in 필요 - 클릭');
      await signIn.click();
      await page.waitForTimeout(8000);

      // Google 로그인 팝업 처리
      const allPages = context.pages();
      console.log(`   열린 페이지 수: ${allPages.length}`);

      for (const p of allPages) {
        const pUrl = p.url();
        console.log(`   - ${pUrl.substring(0, 50)}...`);

        if (pUrl.includes('accounts.google.com')) {
          console.log('   Google 로그인 페이지 발견');

          // 계정 선택
          const account = p.locator('text=authpremoapi@gmail.com, [data-email="authpremoapi@gmail.com"]').first();
          if (await account.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('   authpremoapi@gmail.com 계정 선택');
            await account.click();
            await page.waitForTimeout(5000);
          } else {
            // 이메일 입력
            const emailField = p.locator('input[type="email"]').first();
            if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
              console.log('   이메일 입력');
              await emailField.fill('authpremoapi@gmail.com');
              await p.locator('button:has-text("Next"), button:has-text("다음")').first().click();
              await page.waitForTimeout(5000);
            }
          }

          await p.screenshot({ path: '/home/kogh/.playwright-mcp/pc-google.png' });
        }
      }

      await page.waitForTimeout(3000);
    } else {
      console.log('   Gmail 이미 연결됨 또는 Sign in 버튼 없음');
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc2.png' });

    // Subject Filter 설정
    console.log('[3] Subject Filter...');
    const subjectInput = page.locator('input[placeholder*="Subject"], input[aria-label*="Subject Filter"]').first();
    if (await subjectInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await subjectInput.clear();
      await subjectInput.fill('[TO:');
      console.log('   Subject Filter 설정됨: [TO:');
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc3.png' });

    // + 버튼 또는 New step
    console.log('[4] New step 추가...');
    const plusBtn = page.locator('button[aria-label*="Insert"], button:has-text("+"), text=/New step|새 단계/i').first();
    if (await plusBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await plusBtn.click();
      await page.waitForTimeout(2000);
    }

    // Add an action 클릭
    const addAction = page.locator('text=/Add an action|작업 추가/i').first();
    if (await addAction.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addAction.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc4.png' });

    // Outlook 검색
    console.log('[5] Outlook Send email...');
    const searchAction = page.locator('input[placeholder*="Search"]').last();
    if (await searchAction.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchAction.fill('Office 365 Outlook Send');
      await page.waitForTimeout(2000);
    }

    // Send an email (V2) 선택
    const sendEmail = page.locator('text=/Send an email.*V2/i').first();
    if (await sendEmail.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sendEmail.click();
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc5.png' });

    // To 필드 수식 입력
    console.log('[6] To 필드 수식...');
    const toField = page.locator('input[aria-label*="To"], [aria-label="To"]').first();
    if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toField.click();
      await page.waitForTimeout(500);

      // Expression 탭
      const exprTab = page.locator('text=Expression, button:has-text("Expression")').first();
      if (await exprTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exprTab.click();
        await page.waitForTimeout(500);

        // fx 입력란
        const fxInput = page.locator('input[placeholder*="fx"], textarea').first();
        if (await fxInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await fxInput.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");
          console.log('   수식 입력됨');

          // Add/OK 버튼
          const addBtn = page.locator('button:has-text("Add"), button:has-text("OK")').first();
          if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await addBtn.click();
          }
        }
      }
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc6.png' });

    // Subject 필드 - 동적 콘텐츠
    console.log('[7] Subject 필드...');
    const subjField = page.locator('input[aria-label*="Subject"]').last();
    if (await subjField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await subjField.click();
      await page.waitForTimeout(500);

      const subjDynamic = page.locator('[aria-label="Subject"], text=Subject >> nth=1').first();
      if (await subjDynamic.isVisible({ timeout: 2000 }).catch(() => false)) {
        await subjDynamic.click();
      }
    }

    // Body 필드
    console.log('[8] Body 필드...');
    const bodyField = page.locator('[aria-label*="Body"]').first();
    if (await bodyField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bodyField.click();
      await page.waitForTimeout(500);

      const bodyDynamic = page.locator('text=Body >> nth=1').first();
      if (await bodyDynamic.isVisible({ timeout: 2000 }).catch(() => false)) {
        await bodyDynamic.click();
      }
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc7.png' });

    // Save
    console.log('[9] Save...');
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
      console.log('   저장됨');
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc-final.png' });

    console.log('\n✅ 설정 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pc-error.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await page.waitForTimeout(120000);
  await context.close();
}

main();
