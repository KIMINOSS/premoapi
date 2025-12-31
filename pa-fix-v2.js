/**
 * PA Gmail 플로우 완성 v2 - 별도 프로필 사용
 */
const { chromium } = require('playwright');
const path = require('path');
const os = require('os');

async function main() {
  console.log('🔧 PA Gmail 플로우 완성 v2...\n');

  // 별도의 User Data 디렉토리 사용
  const userDataDir = path.join(os.homedir(), '.playwright-edge-data');
  console.log(`프로필 경로: ${userDataDir}`);

  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: 'msedge',
      args: ['--start-maximized'],
      viewport: { width: 1400, height: 900 }
    });
    console.log('✓ Edge 시작됨');
  } catch (err) {
    console.log('⚠️ Edge 시작 실패:', err.message);
    process.exit(1);
  }

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. Power Automate 홈
    console.log('[1] Power Automate 홈...');
    await page.goto('https://make.powerautomate.com', { timeout: 60000 });
    await page.waitForTimeout(8000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf2-1.png' });

    // 로그인 필요 여부 확인
    const url = page.url();
    console.log(`   URL: ${url}`);

    if (url.includes('login') || url.includes('signin')) {
      console.log('   ⚠️ 로그인 필요 - 수동 로그인 대기...');
      await page.waitForTimeout(60000); // 1분 대기
    }

    // My flows로 이동
    console.log('[2] My flows...');
    await page.goto('https://make.powerautomate.com/manage/flows', { timeout: 60000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf2-2.png' });

    // PREMO-Gmail-Relay 찾기
    console.log('[3] PREMO-Gmail-Relay 찾기...');
    const flowLink = page.locator('a:has-text("PREMO-Gmail-Relay"), text=PREMO-Gmail-Relay').first();
    if (await flowLink.isVisible({ timeout: 10000 }).catch(() => false)) {
      await flowLink.click();
      console.log('   ✓ 플로우 클릭됨');
      await page.waitForTimeout(5000);
    } else {
      console.log('   플로우 검색...');
      const searchBox = page.locator('input[placeholder*="Search"], input[type="search"]').first();
      if (await searchBox.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchBox.fill('PREMO-Gmail-Relay');
        await page.waitForTimeout(3000);
        const result = page.locator('text=PREMO-Gmail-Relay').first();
        if (await result.isVisible({ timeout: 5000 }).catch(() => false)) {
          await result.click();
          await page.waitForTimeout(5000);
        }
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf2-3.png' });

    // Edit 클릭
    console.log('[4] Edit...');
    const editBtn = page.locator('button:has-text("Edit")').first();
    if (await editBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(8000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf2-4.png' });

    // Gmail 트리거 카드 클릭
    console.log('[5] Gmail 연결 수정...');
    const gmailCard = page.locator('[data-automation-id*="gmail"], text=/When a new email arrives/i').first();
    if (await gmailCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await gmailCard.click();
      await page.waitForTimeout(2000);
    }

    // Change connection
    const changeConn = page.locator('button:has-text("Change connection"), text=/Change connection/i').first();
    if (await changeConn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await changeConn.click();
      await page.waitForTimeout(3000);

      // 기존 연결 선택
      const existingConn = page.locator('[role="option"], [role="listitem"]').filter({ hasText: /gmail/i }).first();
      if (await existingConn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await existingConn.click();
        console.log('   ✓ Gmail 연결 선택됨');
        await page.waitForTimeout(2000);
      } else {
        // 새 연결 생성
        const addNew = page.locator('button:has-text("Add new"), text=/Add new/i').first();
        if (await addNew.isVisible({ timeout: 3000 }).catch(() => false)) {
          await addNew.click();
          await page.waitForTimeout(3000);

          // Sign in
          const signIn = page.locator('button:has-text("Sign in")').first();
          if (await signIn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await signIn.click();
            await page.waitForTimeout(8000);

            // Google 계정 선택
            const pages = context.pages();
            for (const p of pages) {
              if (p.url().includes('google.com')) {
                const account = p.locator('div[data-email="authpremoapi@gmail.com"]').first();
                if (await account.isVisible({ timeout: 8000 }).catch(() => false)) {
                  await account.click();
                  await page.waitForTimeout(10000);
                }
              }
            }
          }
        }
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf2-5.png' });

    // Subject Filter 설정
    console.log('[6] Subject Filter...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    const triggerCard = page.locator('[class*="card"]').first();
    await triggerCard.click().catch(() => {});
    await page.waitForTimeout(1500);

    const showAdv = page.locator('text=/Show advanced/i, button:has-text("Show all")').first();
    if (await showAdv.isVisible({ timeout: 3000 }).catch(() => false)) {
      await showAdv.click();
      await page.waitForTimeout(2000);
    }

    const subjFilter = page.locator('input[aria-label*="Subject"], input[name*="subject" i]').first();
    if (await subjFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await subjFilter.fill('[TO:');
      console.log('   ✓ [TO:');
    }

    // Outlook 액션 추가
    console.log('[7] Outlook 액션...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // + 버튼 클릭
    const plusBtn = page.locator('button[aria-label*="Insert"], button:has-text("New step"), svg.plus').first();
    await plusBtn.click().catch(async () => {
      // 캔버스의 + 아이콘
      await page.click('svg >> circle').catch(() => {});
    });
    await page.waitForTimeout(2000);

    // Add an action
    const addAction = page.locator('button:has-text("Add an action")').first();
    if (await addAction.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addAction.click();
      await page.waitForTimeout(2000);
    }

    // Outlook 검색
    const searchAction = page.locator('input[placeholder*="Search"]').last();
    if (await searchAction.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchAction.fill('Office 365 Outlook Send email V2');
      await page.waitForTimeout(3000);
    }

    // Send an email (V2) 선택
    const sendEmail = page.locator('text=Send an email (V2)').first();
    if (await sendEmail.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sendEmail.click();
      await page.waitForTimeout(4000);
      console.log('   ✓ Outlook 액션 추가됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf2-6.png' });

    // To 필드 Expression
    console.log('[8] To Expression...');
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
          console.log('   ✓ Expression 추가됨');
        }
      }
    }

    // Subject/Body 동적 콘텐츠
    console.log('[9] Subject/Body...');
    const subjField = page.locator('[aria-label="Subject"]').last();
    if (await subjField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await subjField.click();
      await page.waitForTimeout(1000);

      const dynTab = page.locator('button:has-text("Dynamic")').first();
      await dynTab.click().catch(() => {});
      await page.waitForTimeout(500);

      const subjDyn = page.locator('button[aria-label="Subject"]').first();
      await subjDyn.click().catch(() => {});
    }

    const bodyField = page.locator('[aria-label="Body"]').first();
    if (await bodyField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bodyField.click();
      await page.waitForTimeout(1000);

      const dynTab2 = page.locator('button:has-text("Dynamic")').first();
      await dynTab2.click().catch(() => {});
      await page.waitForTimeout(500);

      const bodyDyn = page.locator('button[aria-label="Body"]').first();
      await bodyDyn.click().catch(() => {});
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf2-7.png' });

    // Save
    console.log('[10] Save...');
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
      console.log('   ✓ 저장됨');
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf2-final.png' });
    console.log('\n✅ 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf2-error.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await page.waitForTimeout(120000);
  await context.close();
}

main();
