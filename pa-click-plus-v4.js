/**
 * PA Click Plus v4 - + 버튼 좌표 기반 클릭
 * Compose 아래 + 버튼을 정확히 클릭
 */
const { chromium } = require('playwright');

async function main() {
  console.log('📧 PA Click Plus v4 - 좌표 기반 + 버튼 클릭...\n');

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

    // Compose 카드 위치 찾기
    const composeCard = page.locator('text=Compose').first();
    const composeBox = await composeCard.boundingBox().catch(() => null);
    console.log(`   Compose 카드 위치: x=${composeBox?.x}, y=${composeBox?.y}`);

    // Outlook 액션 확인
    const outlookExists = await page.locator('text=/Send an email.*V2/i').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`   Outlook 액션 존재: ${outlookExists}`);

    if (outlookExists) {
      console.log('   ✓ Outlook 액션이 이미 존재합니다!');
    } else {
      // 4. + 버튼 찾기 및 클릭
      console.log('[4] + 버튼 클릭...');

      // 모든 + 아이콘 버튼 찾기
      const allPlusBtns = await page.locator('[class*="plus"], button[aria-label*="Insert"], button[aria-label*="insert"], svg.msla-button-icon').all();
      console.log(`   + 버튼 후보 수: ${allPlusBtns.length}`);

      for (let i = 0; i < allPlusBtns.length; i++) {
        const btn = allPlusBtns[i];
        const box = await btn.boundingBox().catch(() => null);
        const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
        if (box) {
          console.log(`   [${i}] x=${Math.round(box.x)}, y=${Math.round(box.y)}, label="${ariaLabel}"`);
        }
      }

      // Compose 아래 + 버튼 클릭 (좌표 계산)
      if (composeBox) {
        // Compose 카드 아래 약 50px 위치에 + 버튼이 있음
        const plusX = composeBox.x + composeBox.width / 2;
        const plusY = composeBox.y + composeBox.height + 25;

        console.log(`   + 버튼 예상 위치: x=${Math.round(plusX)}, y=${Math.round(plusY)}`);

        // 좌표로 직접 클릭
        await page.mouse.click(plusX, plusY);
        console.log('   ✓ 좌표 클릭 완료');
        await page.waitForTimeout(3000);
      }

      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcpv4-1.png' });

      // 5. 메뉴에서 Add an action 선택
      console.log('[5] Add an action 선택...');

      // 팝업 메뉴 확인
      const addActionMenu = page.locator('button:has-text("Add an action"), [role="menuitem"]:has-text("Add an action")').first();
      const menuVisible = await addActionMenu.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`   Add an action 메뉴 보임: ${menuVisible}`);

      if (menuVisible) {
        await addActionMenu.click({ force: true });
        await page.waitForTimeout(3000);
        console.log('   ✓ Add an action 클릭됨');
      } else {
        // 대안: + 버튼 다시 클릭 (다른 방법)
        console.log('   메뉴 안 보임 - + 버튼 재클릭');

        // hover로 + 버튼 활성화 시도
        if (composeBox) {
          const plusX = composeBox.x + composeBox.width / 2;
          const plusY = composeBox.y + composeBox.height + 25;

          await page.mouse.move(plusX, plusY);
          await page.waitForTimeout(1000);
          await page.mouse.click(plusX, plusY);
          await page.waitForTimeout(2000);

          // 메뉴 다시 확인
          const addAction2 = page.locator('text=Add an action').first();
          if (await addAction2.isVisible({ timeout: 3000 }).catch(() => false)) {
            await addAction2.click({ force: true });
            await page.waitForTimeout(3000);
            console.log('   ✓ Add an action 클릭됨 (재시도)');
          }
        }
      }

      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcpv4-2.png' });

      // 6. Add an action 패널에서 검색
      console.log('[6] Office 365 Outlook 검색...');
      await page.waitForTimeout(2000);

      // 패널 내 검색창
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.fill('Office 365 Outlook Send');
        await page.waitForTimeout(3000);
        console.log('   검색어 입력됨');
      }

      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcpv4-3.png' });

      // 7. Send an email (V2) 선택
      console.log('[7] Send an email (V2) 선택...');

      // 검색 결과에서 선택
      const sendEmailOptions = await page.locator('[role="option"], [class*="OperationSearchListItem"]').filter({ hasText: /Send an email/i }).all();
      console.log(`   Send an email 옵션 수: ${sendEmailOptions.length}`);

      if (sendEmailOptions.length > 0) {
        // V2 버전 찾기
        for (const option of sendEmailOptions) {
          const text = await option.textContent().catch(() => '');
          if (text.includes('V2') || text.includes('(V2)')) {
            await option.click({ force: true });
            console.log('   ✓ Send an email (V2) 클릭됨');
            break;
          }
        }
        // V2가 없으면 첫 번째 것 클릭
        if (sendEmailOptions.length > 0) {
          await sendEmailOptions[0].click({ force: true }).catch(() => {});
        }
        await page.waitForTimeout(5000);
      } else {
        // 대안: 텍스트로 클릭
        await page.click('text=Send an email (V2)', { force: true }).catch(() => {});
        await page.waitForTimeout(5000);
      }

      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcpv4-4.png' });

      // 8. Outlook 카드 확인
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

        await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcpv4-5.png' });
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

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcpv4-final.png' });

    // 최종 확인
    console.log('\n===== 최종 상태 =====');
    console.log(`URL: ${page.url()}`);
    const outlookFinal = await page.locator('text=/Send an email/i').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Outlook 액션: ${outlookFinal ? '존재' : '없음'}`);

    console.log('\n✅ 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcpv4-error.png' });
  }

  console.log('\n⏳ 브라우저 60초 유지...');
  await page.waitForTimeout(60000);
  await context.close();
}

main();
