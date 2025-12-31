/**
 * PA Old Designer로 플로우 수정
 * New Designer 토글을 끄고 작업
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🔧 PA Old Designer로 플로우 수정...\n');

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
    // 1. PREMO-Gmail-Auth 플로우 편집 페이지로 이동
    console.log('[1] PREMO-Gmail-Auth 편집...');
    await page.goto('https://make.powerautomate.com/manage/flows', { timeout: 60000 });
    await page.waitForTimeout(5000);

    // 플로우 클릭
    const premoFlow = page.locator('a:has-text("PREMO-Gmail-Auth")').first();
    if (await premoFlow.isVisible({ timeout: 8000 }).catch(() => false)) {
      await premoFlow.click();
      await page.waitForTimeout(5000);
    }

    // Edit 클릭
    const editBtn = page.locator('button:has-text("Edit")').first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(8000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pod-1.png' });

    // 2. New Designer 토글 끄기
    console.log('[2] New Designer 끄기...');
    const newDesignerToggle = page.locator('text=New designer').first();
    if (await newDesignerToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
      // 토글 버튼 클릭
      const toggle = page.locator('[role="switch"], input[type="checkbox"]').filter({ hasText: /designer/i }).first();
      if (await toggle.isVisible({ timeout: 3000 }).catch(() => false)) {
        await toggle.click();
        await page.waitForTimeout(5000);
        console.log('   ✓ 토글 클릭됨');
      } else {
        // 토글 영역 클릭
        await newDesignerToggle.click();
        await page.waitForTimeout(5000);
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pod-2.png' });

    // 3. 현재 상태 확인
    console.log('[3] 플로우 구조 확인...');
    await page.waitForTimeout(3000);

    // Old Designer에서 트리거/액션 카드 확인
    const triggerCard = page.locator('[class*="card"], [class*="operation"]').first();
    await triggerCard.screenshot({ path: '/home/kogh/.playwright-mcp/pod-trigger.png' }).catch(() => {});

    // 4. + New step 클릭 (Old Designer 스타일)
    console.log('[4] New step 추가...');
    const newStepBtn = page.locator('button:has-text("New step"), button:has-text("+ New step")').first();
    if (await newStepBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newStepBtn.click();
      await page.waitForTimeout(2000);
      console.log('   ✓ New step 클릭됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pod-3.png' });

    // 5. Choose an operation 패널에서 Outlook 검색
    console.log('[5] Outlook 액션 검색...');
    const searchConnector = page.locator('input[placeholder*="Search"], input[placeholder*="connector"]').first();
    if (await searchConnector.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchConnector.fill('Office 365 Outlook');
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pod-4.png' });

    // 6. Office 365 Outlook 클릭
    console.log('[6] Office 365 Outlook 선택...');
    const outlookIcon = page.locator('[alt*="Office 365 Outlook"], img[src*="outlook"]').first();
    if (await outlookIcon.isVisible({ timeout: 5000 }).catch(() => false)) {
      await outlookIcon.click();
      await page.waitForTimeout(2000);
    } else {
      // 텍스트로 클릭
      await page.locator('text=Office 365 Outlook').first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pod-5.png' });

    // 7. Send an email (V2) 선택
    console.log('[7] Send an email (V2)...');
    const sendEmailV2 = page.locator('text=Send an email (V2)').first();
    if (await sendEmailV2.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sendEmailV2.click();
      await page.waitForTimeout(4000);
      console.log('   ✓ Send an email (V2) 선택됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pod-6.png' });

    // 8. To 필드에 Expression 입력
    console.log('[8] To Expression...');
    const toField = page.locator('[placeholder*="To"], input[aria-label*="To"]').first();
    if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toField.click();
      await page.waitForTimeout(1000);

      // Add dynamic content 클릭
      const dynContent = page.locator('text=/Add dynamic content|Expression/i').first();
      if (await dynContent.isVisible({ timeout: 3000 }).catch(() => false)) {
        await dynContent.click();
        await page.waitForTimeout(1000);
      }

      // Expression 탭
      const exprTab = page.locator('[role="tab"]:has-text("Expression"), button:has-text("Expression")').first();
      if (await exprTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exprTab.click();
        await page.waitForTimeout(1000);
      }

      // Expression 입력
      const fxInput = page.locator('input[placeholder*="fx"], textarea').first();
      if (await fxInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fxInput.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");

        // OK/Add 버튼
        const okBtn = page.locator('button:has-text("OK"), button:has-text("Add")').first();
        if (await okBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await okBtn.click();
          console.log('   ✓ Expression 추가됨');
          await page.waitForTimeout(1500);
        }
      }
    }

    // 9. Subject
    console.log('[9] Subject...');
    const subjField = page.locator('[placeholder*="Subject"], input[aria-label*="Subject"]').first();
    if (await subjField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await subjField.click();
      await page.waitForTimeout(1000);

      // Dynamic content에서 Subject 선택
      const subjDyn = page.locator('[data-automation-id*="subject"], text=Subject').first();
      if (await subjDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await subjDyn.click();
        console.log('   ✓ Subject');
      }
    }

    // 10. Body
    console.log('[10] Body...');
    const bodyField = page.locator('[placeholder*="Body"], textarea[aria-label*="Body"]').first();
    if (await bodyField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bodyField.click();
      await page.waitForTimeout(1000);

      const bodyDyn = page.locator('[data-automation-id*="body"], text=Body').first();
      if (await bodyDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await bodyDyn.click();
        console.log('   ✓ Body');
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pod-7.png' });

    // 11. Save
    console.log('[11] Save...');
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
      console.log('   ✓ 저장됨');
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pod-final.png' });
    console.log('\n✅ 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pod-error.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await page.waitForTimeout(120000);
  await context.close();
}

main();
