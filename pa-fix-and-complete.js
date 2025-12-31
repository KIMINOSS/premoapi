/**
 * PA Gmail 플로우 완성 - Gmail 연결 수정 + Outlook 액션 추가
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🔧 PA Gmail 플로우 완성...\n');

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
    console.log('⚠️ Edge 시작 실패:');
    console.log('   에러:', err.message);
    console.log('   상세:', err.stack?.split('\n')[1] || '');
    process.exit(1);
  }

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. My flows에서 PREMO-Gmail-Relay 찾기
    console.log('[1] My flows 페이지...');
    await page.goto('https://make.powerautomate.com/environments/Default-ef30448f-b0ea-4625-99b6-991583884a18/solutions/fd140aae-4df4-e411-80c0-00aa0047ba86/flows', { timeout: 60000 });
    await page.waitForTimeout(5000);

    // 또는 직접 플로우 페이지로
    console.log('[2] 플로우 목록 확인...');
    await page.goto('https://make.powerautomate.com/manage/flows', { timeout: 60000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf-1.png' });

    // PREMO-Gmail-Relay 플로우 찾기
    console.log('[3] PREMO-Gmail-Relay 찾기...');
    const flowLink = page.locator('text=PREMO-Gmail-Relay').first();
    if (await flowLink.isVisible({ timeout: 10000 }).catch(() => false)) {
      await flowLink.click();
      console.log('   ✓ 플로우 클릭됨');
      await page.waitForTimeout(5000);
    } else {
      console.log('   플로우 못 찾음 - 검색 시도');
      const searchBox = page.locator('input[placeholder*="Search"]').first();
      if (await searchBox.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchBox.fill('PREMO-Gmail-Relay');
        await page.waitForTimeout(3000);
        const result = page.locator('text=PREMO-Gmail-Relay').first();
        if (await result.isVisible({ timeout: 5000 }).catch(() => false)) {
          await result.click();
          await page.waitForTimeout(5000);
        }
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf-2.png' });

    // Edit 버튼 클릭
    console.log('[4] Edit 모드...');
    const editBtn = page.locator('button:has-text("Edit")').first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(8000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf-3.png' });

    // Gmail 카드 클릭 - 연결 수정
    console.log('[5] Gmail 연결 수정...');
    const gmailCard = page.locator('[class*="msla-panel-card"], [class*="card"]').first();
    if (await gmailCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await gmailCard.click();
      await page.waitForTimeout(2000);
    }

    // Change connection 또는 Sign in 버튼 찾기
    const changeConn = page.locator('text=/Change connection|Sign in|Connect/i').first();
    if (await changeConn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('   연결 변경 버튼 발견');
      await changeConn.click();
      await page.waitForTimeout(3000);

      // 기존 연결 선택 또는 새 연결
      const existingConn = page.locator('text=/authpremoapi@gmail.com|Gmail/i').first();
      if (await existingConn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await existingConn.click();
        console.log('   ✓ 기존 Gmail 연결 선택됨');
        await page.waitForTimeout(2000);
      } else {
        // Sign in with Google
        const signInGoogle = page.locator('button:has-text("Sign in"), button:has-text("Connect")').first();
        if (await signInGoogle.isVisible({ timeout: 3000 }).catch(() => false)) {
          await signInGoogle.click();
          await page.waitForTimeout(5000);

          // Google 계정 선택 팝업 처리
          const pages = context.pages();
          for (const p of pages) {
            if (p.url().includes('google.com') || p.url().includes('accounts.google')) {
              console.log('   Google 로그인 팝업');
              const account = p.locator('div[data-email="authpremoapi@gmail.com"]').first();
              if (await account.isVisible({ timeout: 8000 }).catch(() => false)) {
                await account.click();
                console.log('   ✓ authpremoapi@gmail.com 선택됨');
                await page.waitForTimeout(8000);
              }
            }
          }
        }
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf-4.png' });

    // Subject Filter 설정
    console.log('[6] Subject Filter 설정...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    const triggerCard = page.locator('[class*="msla-panel-card"]').first();
    if (await triggerCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await triggerCard.click();
      await page.waitForTimeout(2000);
    }

    // Show advanced options
    const advOpt = page.locator('text=/Show advanced/i, button:has-text("Show all")').first();
    if (await advOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
      await advOpt.click();
      await page.waitForTimeout(2000);
    }

    const subjFilter = page.locator('input[aria-label*="Subject"]').first();
    if (await subjFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await subjFilter.fill('[TO:');
      console.log('   ✓ Subject Filter: [TO:');
    }

    // New step - Outlook 액션 추가
    console.log('[7] Outlook 액션 추가...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // + 버튼 또는 New step 클릭
    const plusBtn = page.locator('[class*="edge-button"], button[aria-label*="Insert"], button:has-text("New step")').first();
    if (await plusBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await plusBtn.click();
      await page.waitForTimeout(2000);
    } else {
      // 캔버스의 + 아이콘 클릭
      const addIcon = page.locator('svg circle, [class*="add-button"]').first();
      if (await addIcon.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addIcon.click();
        await page.waitForTimeout(2000);
      }
    }

    // Add an action
    const addAction = page.locator('button:has-text("Add an action"), text=/Add an action/i').first();
    if (await addAction.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addAction.click();
      await page.waitForTimeout(2000);
    }

    // Office 365 Outlook 검색
    const actionSearch = page.locator('input[placeholder*="Search"]').last();
    if (await actionSearch.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionSearch.fill('Office 365 Outlook Send email V2');
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf-5.png' });

    // Send an email (V2) 선택
    const sendEmailV2 = page.locator('text=Send an email (V2)').first();
    if (await sendEmailV2.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sendEmailV2.click();
      await page.waitForTimeout(4000);
      console.log('   ✓ Send an email (V2) 선택됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf-6.png' });

    // To 필드 - Expression 입력
    console.log('[8] To Expression 설정...');
    const toField = page.locator('[aria-label="To"], input[name*="to" i]').first();
    if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toField.click();
      await page.waitForTimeout(1500);

      // Expression 탭
      const exprTab = page.locator('button:has-text("Expression"), [role="tab"]:has-text("Expression")').first();
      if (await exprTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exprTab.click();
        await page.waitForTimeout(1000);
      }

      // fx 입력
      const fxInput = page.locator('textarea, input[type="text"]').last();
      if (await fxInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fxInput.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");
        console.log('   ✓ Expression 입력됨');

        // Add 버튼
        const addBtn = page.locator('button:has-text("Add"), button:has-text("OK")').first();
        if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await addBtn.click();
          await page.waitForTimeout(1500);
          console.log('   ✓ Expression 추가됨');
        }
      }
    }

    // Subject 필드 - Dynamic content
    console.log('[9] Subject 설정...');
    const subjField = page.locator('[aria-label="Subject"]').last();
    if (await subjField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await subjField.click();
      await page.waitForTimeout(1000);

      // Dynamic content 탭
      const dynTab = page.locator('button:has-text("Dynamic"), [role="tab"]:has-text("Dynamic")').first();
      if (await dynTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dynTab.click();
        await page.waitForTimeout(1000);
      }

      // Subject 동적 콘텐츠
      const subjDyn = page.locator('button[aria-label*="Subject"], text=Subject').first();
      if (await subjDyn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await subjDyn.click();
        console.log('   ✓ Subject 동적 콘텐츠');
      }
    }

    // Body 필드 - Dynamic content
    console.log('[10] Body 설정...');
    const bodyField = page.locator('[aria-label="Body"]').first();
    if (await bodyField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bodyField.click();
      await page.waitForTimeout(1000);

      // Dynamic content 탭
      const dynTab2 = page.locator('button:has-text("Dynamic"), [role="tab"]:has-text("Dynamic")').first();
      if (await dynTab2.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dynTab2.click();
        await page.waitForTimeout(1000);
      }

      // Body 동적 콘텐츠
      const bodyDyn = page.locator('button[aria-label*="Body"], text=Body').first();
      if (await bodyDyn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await bodyDyn.click();
        console.log('   ✓ Body 동적 콘텐츠');
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf-7.png' });

    // Save
    console.log('[11] Save...');
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
      console.log('   ✓ 저장됨');
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf-final.png' });
    console.log('\n✅ 플로우 완성!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf-error.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await page.waitForTimeout(120000);
  await context.close();
}

main();
