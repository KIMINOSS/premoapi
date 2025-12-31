/**
 * PA PREMO-Gmail-Relay 플로우 편집 - Gmail 연결 + Outlook 액션
 */
const { chromium } = require('playwright');

async function main() {
  console.log('✏️ PREMO-Gmail-Relay 플로우 편집...\n');

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
    // 1. My flows
    console.log('[1] My flows...');
    await page.goto('https://make.powerautomate.com/manage/flows', { timeout: 60000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pe-1.png' });

    // 2. PREMO-Gmail-Relay 찾기
    console.log('[2] PREMO-Gmail-Relay 찾기...');
    let flowFound = false;

    // 직접 찾기
    const flowLink = page.locator('a:has-text("PREMO-Gmail-Relay")').first();
    if (await flowLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await flowLink.click();
      flowFound = true;
      console.log('   ✓ 플로우 클릭됨');
    } else {
      // 검색
      const searchBtn = page.locator('[aria-label="Search"], button:has-text("Search")').first();
      if (await searchBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchBtn.click();
        await page.waitForTimeout(1000);
      }

      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill('PREMO-Gmail-Relay');
        await page.waitForTimeout(3000);

        const result = page.locator('a:has-text("PREMO-Gmail-Relay")').first();
        if (await result.isVisible({ timeout: 5000 }).catch(() => false)) {
          await result.click();
          flowFound = true;
          console.log('   ✓ 검색 후 플로우 클릭됨');
        }
      }
    }

    if (!flowFound) {
      console.log('   ⚠️ 플로우 못 찾음 - 목록 확인');
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pe-notfound.png' });
    }
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pe-2.png' });

    // 3. Edit 버튼
    console.log('[3] Edit 모드...');
    const editBtn = page.locator('button:has-text("Edit")').first();
    if (await editBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(8000);
      console.log('   ✓ Edit 클릭됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pe-3.png' });

    // 4. Gmail 연결 수정
    console.log('[4] Gmail 연결 수정...');

    // Gmail 카드 클릭
    const gmailCard = page.locator('text=/When a new email arrives/i').first();
    if (await gmailCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await gmailCard.click();
      await page.waitForTimeout(2000);
      console.log('   Gmail 카드 클릭됨');
    }

    // "Change connection" 또는 경고 메시지에서 연결 변경
    const changeConn = page.locator('button:has-text("Change connection"), a:has-text("Change connection")').first();
    if (await changeConn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await changeConn.click();
      await page.waitForTimeout(2000);
    }

    // 기존 Gmail 연결 선택 또는 새 연결
    const gmailConn = page.locator('[role="option"]:has-text("gmail"), [role="listitem"]:has-text("gmail")').first();
    if (await gmailConn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await gmailConn.click();
      console.log('   ✓ Gmail 연결 선택됨');
      await page.waitForTimeout(2000);
    } else {
      // Sign in 버튼
      const signIn = page.locator('button:has-text("Sign in")').first();
      if (await signIn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await signIn.click();
        console.log('   Sign in 클릭 - Google 로그인 대기...');
        await page.waitForTimeout(10000);

        // Google 계정 선택
        const pages = context.pages();
        for (const p of pages) {
          if (p.url().includes('google.com')) {
            const account = p.locator('div[data-email="authpremoapi@gmail.com"]').first();
            if (await account.isVisible({ timeout: 5000 }).catch(() => false)) {
              await account.click();
              console.log('   ✓ Google 계정 선택됨');
              await page.waitForTimeout(8000);
            }
          }
        }
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pe-4.png' });

    // 5. + 버튼 클릭 → Outlook 액션 추가
    console.log('[5] Outlook 액션 추가...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // + 아이콘 (캔버스에서)
    const plusBtn = page.locator('[class*="edge-button"], button[aria-label*="Insert"], svg.fa-plus').first();
    if (await plusBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await plusBtn.click();
      await page.waitForTimeout(2000);
    } else {
      // 캔버스의 + 원형 아이콘
      await page.click('svg circle').catch(() => {});
      await page.waitForTimeout(2000);
    }

    // Add an action
    const addAction = page.locator('button:has-text("Add an action")').first();
    if (await addAction.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addAction.click();
      await page.waitForTimeout(2000);
    }

    // Office 365 Outlook 검색
    const searchAction = page.locator('input[placeholder*="Search"]').last();
    if (await searchAction.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchAction.fill('Office 365 Outlook');
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pe-5.png' });

    // Office 365 Outlook Connector 클릭
    console.log('[6] Office 365 Outlook Connector...');
    const outlookConnector = page.locator('text=Office 365 Outlook').first();
    if (await outlookConnector.isVisible({ timeout: 5000 }).catch(() => false)) {
      await outlookConnector.click();
      await page.waitForTimeout(3000);
      console.log('   ✓ Outlook Connector 선택됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pe-6.png' });

    // Send an email (V2) 선택
    console.log('[7] Send an email (V2)...');
    const sendEmail = page.locator('text=Send an email (V2)').first();
    if (await sendEmail.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sendEmail.click();
      await page.waitForTimeout(4000);
      console.log('   ✓ Send an email (V2) 선택됨');
    } else {
      // 검색으로 찾기
      const actionSearch2 = page.locator('input[placeholder*="Search"]').last();
      if (await actionSearch2.isVisible({ timeout: 2000 }).catch(() => false)) {
        await actionSearch2.fill('Send an email');
        await page.waitForTimeout(2000);
        const sendEmail2 = page.locator('text=Send an email (V2)').first();
        if (await sendEmail2.isVisible({ timeout: 3000 }).catch(() => false)) {
          await sendEmail2.click();
          await page.waitForTimeout(4000);
          console.log('   ✓ Send an email (V2) 선택됨 (검색)');
        }
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pe-7.png' });

    // 8. To 필드 - Expression
    console.log('[8] To Expression...');
    const toField = page.locator('[aria-label="To"]').first();
    if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toField.click();
      await page.waitForTimeout(1500);

      // Expression 탭
      const exprTab = page.locator('button:has-text("Expression")').first();
      if (await exprTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exprTab.click();
        await page.waitForTimeout(1000);
      }

      // fx 입력
      const fxInput = page.locator('textarea').first();
      if (await fxInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fxInput.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");

        const addBtn = page.locator('button:has-text("Add")').first();
        if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await addBtn.click();
          await page.waitForTimeout(1500);
          console.log('   ✓ To Expression 추가됨');
        }
      }
    }

    // 9. Subject - Dynamic content
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

      const subjDyn = page.locator('button[aria-label="Subject"]').first();
      if (await subjDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await subjDyn.click();
        console.log('   ✓ Subject 동적 콘텐츠');
      }
    }

    // 10. Body - Dynamic content
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

      const bodyDyn = page.locator('button[aria-label="Body"]').first();
      if (await bodyDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await bodyDyn.click();
        console.log('   ✓ Body 동적 콘텐츠');
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pe-8.png' });

    // 11. Save
    console.log('[11] Save...');
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
      console.log('   ✓ 저장됨');
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pe-final.png' });
    console.log('\n✅ 플로우 편집 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pe-error.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await page.waitForTimeout(120000);
  await context.close();
}

main();
