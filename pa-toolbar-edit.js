/**
 * PA PREMO-Gmail-Auth 플로우 편집 - 상단 툴바 Edit 클릭
 * Details 섹션의 Edit가 아닌 상단 커맨드바의 Edit 버튼 클릭
 */
const { chromium } = require('playwright');

async function main() {
  console.log('✏️ PREMO-Gmail-Auth 상단 툴바 Edit 클릭...\n');

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
    // 1. 플로우 목록
    console.log('[1] 플로우 목록...');
    await page.goto('https://make.powerautomate.com/manage/flows', { timeout: 60000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pte-1.png' });

    // 2. PREMO-Gmail-Auth 클릭
    console.log('[2] PREMO-Gmail-Auth 클릭...');
    const flowLink = page.locator('a:has-text("PREMO-Gmail-Auth"), text=PREMO-Gmail-Auth').first();
    if (await flowLink.isVisible({ timeout: 8000 }).catch(() => false)) {
      await flowLink.click();
      await page.waitForTimeout(5000);
      console.log('   ✓ 플로우 클릭됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pte-2.png' });

    // 3. 상단 커맨드바의 Edit 버튼 클릭 (상세 페이지에서)
    console.log('[3] 상단 커맨드바 Edit 버튼 클릭...');

    // 상단 커맨드바 영역 확인
    const commandBar = page.locator('[class*="commandBar"], [class*="toolbar"], [role="toolbar"]').first();
    const commandBarVisible = await commandBar.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   커맨드바 보임: ${commandBarVisible}`);

    // 상단 Edit 버튼 (펜 아이콘 + Edit 텍스트)
    // 선택자 우선순위: data-automation-id > aria-label > 위치 기반
    const editSelectors = [
      '[data-automation-id="editFlow"]',
      '[data-automation-id*="edit"]',
      'button[aria-label="Edit"]',
      'button[name="Edit"]',
      '[role="menubar"] button:has-text("Edit")',
      '[class*="commandBar"] button:has-text("Edit")'
    ];

    let editClicked = false;
    for (const selector of editSelectors) {
      const editBtn = page.locator(selector).first();
      const visible = await editBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (visible) {
        console.log(`   Edit 버튼 발견: ${selector}`);
        await editBtn.click();
        editClicked = true;
        console.log('   ✓ Edit 버튼 클릭됨');
        break;
      }
    }

    if (!editClicked) {
      // 대안: 페이지 상단 영역의 첫 번째 Edit 텍스트를 가진 버튼
      // (Details 섹션의 Edit는 보통 오른쪽 하단에 있음)
      console.log('   특정 선택자 실패 - 위치 기반 선택 시도');

      // 상단 50px 영역 내의 Edit 버튼 찾기
      const allEditBtns = await page.locator('button:has-text("Edit")').all();
      console.log(`   Edit 버튼 총 ${allEditBtns.length}개 발견`);

      for (let i = 0; i < allEditBtns.length; i++) {
        const btn = allEditBtns[i];
        const box = await btn.boundingBox().catch(() => null);
        if (box && box.y < 100) {  // 상단 100px 이내
          console.log(`   상단 Edit 버튼 발견 (y=${box.y})`);
          await btn.click();
          editClicked = true;
          console.log('   ✓ 상단 Edit 버튼 클릭됨');
          break;
        }
      }
    }

    if (!editClicked) {
      console.log('   ⚠️ Edit 버튼을 찾지 못함');
    }

    // 편집 화면 로드 대기
    await page.waitForTimeout(10000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pte-3.png' });

    // 4. URL 확인 - 편집 모드인지 확인
    const currentUrl = page.url();
    console.log(`[4] 현재 URL: ${currentUrl}`);

    if (currentUrl.includes('definition') || currentUrl.includes('edit')) {
      console.log('   ✓ 편집 모드 진입 성공!');

      // 5. 캔버스에서 작업
      console.log('[5] 캔버스 확인...');
      await page.waitForTimeout(3000);

      // 트리거 카드 확인
      const triggerCard = page.locator('[class*="msla-panel"], [class*="card"]').first();
      const triggerVisible = await triggerCard.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`   트리거 카드 보임: ${triggerVisible}`);

      // Outlook 액션 확인
      const outlookExists = await page.locator('text=/Send an email/i').isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`   Outlook 액션 존재: ${outlookExists}`);

      if (!outlookExists) {
        // 6. + 버튼 클릭
        console.log('[6] + 버튼 클릭...');

        // 캔버스의 + 버튼 또는 New step 버튼
        const plusBtn = page.locator('[class*="edge-button"], button[aria-label*="Insert"], button[aria-label*="Add"]').first();
        if (await plusBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await plusBtn.click();
          await page.waitForTimeout(2000);
          console.log('   ✓ + 버튼 클릭됨');
        } else {
          // 키보드로 + 트리거
          await page.keyboard.press('Tab');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000);
        }
        await page.screenshot({ path: '/home/kogh/.playwright-mcp/pte-4.png' });

        // 7. Add an action
        console.log('[7] Add an action...');
        const addAction = page.locator('button:has-text("Add an action")').first();
        if (await addAction.isVisible({ timeout: 5000 }).catch(() => false)) {
          await addAction.click();
          await page.waitForTimeout(3000);
          console.log('   ✓ Add an action 클릭됨');
        }
        await page.screenshot({ path: '/home/kogh/.playwright-mcp/pte-5.png' });

        // 8. Office 365 Outlook 검색
        console.log('[8] Office 365 Outlook 검색...');
        const searchInput = page.locator('input[placeholder*="Search"]').last();
        if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
          await searchInput.fill('Office 365 Outlook');
          await page.waitForTimeout(3000);
        }
        await page.screenshot({ path: '/home/kogh/.playwright-mcp/pte-6.png' });

        // 9. Outlook Connector 클릭
        console.log('[9] Outlook Connector 선택...');
        const outlookConn = page.locator('text=Office 365 Outlook').first();
        if (await outlookConn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await outlookConn.click({ force: true });
          await page.waitForTimeout(3000);
          console.log('   ✓ Outlook Connector 선택됨');
        }
        await page.screenshot({ path: '/home/kogh/.playwright-mcp/pte-7.png' });

        // 10. Send an email (V2) 선택
        console.log('[10] Send an email (V2) 선택...');
        const sendEmail = page.locator('text=Send an email (V2)').first();
        if (await sendEmail.isVisible({ timeout: 5000 }).catch(() => false)) {
          await sendEmail.click({ force: true });
          await page.waitForTimeout(5000);
          console.log('   ✓ Send an email (V2) 선택됨');
        }
        await page.screenshot({ path: '/home/kogh/.playwright-mcp/pte-8.png' });

        // 11. To Expression
        console.log('[11] To Expression...');
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

            const addBtn = page.locator('button:has-text("Add")').first();
            if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
              await addBtn.click();
              await page.waitForTimeout(1500);
              console.log('   ✓ To Expression 추가됨');
            }
          }
        }

        // 12. Subject
        console.log('[12] Subject...');
        const subjField = page.locator('[aria-label="Subject"]').last();
        if (await subjField.isVisible({ timeout: 3000 }).catch(() => false)) {
          await subjField.click();
          await page.waitForTimeout(1000);

          const dynTab = page.locator('button:has-text("Dynamic")').first();
          if (await dynTab.isVisible({ timeout: 2000 }).catch(() => false)) {
            await dynTab.click();
            await page.waitForTimeout(1000);
          }

          const subjDyn = page.locator('button[aria-label*="Subject"]').first();
          if (await subjDyn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await subjDyn.click();
            console.log('   ✓ Subject 동적 콘텐츠');
          }
        }

        // 13. Body
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
        await page.screenshot({ path: '/home/kogh/.playwright-mcp/pte-9.png' });
      }

      // 14. Save
      console.log('[14] Save...');
      const saveBtn = page.locator('button[aria-label="Save"], button:has-text("Save")').first();
      if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        const btnText = await saveBtn.textContent().catch(() => '');
        if (btnText.toLowerCase().includes('save') && !btnText.toLowerCase().includes('as')) {
          await saveBtn.click();
          await page.waitForTimeout(5000);
          console.log('   ✓ 저장됨');
        }
      }

    } else {
      console.log('   ⚠️ 편집 모드로 진입하지 못함');
      console.log('   현재 페이지 타이틀:', await page.title());
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pte-final.png' });
    console.log('\n✅ 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pte-error.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await page.waitForTimeout(120000);
  await context.close();
}

main();
