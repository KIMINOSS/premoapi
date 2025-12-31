/**
 * PA Gmail→Outlook 릴레이 플로우 최종 생성
 * 개선사항: Connector 먼저 선택, viewport 스크롤 처리
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🆕 PA Gmail→Outlook 릴레이 플로우 최종 생성...\n');

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
    await page.click('text=Automated cloud flow');
    await page.waitForTimeout(5000);

    // 3. 플로우 이름
    console.log('[3] 플로우 이름...');
    const nameInput = page.locator('[role="dialog"] input').first();
    await nameInput.fill('Gmail-Outlook-Relay');
    await page.waitForTimeout(1000);

    // 4. Gmail 검색
    console.log('[4] Gmail 검색...');
    const searchInput = page.locator('[role="dialog"] input').nth(1);
    await searchInput.fill('Gmail when new');
    await page.waitForTimeout(3000);

    // 5. Gmail 트리거 선택
    console.log('[5] Gmail 트리거 선택...');
    const gmailRow = page.locator('[data-test*="shared_gmail"][data-test*="OnNewEmail"]').first();
    await gmailRow.click({ force: true }).catch(async () => {
      // 대안
      const radio = page.locator('[role="dialog"] .ms-ChoiceField-field').first();
      await radio.click({ force: true });
    });
    await page.waitForTimeout(2000);

    // 6. Create 버튼
    console.log('[6] Create 버튼...');
    const createBtn = page.locator('[data-test="flow-modal-create-button"]').first();
    await createBtn.click({ force: true });
    await page.waitForTimeout(12000);

    const url = page.url();
    console.log(`   URL: ${url}`);
    if (!url.includes('flow')) {
      throw new Error('플로우 생성 실패');
    }
    console.log('   ✓ 플로우 편집 화면');
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcf-1.png' });

    // 7. Gmail 연결 확인/수정
    console.log('[7] Gmail 연결...');
    await page.waitForTimeout(3000);

    // Invalid connection 경고가 있으면 연결 수정
    const invalidConn = page.locator('text=/Invalid connection/i').first();
    if (await invalidConn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('   Invalid connection 발견 - 수정 시도');

      // 트리거 카드 클릭
      const triggerCard = page.locator('text=/When a new email arrives/i').first();
      await triggerCard.click().catch(() => {});
      await page.waitForTimeout(2000);

      // Change connection 클릭
      const changeConn = page.locator('button:has-text("Change connection"), text=/Change connection/i').first();
      if (await changeConn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await changeConn.click();
        await page.waitForTimeout(2000);
      }

      // 기존 연결 선택 또는 Sign in
      const gmailOpt = page.locator('[role="option"], [role="listitem"]').first();
      if (await gmailOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
        await gmailOpt.click();
        console.log('   ✓ Gmail 연결 선택됨');
        await page.waitForTimeout(2000);
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcf-2.png' });

    // 8. + 버튼 클릭 → Outlook 액션
    console.log('[8] Outlook 액션 추가...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // + 버튼 (New step 또는 캔버스의 +)
    const addStepBtn = page.locator('button:has-text("New step"), button[aria-label*="Insert a new step"]').first();
    if (await addStepBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addStepBtn.click();
    } else {
      // 캔버스의 + 아이콘 클릭
      await page.locator('[class*="plus"], [class*="add"]').first().click({ force: true }).catch(() => {});
    }
    await page.waitForTimeout(2000);

    // Add an action
    const addAction = page.locator('button:has-text("Add an action")').first();
    if (await addAction.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addAction.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcf-3.png' });

    // 9. Office 365 Outlook 검색 및 Connector 선택
    console.log('[9] Office 365 Outlook Connector...');
    const searchAction = page.locator('input[placeholder*="Search"]').last();
    if (await searchAction.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchAction.fill('Office 365 Outlook');
      await page.waitForTimeout(3000);
    }

    // Connector 목록에서 Office 365 Outlook 클릭 (드롭다운이 아닌 실제 항목)
    // 아이콘이 있는 항목 클릭
    const outlookItem = page.locator('[class*="connector"], [class*="item"]').filter({ hasText: 'Office 365 Outlook' }).first();
    if (await outlookItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await outlookItem.click({ force: true });
      await page.waitForTimeout(3000);
      console.log('   ✓ Outlook Connector 클릭됨');
    } else {
      // 대안: 텍스트 직접 클릭
      await page.click('text=Office 365 Outlook', { force: true }).catch(() => {});
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcf-4.png' });

    // 10. Send an email (V2) 선택
    console.log('[10] Send an email (V2)...');
    // 검색창에 Send 입력
    const searchAction2 = page.locator('input[placeholder*="Search"]').last();
    if (await searchAction2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchAction2.fill('Send an email');
      await page.waitForTimeout(2000);
    }

    const sendEmailV2 = page.locator('[data-test*="Send_an_email"][data-test*="V2"], text=Send an email (V2)').first();
    if (await sendEmailV2.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sendEmailV2.click({ force: true });
      await page.waitForTimeout(4000);
      console.log('   ✓ Send an email (V2) 선택됨');
    } else {
      // 대안
      await page.click('text=/Send an email.*V2/i', { force: true }).catch(() => {});
      await page.waitForTimeout(4000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcf-5.png' });

    // 11. To 필드 - Expression
    console.log('[11] To Expression...');
    await page.waitForTimeout(2000);

    const toField = page.locator('[aria-label="To"], input[name*="to" i]').first();
    if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toField.click();
      await page.waitForTimeout(1500);

      // Expression 탭
      const exprTab = page.locator('button:has-text("Expression")').first();
      if (await exprTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exprTab.click();
        await page.waitForTimeout(1000);
      }

      // fx textarea
      const fxInput = page.locator('textarea').first();
      if (await fxInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fxInput.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");

        // Add/OK 버튼
        const okBtn = page.locator('button:has-text("Add"), button:has-text("OK")').first();
        if (await okBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await okBtn.click();
          await page.waitForTimeout(1500);
          console.log('   ✓ To Expression 추가됨');
        }
      }
    } else {
      console.log('   To 필드 못 찾음');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcf-6.png' });

    // 12. Subject 필드
    console.log('[12] Subject...');
    const subjField = page.locator('[aria-label="Subject"]').last();
    if (await subjField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await subjField.click();
      await page.waitForTimeout(1000);

      // Dynamic content
      const dynTab = page.locator('button:has-text("Dynamic")').first();
      if (await dynTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dynTab.click();
        await page.waitForTimeout(1000);
      }

      // Subject 동적 콘텐츠
      const subjDyn = page.locator('button[aria-label*="Subject"]').first();
      if (await subjDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await subjDyn.click();
        console.log('   ✓ Subject 동적 콘텐츠');
      }
    }

    // 13. Body 필드
    console.log('[13] Body...');
    const bodyField = page.locator('[aria-label="Body"]').first();
    if (await bodyField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bodyField.click();
      await page.waitForTimeout(1000);

      const dynTab2 = page.locator('button:has-text("Dynamic")').first();
      if (await dynTab2.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dynTab2.click();
        await page.waitForTimeout(1000);
      }

      const bodyDyn = page.locator('button[aria-label*="Body"]').first();
      if (await bodyDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await bodyDyn.click();
        console.log('   ✓ Body 동적 콘텐츠');
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcf-7.png' });

    // 14. Save
    console.log('[14] Save...');
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
      console.log('   ✓ 저장됨');
    }

    // 15. 저장 확인 - My flows로 이동하여 확인
    console.log('[15] 저장 확인...');
    await page.goto('https://make.powerautomate.com/manage/flows', { timeout: 30000 });
    await page.waitForTimeout(5000);

    const newFlow = page.locator('text=Gmail-Outlook-Relay').first();
    if (await newFlow.isVisible({ timeout: 10000 }).catch(() => false)) {
      console.log('   ✓ 플로우가 목록에 표시됨');
    } else {
      console.log('   ⚠️ 플로우가 목록에 안 보임');
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcf-final.png' });
    console.log('\n✅ 완료!');
    console.log('\n플로우 구성:');
    console.log('  이름: Gmail-Outlook-Relay');
    console.log('  트리거: Gmail - When a new email arrives');
    console.log('  액션: Outlook - Send an email (V2)');
    console.log('  To: Expression으로 Subject에서 [TO:xxx@xxx.com] 추출');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcf-error.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await page.waitForTimeout(120000);
  await context.close();
}

main();
