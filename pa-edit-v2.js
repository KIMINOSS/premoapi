/**
 * PA Edit v2 - 상단 커맨드바 Edit 버튼 정확히 클릭
 * Details 패널의 Edit가 아닌 상단 툴바의 Edit 버튼 타겟팅
 */
const { chromium } = require('playwright');

async function main() {
  console.log('✏️ PA Edit v2 - 상단 커맨드바 Edit 버튼 클릭...\n');

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
    // 1. 플로우 상세 페이지로 이동
    console.log('[1] 플로우 상세 페이지...');
    const detailsUrl = `https://make.powerautomate.com/environments/${envId}/flows/${flowId}/details`;
    await page.goto(detailsUrl, { timeout: 60000, waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    console.log(`   URL: ${page.url()}`);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pev2-1.png' });

    // 2. 상단 커맨드바의 Edit 버튼 클릭 (펜 아이콘 + Edit 텍스트)
    console.log('[2] 상단 커맨드바 Edit 버튼 클릭...');

    // 상단 커맨드바 영역 분석
    // 스크린샷 기준: Edit 버튼은 상단 약 45px 영역에 있음

    // 모든 "Edit" 텍스트를 가진 요소 찾기
    const allEditElements = await page.locator('button:has-text("Edit"), span:has-text("Edit"), a:has-text("Edit")').all();
    console.log(`   Edit 요소 총 ${allEditElements.length}개 발견`);

    let editClicked = false;

    // 각 Edit 요소의 위치 확인
    for (let i = 0; i < allEditElements.length; i++) {
      const el = allEditElements[i];
      const box = await el.boundingBox().catch(() => null);
      const text = await el.textContent().catch(() => '');

      if (box) {
        console.log(`   [${i}] y=${Math.round(box.y)}, x=${Math.round(box.x)}, text="${text.trim().substring(0, 20)}"`);

        // 상단 60px 이내 AND 왼쪽 300px 이내 (커맨드바 영역)
        if (box.y < 60 && box.x < 300) {
          console.log(`   → 상단 커맨드바 Edit 버튼 발견!`);
          await el.click();
          editClicked = true;
          console.log('   ✓ Edit 버튼 클릭됨');
          break;
        }
      }
    }

    // 대안: 좌표로 직접 클릭 (상단 Edit 버튼 위치)
    if (!editClicked) {
      console.log('   선택자 실패 - 좌표로 클릭 시도');
      // 상단 커맨드바 Edit 버튼 예상 위치 (x: 180-200, y: 40-50)
      await page.click('text=Edit', { position: { x: 10, y: 10 } }).catch(() => {});
      // 또는 직접 좌표
      await page.mouse.click(190, 45);
      console.log('   좌표 클릭 시도 (190, 45)');
    }

    // 편집 모드 로드 대기
    await page.waitForTimeout(10000);

    const currentUrl = page.url();
    console.log(`[3] 현재 URL: ${currentUrl}`);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pev2-2.png' });

    // URL에 v3 또는 definition이 있는지 확인
    const isEditMode = currentUrl.includes('v3=true') || currentUrl.includes('definition');
    console.log(`   편집 모드: ${isEditMode ? '✓ 진입' : '✗ 실패'}`);

    if (!isEditMode) {
      // 다시 시도: 커맨드바 첫 번째 버튼 클릭
      console.log('[3-1] 재시도: 커맨드바 분석...');

      // Fluent UI 커맨드바 버튼들
      const commandBtns = await page.locator('[class*="ms-CommandBar"] button, [role="menubar"] button').all();
      console.log(`   커맨드바 버튼 수: ${commandBtns.length}`);

      for (const btn of commandBtns) {
        const text = await btn.textContent().catch(() => '');
        const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');

        if (text.includes('Edit') || ariaLabel === 'Edit') {
          console.log(`   Edit 버튼 발견: "${text}" / aria-label="${ariaLabel}"`);
          await btn.click();
          console.log('   ✓ 커맨드바 Edit 클릭됨');
          await page.waitForTimeout(10000);
          break;
        }
      }

      const newUrl = page.url();
      console.log(`   새 URL: ${newUrl}`);
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pev2-3.png' });
    }

    // 4. 캔버스 확인
    console.log('[4] 캔버스 확인...');
    await page.waitForTimeout(3000);

    // 트리거 카드 확인
    const triggerCard = page.locator('text=/When a new email arrives/i').first();
    const triggerVisible = await triggerCard.isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`   트리거 카드 보임: ${triggerVisible}`);

    if (triggerVisible) {
      console.log('   ✓ 캔버스 로드됨!');
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pev2-canvas.png' });

      // Outlook 액션 존재 확인
      const outlookExists = await page.locator('text=/Send an email/i').isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`   Outlook 액션 존재: ${outlookExists}`);

      if (!outlookExists) {
        // 5. + 버튼 클릭
        console.log('[5] + 버튼 클릭...');

        // 캔버스의 + 버튼 찾기
        const insertBtns = await page.locator('button[aria-label*="Insert"], button[aria-label*="insert"], [class*="msla-plus"]').all();
        console.log(`   Insert/+ 버튼 수: ${insertBtns.length}`);

        if (insertBtns.length > 0) {
          // 마지막 + 버튼 (Compose 아래)
          await insertBtns[insertBtns.length - 1].click({ force: true });
          await page.waitForTimeout(2000);
          console.log('   ✓ + 버튼 클릭됨');
        } else {
          // 대안: 캔버스에서 + 아이콘 찾기
          const plusCircle = page.locator('circle, [class*="edge-drop"]').last();
          if (await plusCircle.isVisible({ timeout: 3000 }).catch(() => false)) {
            await plusCircle.click({ force: true });
            await page.waitForTimeout(2000);
            console.log('   ✓ + circle 클릭됨');
          }
        }
        await page.screenshot({ path: '/home/kogh/.playwright-mcp/pev2-plus.png' });

        // 6. Add an action 클릭
        console.log('[6] Add an action 클릭...');
        await page.waitForTimeout(2000);

        const addAction = page.locator('button:has-text("Add an action"), [role="menuitem"]:has-text("Add an action")').first();
        if (await addAction.isVisible({ timeout: 5000 }).catch(() => false)) {
          const disabled = await addAction.getAttribute('aria-disabled').catch(() => null);
          console.log(`   Add an action 보임, disabled: ${disabled}`);

          if (disabled !== 'true') {
            await addAction.click({ force: true });
            await page.waitForTimeout(3000);
            console.log('   ✓ Add an action 클릭됨');
          }
        }
        await page.screenshot({ path: '/home/kogh/.playwright-mcp/pev2-add.png' });

        // 7. Office 365 Outlook 선택
        console.log('[7] Office 365 Outlook 선택...');

        // Add an action 패널 내 검색
        const searchInPanel = page.locator('[class*="msla-search"] input, [class*="operation-search"] input').first();
        if (await searchInPanel.isVisible({ timeout: 3000 }).catch(() => false)) {
          await searchInPanel.fill('Office 365 Outlook');
          await page.waitForTimeout(2000);
          console.log('   패널 내 검색 입력됨');
        }

        // Outlook 커넥터 클릭
        const outlookConn = page.locator('[class*="msla-op-search"] text=Office 365 Outlook, [role="option"]:has-text("Office 365 Outlook")').first();
        if (await outlookConn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await outlookConn.click({ force: true });
          await page.waitForTimeout(3000);
          console.log('   ✓ Office 365 Outlook 클릭됨');
        } else {
          // 대안: 텍스트로 클릭
          await page.click('text=Office 365 Outlook', { force: true }).catch(() => {});
          await page.waitForTimeout(3000);
        }
        await page.screenshot({ path: '/home/kogh/.playwright-mcp/pev2-outlook.png' });

        // 8. Send an email (V2) 선택
        console.log('[8] Send an email (V2) 선택...');

        const sendV2 = page.locator('text=Send an email (V2)').first();
        if (await sendV2.isVisible({ timeout: 5000 }).catch(() => false)) {
          await sendV2.click({ force: true });
          await page.waitForTimeout(5000);
          console.log('   ✓ Send an email (V2) 클릭됨');
        }
        await page.screenshot({ path: '/home/kogh/.playwright-mcp/pev2-send.png' });

        // 9. To Expression 설정
        console.log('[9] To Expression 설정...');

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

          // fx 입력
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

        // 10. Subject/Body
        console.log('[10] Subject/Body 설정...');

        // Subject
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

        // Body
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
        await page.screenshot({ path: '/home/kogh/.playwright-mcp/pev2-fields.png' });
      }

      // 11. Save
      console.log('[11] Save...');
      const saveBtn = page.locator('button[aria-label="Save"]').first();
      if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(5000);
        console.log('   ✓ 저장됨');
      }

    } else {
      console.log('   ⚠️ 캔버스가 로드되지 않음');
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pev2-final.png' });

    // 최종 상태
    console.log('\n===== 최종 상태 =====');
    console.log(`URL: ${page.url()}`);
    const outlookFinal = await page.locator('text=/Send an email/i').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Outlook 액션: ${outlookFinal ? '존재' : '없음'}`);

    console.log('\n✅ 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pev2-error.png' });
  }

  console.log('\n⏳ 브라우저 60초 유지...');
  await page.waitForTimeout(60000);
  await context.close();
}

main();
