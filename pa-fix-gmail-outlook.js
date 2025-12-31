/**
 * PA Gmail-Outlook-Relay 플로우 수정
 * 1. Gmail 연결 수정
 * 2. Outlook 액션 추가 (Connector 먼저 선택)
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🔧 Gmail-Outlook-Relay 플로우 수정...\n');

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
    // 1. 플로우 편집 페이지로 직접 이동 (이전 세션에서 생성된 플로우)
    console.log('[1] 플로우 목록...');
    await page.goto('https://make.powerautomate.com/manage/flows', { timeout: 60000 });
    await page.waitForTimeout(5000);

    // 2. Gmail-Outlook-Relay 또는 최근 생성된 플로우 찾기
    console.log('[2] 플로우 검색...');

    // 검색
    const searchBtn = page.locator('button[aria-label="Search"], [aria-label="Search"]').first();
    if (await searchBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchBtn.click();
      await page.waitForTimeout(1000);
    }

    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Gmail');
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pfg-1.png' });

    // Gmail-Outlook-Relay 또는 PREMO-Gmail-Auth 클릭
    let flowClicked = false;
    const gmailRelayFlow = page.locator('a:has-text("Gmail-Outlook-Relay")').first();
    if (await gmailRelayFlow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await gmailRelayFlow.click();
      flowClicked = true;
      console.log('   ✓ Gmail-Outlook-Relay 클릭됨');
    } else {
      // PREMO-Gmail-Auth 사용
      const premoFlow = page.locator('a:has-text("PREMO-Gmail-Auth")').first();
      if (await premoFlow.isVisible({ timeout: 3000 }).catch(() => false)) {
        await premoFlow.click();
        flowClicked = true;
        console.log('   ✓ PREMO-Gmail-Auth 클릭됨');
      }
    }

    if (!flowClicked) {
      console.log('   플로우 못 찾음 - 새로 생성');
      // 새로 생성하러 이동
      await page.goto('https://make.powerautomate.com/create', { timeout: 60000 });
      await page.waitForTimeout(5000);

      // Automated cloud flow
      await page.click('text=Automated cloud flow');
      await page.waitForTimeout(5000);

      // 이름 입력
      const nameInput = page.locator('[role="dialog"] input').first();
      await nameInput.fill('Gmail-Relay-Final');

      // Gmail 검색
      const searchTrigger = page.locator('[role="dialog"] input').nth(1);
      await searchTrigger.fill('Gmail when new');
      await page.waitForTimeout(3000);

      // Gmail 트리거 선택
      await page.locator('[data-test*="shared_gmail"][data-test*="OnNewEmail"]').first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(2000);

      // Create
      await page.locator('[data-test="flow-modal-create-button"]').first().click({ force: true });
      await page.waitForTimeout(12000);
    } else {
      await page.waitForTimeout(5000);

      // Edit 클릭
      console.log('[3] Edit 모드...');
      const editBtn = page.locator('button:has-text("Edit")').first();
      if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(8000);
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pfg-2.png' });

    // 3. Gmail 연결 수정
    console.log('[4] Gmail 연결 수정...');

    // "Change connection" 링크 찾기
    const changeConn = page.locator('a:has-text("Change connection"), text=Change connection').first();
    if (await changeConn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await changeConn.click();
      await page.waitForTimeout(2000);
      console.log('   Change connection 클릭됨');

      // 연결 목록에서 선택
      const connOption = page.locator('[role="option"], [role="listitem"], [class*="connection"]').first();
      if (await connOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await connOption.click();
        console.log('   ✓ Gmail 연결 선택됨');
        await page.waitForTimeout(3000);
      } else {
        // Add new connection
        const addNew = page.locator('button:has-text("Add new"), text=/Add new/i').first();
        if (await addNew.isVisible({ timeout: 3000 }).catch(() => false)) {
          await addNew.click();
          await page.waitForTimeout(3000);

          // Sign in
          const signIn = page.locator('button:has-text("Sign in")').first();
          if (await signIn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await signIn.click();
            console.log('   Google 로그인 대기...');
            await page.waitForTimeout(15000);
          }
        }
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pfg-3.png' });

    // 4. 기존 Outlook 액션이 있는지 확인
    console.log('[5] Outlook 액션 확인/추가...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    const outlookAction = page.locator('text=/Send an email/i').first();
    const hasOutlook = await outlookAction.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasOutlook) {
      console.log('   Outlook 액션 추가 중...');

      // + 버튼 클릭
      const plusBtn = page.locator('button:has-text("New step"), button[aria-label*="Insert"]').first();
      if (await plusBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await plusBtn.click();
        await page.waitForTimeout(2000);
      } else {
        // 캔버스의 + 클릭
        await page.locator('[class*="plus"], [class*="add-button"]').first().click({ force: true }).catch(() => {});
        await page.waitForTimeout(2000);
      }

      // Add an action
      const addAction = page.locator('button:has-text("Add an action")').first();
      if (await addAction.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addAction.click();
        await page.waitForTimeout(2000);
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pfg-4.png' });

      // Office 365 Outlook Connector 검색
      console.log('[6] Outlook Connector 선택...');
      const actionSearch = page.locator('input[placeholder*="Search"]').last();
      if (await actionSearch.isVisible({ timeout: 3000 }).catch(() => false)) {
        await actionSearch.fill('Office 365 Outlook');
        await page.waitForTimeout(3000);
      }

      // Connectors 섹션에서 Office 365 Outlook 클릭
      // "Connectors" 헤더 아래의 항목 선택
      const outlookConnector = page.locator('[class*="OperationSearchListItem"], [class*="connector-item"]').filter({ hasText: 'Office 365 Outlook' }).first();
      if (await outlookConnector.isVisible({ timeout: 5000 }).catch(() => false)) {
        await outlookConnector.click({ force: true });
        console.log('   ✓ Outlook Connector 선택됨');
        await page.waitForTimeout(3000);
      } else {
        // 대안: 첫번째 Office 365 Outlook 텍스트 클릭
        await page.click('text=Office 365 Outlook >> nth=0', { force: true }).catch(() => {});
        await page.waitForTimeout(3000);
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pfg-5.png' });

      // Send an email (V2) 선택 - Actions 목록에서
      console.log('[7] Send an email (V2) 선택...');
      await page.waitForTimeout(2000);

      // Actions 목록에서 Send an email (V2) 찾기
      const sendEmailAction = page.locator('[data-test*="Send_an_email"], text=/Send an email.*V2/i').first();
      if (await sendEmailAction.isVisible({ timeout: 5000 }).catch(() => false)) {
        await sendEmailAction.click({ force: true });
        console.log('   ✓ Send an email (V2) 선택됨');
        await page.waitForTimeout(4000);
      } else {
        // 검색으로 찾기
        const searchInActions = page.locator('input[placeholder*="Search"]').last();
        if (await searchInActions.isVisible({ timeout: 2000 }).catch(() => false)) {
          await searchInActions.fill('Send an email V2');
          await page.waitForTimeout(2000);
        }
        const sendV2 = page.locator('text=Send an email (V2)').first();
        if (await sendV2.isVisible({ timeout: 3000 }).catch(() => false)) {
          await sendV2.click({ force: true });
          console.log('   ✓ Send an email (V2) 검색 후 선택됨');
          await page.waitForTimeout(4000);
        }
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pfg-6.png' });

      // 8. To Expression 입력
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

        // Expression 입력
        const fxInput = page.locator('textarea').first();
        if (await fxInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await fxInput.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");

          const addBtn = page.locator('button:has-text("Add"), button:has-text("OK")').first();
          if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await addBtn.click();
            console.log('   ✓ To Expression 추가됨');
            await page.waitForTimeout(1500);
          }
        }
      }

      // 9. Subject
      console.log('[9] Subject...');
      const subjField = page.locator('[aria-label="Subject"]').last();
      if (await subjField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await subjField.click();
        await page.waitForTimeout(1000);

        const dynTab = page.locator('button:has-text("Dynamic")').first();
        await dynTab.click().catch(() => {});
        await page.waitForTimeout(1000);

        const subjDyn = page.locator('button[aria-label*="Subject"]').first();
        await subjDyn.click().catch(() => {});
        console.log('   ✓ Subject');
      }

      // 10. Body
      console.log('[10] Body...');
      const bodyField = page.locator('[aria-label="Body"]').first();
      if (await bodyField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await bodyField.click();
        await page.waitForTimeout(1000);

        const dynTab2 = page.locator('button:has-text("Dynamic")').first();
        await dynTab2.click().catch(() => {});
        await page.waitForTimeout(1000);

        const bodyDyn = page.locator('button[aria-label*="Body"]').first();
        await bodyDyn.click().catch(() => {});
        console.log('   ✓ Body');
      }
    } else {
      console.log('   Outlook 액션 이미 존재');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pfg-7.png' });

    // 11. Save
    console.log('[11] Save...');
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
      console.log('   ✓ 저장됨');
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pfg-final.png' });
    console.log('\n✅ 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pfg-error.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await page.waitForTimeout(120000);
  await context.close();
}

main();
