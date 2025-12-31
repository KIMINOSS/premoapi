/**
 * PA Final Outlook - aria-label로 + 버튼 정확히 클릭
 * 패널 내 검색창 사용 (상단 전역 검색창이 아님)
 */
const { chromium } = require('playwright');

async function main() {
  console.log('📧 PA Final Outlook - aria-label 기반 + 버튼 클릭...\n');

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

    // 2. Edit 버튼 클릭
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
      return;
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pfo-1.png' });

    // Outlook 액션 확인
    const outlookExists = await page.locator('text=/Send an email.*V2/i').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`   Outlook 액션 존재: ${outlookExists}`);

    if (outlookExists) {
      console.log('   ✓ Outlook 액션이 이미 존재합니다!');
    } else {
      // 4. + 버튼 클릭 (aria-label 사용)
      console.log('[4] + 버튼 클릭 (aria-label)...');

      // Compose 아래 + 버튼 (aria-label로 찾기)
      const plusBtnCompose = page.locator('button[aria-label*="Insert a new action after Compose"]').first();
      const plusVisible = await plusBtnCompose.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`   + 버튼 (after Compose) 보임: ${plusVisible}`);

      if (plusVisible) {
        await plusBtnCompose.click();
        console.log('   ✓ + 버튼 클릭됨');
        await page.waitForTimeout(2000);
      } else {
        // 대안: 모든 Insert 버튼 중 마지막 것
        const allInsertBtns = await page.locator('button[aria-label*="Insert a new action"]').all();
        console.log(`   Insert 버튼 수: ${allInsertBtns.length}`);
        if (allInsertBtns.length > 0) {
          await allInsertBtns[allInsertBtns.length - 1].click();
          console.log('   ✓ 마지막 Insert 버튼 클릭됨');
          await page.waitForTimeout(2000);
        }
      }

      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pfo-2.png' });

      // 5. 팝업 메뉴에서 Add an action 선택
      console.log('[5] Add an action 메뉴 선택...');
      await page.waitForTimeout(1000);

      // 팝업 메뉴 확인
      const addActionMenuItem = page.locator('[role="menuitem"]:has-text("Add an action"), button:has-text("Add an action")').first();
      const menuVisible = await addActionMenuItem.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`   Add an action 메뉴 보임: ${menuVisible}`);

      if (menuVisible) {
        await addActionMenuItem.click();
        console.log('   ✓ Add an action 클릭됨');
        await page.waitForTimeout(3000);
      }

      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pfo-3.png' });

      // 6. 패널 내 검색창에서 검색 (중요: 상단 검색창이 아님!)
      console.log('[6] 패널 내 검색...');
      await page.waitForTimeout(2000);

      // 패널이 열렸는지 확인 (왼쪽 패널)
      const panelTitle = page.locator('text=Add an action').first();
      const panelOpen = await panelTitle.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`   패널 열림: ${panelOpen}`);

      if (panelOpen) {
        // 패널 내 검색창 찾기 (placeholder로 구분)
        // 패널 내 검색창: "Search for an action or connector"
        // 상단 검색창: "Search for helpful resources"
        const panelSearch = page.locator('input[placeholder*="Search for an action"]').first();
        const panelSearchVisible = await panelSearch.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`   패널 내 검색창 보임: ${panelSearchVisible}`);

        if (panelSearchVisible) {
          await panelSearch.fill('Send an email');
          await page.waitForTimeout(3000);
          console.log('   패널 내 검색어 입력됨');
        } else {
          // 대안: 패널 영역 내 첫 번째 input
          const anySearchInPanel = page.locator('[class*="msla-search"] input, [class*="operation-search"] input').first();
          if (await anySearchInPanel.isVisible({ timeout: 2000 }).catch(() => false)) {
            await anySearchInPanel.fill('Send an email');
            await page.waitForTimeout(3000);
            console.log('   대체 검색창에 입력됨');
          }
        }

        await page.screenshot({ path: '/home/kogh/.playwright-mcp/pfo-4.png' });

        // 7. 검색 결과에서 Send an email (V2) 선택
        console.log('[7] Send an email (V2) 선택...');
        await page.waitForTimeout(2000);

        // Office 365 Outlook의 Send an email (V2) 찾기
        const sendEmailV2 = page.locator('[role="option"]:has-text("Send an email (V2)"), [class*="OperationSearchListItem"]:has-text("Send an email (V2)")').first();
        if (await sendEmailV2.isVisible({ timeout: 5000 }).catch(() => false)) {
          await sendEmailV2.click({ force: true });
          console.log('   ✓ Send an email (V2) 클릭됨');
          await page.waitForTimeout(5000);
        } else {
          // Office 365 Outlook 커넥터 먼저 클릭
          const outlookConn = page.locator('text=Office 365 Outlook').first();
          if (await outlookConn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await outlookConn.click({ force: true });
            await page.waitForTimeout(2000);
            console.log('   Office 365 Outlook 커넥터 클릭됨');

            // Send an email (V2) 선택
            const sendV2 = page.locator('text=Send an email (V2)').first();
            if (await sendV2.isVisible({ timeout: 5000 }).catch(() => false)) {
              await sendV2.click({ force: true });
              console.log('   ✓ Send an email (V2) 클릭됨');
              await page.waitForTimeout(5000);
            }
          }
        }

        await page.screenshot({ path: '/home/kogh/.playwright-mcp/pfo-5.png' });

        // 8. Outlook 카드 확인 및 설정
        console.log('[8] Outlook 카드 확인...');
        await page.waitForTimeout(3000);

        const outlookCardAdded = await page.locator('text=/Send an email/i').isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`   Outlook 카드 추가됨: ${outlookCardAdded}`);

        if (outlookCardAdded) {
          // 9. To Expression 설정
          console.log('[9] To Expression 설정...');

          // 카드 클릭
          await page.locator('text=/Send an email/i').first().click().catch(() => {});
          await page.waitForTimeout(2000);

          // To 필드
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

          // 10. Subject/Body 동적 콘텐츠
          console.log('[10] Subject/Body...');

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
              console.log('   ✓ Subject');
            }
          }

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
              console.log('   ✓ Body');
            }
          }

          await page.screenshot({ path: '/home/kogh/.playwright-mcp/pfo-6.png' });
        }
      } else {
        console.log('   ⚠️ Add an action 패널이 열리지 않음');
      }
    }

    // 11. Save
    console.log('[11] Save...');
    const saveBtn = page.locator('button[aria-label="Save"]').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(5000);
      console.log('   ✓ 저장됨');
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pfo-final.png' });

    // 최종 확인
    console.log('\n===== 최종 상태 =====');
    console.log(`URL: ${page.url()}`);
    const outlookFinal = await page.locator('text=/Send an email/i').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Outlook 액션: ${outlookFinal ? '존재' : '없음'}`);

    console.log('\n✅ 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pfo-error.png' });
  }

  console.log('\n⏳ 브라우저 60초 유지...');
  await page.waitForTimeout(60000);
  await context.close();
}

main();
