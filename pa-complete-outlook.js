/**
 * PA Outlook 액션 완전 자동화 - 안정적인 선택자 사용
 * 플로우 상세 → Edit → + 버튼 → Office 365 Outlook → Send an email (V2)
 */
const { chromium } = require('playwright');

async function main() {
  console.log('📧 Outlook 액션 완전 자동화 시작...\n');

  const userDataDir = 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data';

  const envId = 'Default-ef30448f-b0ea-4625-99b6-991583884a18';
  const flowId = '514fa3b0-89d6-4dec-a58a-4849e8ada79d';

  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: 'msedge',
      args: ['--start-maximized'],
      viewport: { width: 1600, height: 1000 }
    });
  } catch (err) {
    console.log('⚠️ Edge 시작 실패:', err.message);
    process.exit(1);
  }

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. 플로우 상세 페이지로 직접 이동
    console.log('[1] 플로우 상세 페이지...');
    const detailsUrl = `https://make.powerautomate.com/environments/${envId}/flows/${flowId}/details`;
    await page.goto(detailsUrl, { timeout: 60000, waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    console.log(`   URL: ${page.url()}`);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pco-1.png' });

    // 2. Edit 버튼 클릭
    console.log('[2] Edit 버튼 클릭...');

    // 여러 Edit 버튼 선택자 시도
    const editSelectors = [
      'button[aria-label="Edit"]',
      '[data-automation-id="editFlow"]',
      'button:has-text("Edit")',
      'span:has-text("Edit")'
    ];

    for (const selector of editSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        const box = await btn.boundingBox().catch(() => null);
        // 상단 영역의 Edit 버튼만 클릭 (Details 섹션 Edit 제외)
        if (box && box.y < 200) {
          await btn.click();
          console.log(`   ✓ Edit 클릭됨 (${selector}, y=${Math.round(box.y)})`);
          break;
        }
      }
    }

    // 편집 모드 로드 대기
    await page.waitForTimeout(10000);
    console.log(`   현재 URL: ${page.url()}`);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pco-2.png' });

    // 3. 캔버스 확인
    console.log('[3] 캔버스 확인...');
    await page.waitForTimeout(3000);

    // 기존 Outlook 액션 확인
    const outlookExists = await page.locator('text=/Send an email/i').isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   Outlook 액션 존재: ${outlookExists}`);

    if (outlookExists) {
      console.log('   ✓ Outlook 액션이 이미 존재합니다!');
    } else {
      // 4. + 버튼 클릭 (여러 방법 시도)
      console.log('[4] + 버튼 클릭...');

      // 방법 1: aria-label로 찾기
      let plusClicked = false;

      // Insert a new step 버튼 찾기 (Power Automate New Designer)
      const insertBtns = await page.locator('button[aria-label*="Insert"], button[aria-label*="insert"]').all();
      console.log(`   Insert 버튼 수: ${insertBtns.length}`);

      if (insertBtns.length > 0) {
        // 마지막 Insert 버튼 클릭 (Compose 아래)
        const lastInsert = insertBtns[insertBtns.length - 1];
        await lastInsert.click({ force: true });
        plusClicked = true;
        console.log('   ✓ Insert 버튼 클릭됨');
        await page.waitForTimeout(2000);
      }

      // 방법 2: edge-drop-zone 클릭
      if (!plusClicked) {
        const dropZone = page.locator('[class*="edge-drop"], [class*="msla-plus"]').last();
        if (await dropZone.isVisible({ timeout: 3000 }).catch(() => false)) {
          await dropZone.click({ force: true });
          plusClicked = true;
          console.log('   ✓ Drop zone 클릭됨');
          await page.waitForTimeout(2000);
        }
      }

      // 방법 3: SVG circle 클릭 (+ 아이콘)
      if (!plusClicked) {
        const svgPlus = page.locator('svg circle').last();
        if (await svgPlus.isVisible({ timeout: 3000 }).catch(() => false)) {
          await svgPlus.click({ force: true });
          plusClicked = true;
          console.log('   ✓ SVG circle 클릭됨');
          await page.waitForTimeout(2000);
        }
      }

      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pco-3.png' });

      // 5. Add an action 클릭
      console.log('[5] Add an action 클릭...');
      await page.waitForTimeout(2000);

      // Add an action 버튼/메뉴 항목 찾기
      const addActionSelectors = [
        'button:has-text("Add an action")',
        '[aria-label*="Add an action"]',
        'text=Add an action',
        '[role="menuitem"]:has-text("Add an action")'
      ];

      for (const selector of addActionSelectors) {
        const addBtn = page.locator(selector).first();
        const visible = await addBtn.isVisible({ timeout: 3000 }).catch(() => false);
        const disabled = await addBtn.getAttribute('aria-disabled').catch(() => null);

        if (visible && disabled !== 'true') {
          await addBtn.click({ force: true });
          console.log(`   ✓ Add an action 클릭됨 (${selector})`);
          await page.waitForTimeout(3000);
          break;
        } else if (visible) {
          console.log(`   Add an action 발견됨 (disabled: ${disabled})`);
        }
      }

      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pco-4.png' });

      // 6. Office 365 Outlook 검색/선택
      console.log('[6] Office 365 Outlook 선택...');
      await page.waitForTimeout(2000);

      // 검색 입력 (있으면)
      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill('Office 365 Outlook');
        await page.waitForTimeout(2000);
        console.log('   검색어 입력됨');
      }

      // Office 365 Outlook 항목 클릭
      const outlookItem = page.locator('text=Office 365 Outlook').first();
      if (await outlookItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await outlookItem.click({ force: true });
        await page.waitForTimeout(3000);
        console.log('   ✓ Office 365 Outlook 클릭됨');
      } else {
        // 스크롤해서 찾기
        const panel = page.locator('[class*="operation-search"], [class*="connector-list"]').first();
        if (await panel.isVisible().catch(() => false)) {
          await panel.evaluate(el => el.scrollTop += 300);
          await page.waitForTimeout(1000);

          const outlookItem2 = page.locator('text=Office 365 Outlook').first();
          if (await outlookItem2.isVisible({ timeout: 3000 }).catch(() => false)) {
            await outlookItem2.click({ force: true });
            await page.waitForTimeout(3000);
            console.log('   ✓ Office 365 Outlook 클릭됨 (스크롤 후)');
          }
        }
      }

      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pco-5.png' });

      // 7. Send an email (V2) 선택
      console.log('[7] Send an email (V2) 선택...');
      await page.waitForTimeout(2000);

      // Send an email (V2) 항목 찾기
      const sendEmailV2 = page.locator('text=Send an email (V2)').first();
      if (await sendEmailV2.isVisible({ timeout: 5000 }).catch(() => false)) {
        await sendEmailV2.click({ force: true });
        await page.waitForTimeout(5000);
        console.log('   ✓ Send an email (V2) 클릭됨');
      } else {
        // 검색으로 찾기
        const searchInput2 = page.locator('input[placeholder*="Search"]').first();
        if (await searchInput2.isVisible({ timeout: 2000 }).catch(() => false)) {
          await searchInput2.fill('Send an email');
          await page.waitForTimeout(2000);
        }

        const sendV2Alt = page.locator('text=/Send an email.*V2/i').first();
        if (await sendV2Alt.isVisible({ timeout: 3000 }).catch(() => false)) {
          await sendV2Alt.click({ force: true });
          await page.waitForTimeout(5000);
          console.log('   ✓ Send an email (V2) 클릭됨 (검색)');
        }
      }

      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pco-6.png' });

      // 8. Outlook 액션 카드 설정
      console.log('[8] Outlook 액션 설정...');
      await page.waitForTimeout(2000);

      // Send an email 카드가 추가되었는지 확인
      const emailCardAdded = await page.locator('text=/Send an email/i').isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`   Send an email 카드 추가됨: ${emailCardAdded}`);

      if (emailCardAdded) {
        // To 필드 설정
        console.log('[9] To Expression 설정...');

        // 카드 클릭하여 상세 패널 열기
        await page.locator('text=/Send an email/i').first().click().catch(() => {});
        await page.waitForTimeout(2000);

        // To 필드 찾기
        const toField = page.locator('[aria-label="To"], input[placeholder*="email"]').first();
        if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
          await toField.click();
          await page.waitForTimeout(1500);

          // Expression 탭 클릭
          const exprTab = page.locator('button:has-text("Expression"), [role="tab"]:has-text("Expression")').first();
          if (await exprTab.isVisible({ timeout: 3000 }).catch(() => false)) {
            await exprTab.click();
            await page.waitForTimeout(1000);
            console.log('   Expression 탭 클릭됨');
          }

          // Expression 입력
          const fxInput = page.locator('textarea, input[placeholder*="fx"]').first();
          if (await fxInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await fxInput.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");
            console.log('   Expression 입력됨');

            // Add 버튼 클릭
            const addBtn = page.locator('button:has-text("Add"), button:has-text("OK")').first();
            if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
              await addBtn.click();
              await page.waitForTimeout(1500);
              console.log('   ✓ To Expression 추가됨');
            }
          }
        }

        await page.screenshot({ path: '/home/kogh/.playwright-mcp/pco-7.png' });

        // Subject 동적 콘텐츠
        console.log('[10] Subject 설정...');
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

        // Body 동적 콘텐츠
        console.log('[11] Body 설정...');
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

        await page.screenshot({ path: '/home/kogh/.playwright-mcp/pco-8.png' });
      }
    }

    // 12. Save 버튼 클릭
    console.log('[12] Save...');
    const saveBtn = page.locator('button[aria-label="Save"], button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const btnText = await saveBtn.textContent().catch(() => '');
      if (btnText.toLowerCase().includes('save') && !btnText.toLowerCase().includes('as')) {
        await saveBtn.click();
        await page.waitForTimeout(5000);
        console.log('   ✓ 저장됨');
      }
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pco-final.png' });

    // 최종 확인
    console.log('\n===== 최종 상태 =====');
    console.log(`URL: ${page.url()}`);
    const outlookFinal = await page.locator('text=/Send an email/i').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Outlook 액션: ${outlookFinal ? '존재' : '없음'}`);

    console.log('\n✅ 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pco-error.png' });
  }

  console.log('\n⏳ 브라우저 60초 유지...');
  await page.waitForTimeout(60000);
  await context.close();
}

main();
