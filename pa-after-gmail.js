/**
 * PA 플로우 - Gmail 연결 후 나머지 설정
 * Subject Filter + Outlook 액션 추가
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🔧 PA 플로우 설정 계속 (Gmail 연결 후)...\n');

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
    console.log('⚠️ Edge 프로필 충돌');
    process.exit(1);
  }

  const page = context.pages()[0] || await context.newPage();

  try {
    console.log('[1] 현재 상태 확인...');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-g1.png' });

    // 7. Subject Filter 설정
    console.log('[7] Subject Filter: [TO:...');
    const subjectFilter = page.locator('input[aria-label*="Subject Filter"], input[placeholder*="Subject"], input[aria-label*="subject"]').first();
    if (await subjectFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await subjectFilter.click();
      await subjectFilter.clear();
      await subjectFilter.fill('[TO:');
      console.log('   ✓ Subject Filter 설정됨');
    } else {
      console.log('   Subject Filter 필드 못찾음 - 트리거 카드 클릭 시도');
      const triggerCard = page.locator('[class*="msla-panel-card"], [data-automation-id*="trigger"]').first();
      if (await triggerCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await triggerCard.click();
        await page.waitForTimeout(2000);

        const sf2 = page.locator('input[aria-label*="Subject"], input[placeholder*="Subject"]').first();
        if (await sf2.isVisible({ timeout: 3000 }).catch(() => false)) {
          await sf2.fill('[TO:');
          console.log('   ✓ Subject Filter 설정됨 (트리거 카드 내)');
        }
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-g2.png' });

    // 8. New step 추가
    console.log('[8] New step 추가...');
    const newStep = page.locator('button:has-text("New step"), button[aria-label*="Insert a new step"], button:has-text("+")').first();
    if (await newStep.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newStep.click();
      await page.waitForTimeout(2000);
    }

    const addAction = page.locator('text=/Add an action/i, button:has-text("Add an action")').first();
    if (await addAction.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addAction.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-g3.png' });

    // 9. Outlook Send email 검색
    console.log('[9] Office 365 Outlook Send email...');
    const searchBox = page.locator('input[placeholder*="Search"], input[aria-label*="Search"]').last();
    if (await searchBox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchBox.fill('Office 365 Outlook Send');
      await page.waitForTimeout(3000);
    }

    // Send an email (V2) 선택
    const sendEmailV2 = page.locator('text=/Send an email.*V2/i, [aria-label*="Send an email"]').first();
    if (await sendEmailV2.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sendEmailV2.click();
      await page.waitForTimeout(3000);
      console.log('   ✓ Send an email (V2) 선택됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-g4.png' });

    // 10. To 필드 - Expression
    console.log('[10] To 필드 Expression 입력...');
    const toField = page.locator('[aria-label="To"], input[aria-label*="To"]').first();
    if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toField.click();
      await page.waitForTimeout(1000);

      // Expression 탭 클릭
      const exprTab = page.locator('button:has-text("Expression"), [role="tab"]:has-text("Expression")').first();
      if (await exprTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exprTab.click();
        await page.waitForTimeout(500);
      }

      // fx 입력란
      const fxInput = page.locator('textarea, input[placeholder*="fx"], input[aria-label*="Function"]').first();
      if (await fxInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const expression = "split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]";
        await fxInput.fill(expression);
        console.log('   ✓ Expression 입력됨');

        // Add 버튼
        const addBtn = page.locator('button:has-text("Add"), button:has-text("OK"), button:has-text("Update")').first();
        if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await addBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-g5.png' });

    // 11. Subject - Dynamic content
    console.log('[11] Subject 필드...');
    const subjField = page.locator('[aria-label="Subject"], input[aria-label*="Subject"]').last();
    if (await subjField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await subjField.click();
      await page.waitForTimeout(1000);

      // Dynamic content 탭
      const dynTab = page.locator('button:has-text("Dynamic content"), [role="tab"]:has-text("Dynamic")').first();
      if (await dynTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dynTab.click();
        await page.waitForTimeout(500);
      }

      // Subject 선택 (Gmail 트리거)
      const subjOption = page.locator('[aria-label="Subject"], button:has-text("Subject")').first();
      if (await subjOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await subjOption.click();
        console.log('   ✓ Subject 동적 콘텐츠 선택됨');
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-g6.png' });

    // 12. Body - Dynamic content
    console.log('[12] Body 필드...');
    const bodyField = page.locator('[aria-label="Body"], [aria-label*="Body"]').first();
    if (await bodyField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bodyField.click();
      await page.waitForTimeout(1000);

      // Dynamic content
      const dynTab2 = page.locator('button:has-text("Dynamic content"), [role="tab"]:has-text("Dynamic")').first();
      if (await dynTab2.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dynTab2.click();
        await page.waitForTimeout(500);
      }

      // Body 선택
      const bodyOption = page.locator('[aria-label="Body"], button:has-text("Body")').first();
      if (await bodyOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await bodyOption.click();
        console.log('   ✓ Body 동적 콘텐츠 선택됨');
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-g7.png' });

    // 13. Save
    console.log('[13] Save...');
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
      console.log('   ✓ 저장됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-g-final.png' });

    console.log('\n✅ PA 플로우 설정 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-g-error.png' });
  }

  console.log('\n⏳ 브라우저 180초 유지...');
  await page.waitForTimeout(180000);
  await context.close();
}

main();
