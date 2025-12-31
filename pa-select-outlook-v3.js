/**
 * PA Select Outlook v3 - Add an action 패널에서 Outlook 선택
 * 패널이 열린 상태에서 Office 365 Outlook → Send an email (V2) 선택
 */
const { chromium } = require('playwright');

async function main() {
  console.log('📧 PA Select Outlook v3 - 패널에서 Outlook 선택...\n');

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
    // 1. 플로우 상세 페이지
    console.log('[1] 플로우 상세 페이지...');
    const detailsUrl = `https://make.powerautomate.com/environments/${envId}/flows/${flowId}/details`;
    await page.goto(detailsUrl, { timeout: 60000, waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    // 2. 상단 Edit 버튼 클릭
    console.log('[2] Edit 버튼 클릭...');
    const editBtns = await page.locator('button:has-text("Edit"), span:has-text("Edit")').all();
    for (const btn of editBtns) {
      const box = await btn.boundingBox().catch(() => null);
      if (box && box.y < 60 && box.x < 300) {
        await btn.click();
        console.log('   ✓ Edit 클릭됨');
        break;
      }
    }
    await page.waitForTimeout(10000);
    console.log(`   URL: ${page.url()}`);

    // 3. 캔버스 확인
    console.log('[3] 캔버스 확인...');
    const triggerVisible = await page.locator('text=/When a new email arrives/i').isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`   트리거 보임: ${triggerVisible}`);

    if (!triggerVisible) {
      console.log('   ⚠️ 캔버스 로드 실패');
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/psov3-error.png' });
      return;
    }

    // Outlook 액션 존재 확인
    const outlookExists = await page.locator('text=/Send an email.*V2/i').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`   Outlook 액션 존재: ${outlookExists}`);

    if (outlookExists) {
      console.log('   ✓ Outlook 액션이 이미 존재합니다!');
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/psov3-exists.png' });
    } else {
      // 4. Compose 아래 + 버튼 클릭
      console.log('[4] + 버튼 클릭...');

      // 캔버스의 + 버튼 (Compose 아래)
      const plusBtns = await page.locator('button[aria-label*="Insert a new step"], [class*="msla-plus-button"]').all();
      console.log(`   Insert 버튼 수: ${plusBtns.length}`);

      if (plusBtns.length > 0) {
        await plusBtns[plusBtns.length - 1].click({ force: true });
        console.log('   ✓ + 버튼 클릭됨');
      } else {
        // 대안: circle 아이콘
        const circles = await page.locator('svg circle').all();
        if (circles.length > 0) {
          await circles[circles.length - 1].click({ force: true });
          console.log('   ✓ circle 클릭됨');
        }
      }
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/psov3-1.png' });

      // 5. Add an action 메뉴 선택
      console.log('[5] Add an action...');
      const addAction = page.locator('text=Add an action').first();
      if (await addAction.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addAction.click({ force: true });
        await page.waitForTimeout(3000);
        console.log('   ✓ Add an action 클릭됨');
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/psov3-2.png' });

      // 6. Add an action 패널에서 Office 365 Outlook 선택
      console.log('[6] Office 365 Outlook 선택...');
      await page.waitForTimeout(2000);

      // 패널이 열렸는지 확인
      const panelVisible = await page.locator('text=Add an action').first().isVisible().catch(() => false);
      console.log(`   패널 보임: ${panelVisible}`);

      // 방법 1: 검색창에 입력
      const searchInput = page.locator('input[placeholder*="Search for an action"]').first();
      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill('Send an email');
        await page.waitForTimeout(2000);
        console.log('   검색어 입력됨');
        await page.screenshot({ path: '/home/kogh/.playwright-mcp/psov3-3.png' });
      }

      // 방법 2: By connector 섹션에서 Office 365 Outlook 클릭
      // 스크린샷에서 보이는 커넥터 목록
      const outlookConnector = page.locator('[class*="msla"] >> text=Office 365 Outlook').first();
      if (await outlookConnector.isVisible({ timeout: 5000 }).catch(() => false)) {
        await outlookConnector.click({ force: true });
        await page.waitForTimeout(3000);
        console.log('   ✓ Office 365 Outlook 커넥터 클릭됨');
      } else {
        // 대안: 텍스트로 직접 클릭
        await page.click('text=Office 365 Outlook', { force: true }).catch(async () => {
          // 스크롤 후 시도
          const panel = page.locator('[class*="msla-search"], [class*="operation-panel"]').first();
          if (await panel.isVisible().catch(() => false)) {
            await panel.evaluate(el => el.scrollTop += 200);
            await page.waitForTimeout(1000);
            await page.click('text=Office 365 Outlook', { force: true }).catch(() => {});
          }
        });
        await page.waitForTimeout(3000);
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/psov3-4.png' });

      // 7. Send an email (V2) 선택
      console.log('[7] Send an email (V2) 선택...');
      await page.waitForTimeout(2000);

      // Actions 목록에서 Send an email (V2) 찾기
      const sendEmailV2 = page.locator('text=Send an email (V2)').first();
      if (await sendEmailV2.isVisible({ timeout: 5000 }).catch(() => false)) {
        await sendEmailV2.click({ force: true });
        await page.waitForTimeout(5000);
        console.log('   ✓ Send an email (V2) 클릭됨');
      } else {
        // 검색 결과에서 찾기
        const searchResult = page.locator('[role="option"]:has-text("Send an email"), [class*="OperationSearchListItem"]:has-text("Send an email")').first();
        if (await searchResult.isVisible({ timeout: 3000 }).catch(() => false)) {
          await searchResult.click({ force: true });
          await page.waitForTimeout(5000);
          console.log('   ✓ 검색 결과에서 Send an email 클릭됨');
        }
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/psov3-5.png' });

      // 8. Outlook 카드 확인
      console.log('[8] Outlook 카드 확인...');
      await page.waitForTimeout(3000);

      const outlookCardAdded = await page.locator('text=/Send an email/i').count() > 0;
      console.log(`   Outlook 카드 추가됨: ${outlookCardAdded}`);

      if (outlookCardAdded) {
        // 9. To 필드 설정
        console.log('[9] To Expression 설정...');

        // 카드 클릭하여 상세 패널 열기
        await page.locator('text=/Send an email/i').first().click().catch(() => {});
        await page.waitForTimeout(2000);

        // To 필드 찾기
        const toField = page.locator('[aria-label="To"], input[placeholder*="email"]').first();
        if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
          await toField.click();
          await page.waitForTimeout(1500);
          console.log('   To 필드 클릭됨');

          // Expression 탭
          const exprTab = page.locator('button:has-text("Expression")').first();
          if (await exprTab.isVisible({ timeout: 3000 }).catch(() => false)) {
            await exprTab.click();
            await page.waitForTimeout(1000);
            console.log('   Expression 탭 클릭됨');
          }

          // Expression 입력
          const fxInput = page.locator('textarea').first();
          if (await fxInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await fxInput.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");
            console.log('   Expression 입력됨');

            // Add 버튼
            const addBtn = page.locator('button:has-text("Add")').first();
            if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
              await addBtn.click();
              await page.waitForTimeout(1500);
              console.log('   ✓ To Expression 추가됨');
            }
          }
        }
        await page.screenshot({ path: '/home/kogh/.playwright-mcp/psov3-6.png' });

        // 10. Subject 동적 콘텐츠
        console.log('[10] Subject...');
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

        // 11. Body 동적 콘텐츠
        console.log('[11] Body...');
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
        await page.screenshot({ path: '/home/kogh/.playwright-mcp/psov3-7.png' });
      }
    }

    // 12. Save
    console.log('[12] Save...');
    const saveBtn = page.locator('button[aria-label="Save"]').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
      console.log('   ✓ 저장됨');
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/psov3-final.png' });

    // 최종 확인
    console.log('\n===== 최종 상태 =====');
    console.log(`URL: ${page.url()}`);
    const outlookFinal = await page.locator('text=/Send an email/i').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Outlook 액션: ${outlookFinal ? '존재' : '없음'}`);

    console.log('\n✅ 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/psov3-error.png' });
  }

  console.log('\n⏳ 브라우저 60초 유지...');
  await page.waitForTimeout(60000);
  await context.close();
}

main();
