/**
 * PA 플로우 완성 - Subject Filter + Outlook 액션 + 저장
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🔧 PA 플로우 완성...\n');

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
    await page.waitForTimeout(3000);
    const url = page.url();
    console.log(`   URL: ${url}`);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcf1.png' });

    // 플로우 편집 화면 확인
    if (!url.includes('flows') && !url.includes('edit')) {
      console.log('   플로우 편집 페이지 아님 - My flows 이동');
      await page.goto('https://make.powerautomate.com/manage/flows', { timeout: 60000 });
      await page.waitForTimeout(5000);

      // PREMO-Gmail 클릭
      const flow = page.locator('text=PREMO-Gmail').first();
      if (await flow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await flow.click();
        await page.waitForTimeout(3000);
      }

      // Edit 버튼
      const editBtn = page.locator('button:has-text("Edit")').first();
      if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(8000);
      }
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcf2.png' });

    // 2. Gmail 트리거 클릭해서 설정 확인
    console.log('[2] Gmail 트리거 설정 확인...');
    const triggerCard = page.locator('[class*="msla-panel-card"], [data-testid*="card"]').first();
    if (await triggerCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await triggerCard.click();
      await page.waitForTimeout(2000);
    }

    // Subject Filter 설정
    console.log('[3] Subject Filter: [TO:...');
    const subjectFilter = page.locator('input[aria-label*="Subject"], input[placeholder*="Subject"]').first();
    if (await subjectFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await subjectFilter.click();
      await subjectFilter.clear();
      await subjectFilter.fill('[TO:');
      console.log('   ✓ Subject Filter 설정됨');
      await page.waitForTimeout(1000);
    } else {
      console.log('   Subject Filter 필드 없음 - 고급 옵션 확인');
      const showAdvanced = page.locator('text=/Show advanced options|고급 옵션/i').first();
      if (await showAdvanced.isVisible({ timeout: 3000 }).catch(() => false)) {
        await showAdvanced.click();
        await page.waitForTimeout(2000);

        const sf2 = page.locator('input[aria-label*="Subject"], input[placeholder*="Subject"]').first();
        if (await sf2.isVisible({ timeout: 3000 }).catch(() => false)) {
          await sf2.fill('[TO:');
          console.log('   ✓ Subject Filter 설정됨 (고급 옵션)');
        }
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcf3.png' });

    // 3. Outlook 액션 확인/추가
    console.log('[4] Outlook 액션 확인...');
    const outlookAction = page.locator('text=/Send an email|Office 365 Outlook/i').first();
    if (await outlookAction.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('   Outlook 액션 이미 존재');
      await outlookAction.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('   Outlook 액션 없음 - 추가');

      // + 또는 New step 클릭
      const newStep = page.locator('button:has-text("New step"), button[aria-label*="Insert"], button:has-text("+")').first();
      if (await newStep.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newStep.click();
        await page.waitForTimeout(2000);
      }

      // Add an action
      const addAction = page.locator('text=/Add an action/i').first();
      if (await addAction.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addAction.click();
        await page.waitForTimeout(2000);
      }

      // Outlook 검색
      const searchBox = page.locator('input[placeholder*="Search"]').last();
      if (await searchBox.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchBox.fill('Office 365 Outlook Send email');
        await page.waitForTimeout(3000);
      }

      // Send an email (V2) 선택
      const sendEmail = page.locator('text=/Send an email.*V2/i').first();
      if (await sendEmail.isVisible({ timeout: 5000 }).catch(() => false)) {
        await sendEmail.click();
        await page.waitForTimeout(3000);
        console.log('   ✓ Send an email (V2) 추가됨');
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcf4.png' });

    // 4. To 필드 - Expression
    console.log('[5] To 필드 Expression...');
    const toField = page.locator('[aria-label="To"], input[aria-label*="To"]').first();
    if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toField.click();
      await page.waitForTimeout(1500);

      // Expression 탭
      const exprTab = page.locator('button:has-text("Expression"), [role="tab"]:has-text("Expression"), text=Expression').first();
      if (await exprTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exprTab.click();
        await page.waitForTimeout(1000);

        // fx 입력
        const fxInput = page.locator('textarea, input[placeholder*="fx"], input[aria-label*="Function"]').first();
        if (await fxInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await fxInput.click();
          await fxInput.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");
          console.log('   ✓ Expression 입력됨');

          await page.waitForTimeout(500);

          // Add 버튼
          const addBtn = page.locator('button:has-text("Add"), button:has-text("OK"), button:has-text("Update")').first();
          if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await addBtn.click();
            await page.waitForTimeout(1500);
            console.log('   ✓ Expression 추가됨');
          }
        }
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcf5.png' });

    // 5. Subject - Dynamic content
    console.log('[6] Subject 필드...');
    const subjField = page.locator('[aria-label="Subject"], input[aria-label*="Subject"]').last();
    if (await subjField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await subjField.click();
      await page.waitForTimeout(1500);

      // Dynamic content 탭
      const dynTab = page.locator('button:has-text("Dynamic content"), [role="tab"]:has-text("Dynamic"), text=Dynamic').first();
      if (await dynTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await dynTab.click();
        await page.waitForTimeout(1000);
      }

      // Subject 선택
      const subjDyn = page.locator('button[aria-label="Subject"], [data-testid="Subject"]').first();
      if (await subjDyn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await subjDyn.click();
        console.log('   ✓ Subject 동적 콘텐츠');
        await page.waitForTimeout(1000);
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcf6.png' });

    // 6. Body - Dynamic content
    console.log('[7] Body 필드...');
    const bodyField = page.locator('[aria-label="Body"], [aria-label*="Body"]').first();
    if (await bodyField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await bodyField.click();
      await page.waitForTimeout(1500);

      // Dynamic content
      const dynTab2 = page.locator('button:has-text("Dynamic content"), [role="tab"]:has-text("Dynamic")').first();
      if (await dynTab2.isVisible({ timeout: 3000 }).catch(() => false)) {
        await dynTab2.click();
        await page.waitForTimeout(1000);
      }

      // Body 선택
      const bodyDyn = page.locator('button[aria-label="Body"], [data-testid="Body"]').first();
      if (await bodyDyn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await bodyDyn.click();
        console.log('   ✓ Body 동적 콘텐츠');
        await page.waitForTimeout(1000);
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcf7.png' });

    // 7. Save
    console.log('[8] Save...');
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
      console.log('   ✓ 저장됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcf-final.png' });

    // 8. Turn on (활성화)
    console.log('[9] Turn on...');
    const turnOn = page.locator('button:has-text("Turn on"), [aria-label*="Turn on"]').first();
    if (await turnOn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await turnOn.click();
      await page.waitForTimeout(3000);
      console.log('   ✓ 플로우 활성화됨');
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcf-done.png' });

    console.log('\n✅ PA 플로우 완성!');
    console.log('   - Gmail 트리거: authpremoapi@gmail.com');
    console.log('   - Subject Filter: [TO:');
    console.log('   - Outlook Send email: 최종 수신자에게 전송');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcf-error.png' });
  }

  console.log('\n⏳ 브라우저 180초 유지...');
  await page.waitForTimeout(180000);
  await context.close();
}

main();
