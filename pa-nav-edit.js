/**
 * PA PREMO-Gmail-Auth 플로우 편집 - 네비게이션 대기 추가
 * 플로우 이름 클릭 → 상세 페이지 → Edit → 편집 모드
 */
const { chromium } = require('playwright');

async function main() {
  console.log('✏️ PREMO-Gmail-Auth 네비게이션 편집...\n');

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

    const url1 = page.url();
    console.log(`   URL: ${url1}`);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pne-1.png' });

    // 2. PREMO-Gmail-Auth 행 찾기 및 클릭
    console.log('[2] PREMO-Gmail-Auth 클릭...');

    // 여러 선택자 시도
    const flowSelectors = [
      'a[href*="514fa3b0-89d6-4dec-a58a-4849e8ada79d"]',  // 플로우 ID로 직접 찾기
      '[data-automation-key="PREMO-Gmail-Auth"]',
      'div[role="gridcell"]:has-text("PREMO-Gmail-Auth")',
      'span:text-is("PREMO-Gmail-Auth")',
      'text=PREMO-Gmail-Auth'
    ];

    let clicked = false;
    for (const selector of flowSelectors) {
      try {
        const element = page.locator(selector).first();
        const visible = await element.isVisible({ timeout: 2000 }).catch(() => false);
        if (visible) {
          console.log(`   선택자 발견: ${selector}`);

          // 클릭과 네비게이션 대기를 함께 수행
          await Promise.all([
            page.waitForURL('**/flows/**/details', { timeout: 15000 }).catch(() => {}),
            element.click()
          ]);

          clicked = true;
          console.log('   ✓ 클릭됨');
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!clicked) {
      // 대안: 테이블 행에서 직접 찾기
      console.log('   선택자 실패 - 테이블 행 직접 검색');

      const rows = await page.locator('[role="row"], tr').all();
      console.log(`   행 수: ${rows.length}`);

      for (const row of rows) {
        const text = await row.textContent().catch(() => '');
        if (text.includes('PREMO-Gmail-Auth')) {
          console.log('   PREMO-Gmail-Auth 행 발견');
          await Promise.all([
            page.waitForURL('**/flows/**/details', { timeout: 15000 }).catch(() => {}),
            row.click()
          ]);
          clicked = true;
          break;
        }
      }
    }

    await page.waitForTimeout(5000);
    const url2 = page.url();
    console.log(`   현재 URL: ${url2}`);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pne-2.png' });

    // 3. 상세 페이지 확인
    if (url2.includes('details') || url2.includes('514fa3b0')) {
      console.log('   ✓ 상세 페이지 진입 성공');

      // 4. Edit 버튼 클릭
      console.log('[3] Edit 버튼 클릭...');
      await page.waitForTimeout(3000);

      // 상단 메뉴에서 Edit 찾기 (아이콘 + 텍스트)
      // PA 상단 커맨드바의 Edit 버튼
      const editBtn = page.locator('button:has-text("Edit"), span:has-text("Edit")').first();
      const editVisible = await editBtn.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`   Edit 버튼 보임: ${editVisible}`);

      if (editVisible) {
        // Edit 클릭과 네비게이션 대기
        await Promise.all([
          page.waitForURL('**/definition', { timeout: 15000 }).catch(() => {}),
          editBtn.click()
        ]);
        console.log('   ✓ Edit 클릭됨');
      }

      await page.waitForTimeout(8000);
      const url3 = page.url();
      console.log(`[4] 현재 URL: ${url3}`);
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pne-3.png' });

      // 5. 편집 모드 확인
      if (url3.includes('definition')) {
        console.log('   ✓ 편집 모드 진입 성공!');

        // 캔버스 작업 시작
        await page.waitForTimeout(5000);

        // Outlook 액션 확인
        console.log('[5] Outlook 액션 확인...');
        const outlookExists = await page.locator('text=/Send an email/i').isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`   Outlook 액션 존재: ${outlookExists}`);

        if (!outlookExists) {
          // + 버튼 클릭하여 액션 추가
          console.log('[6] 액션 추가...');

          // 캔버스에서 + 버튼 찾기
          const plusBtn = page.locator('[aria-label*="Insert"], [aria-label*="Add"], [class*="edge-button"]').first();
          if (await plusBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await plusBtn.click();
            await page.waitForTimeout(2000);
            console.log('   ✓ + 버튼 클릭됨');
          }

          // Add an action
          const addAction = page.locator('button:has-text("Add an action")').first();
          if (await addAction.isVisible({ timeout: 5000 }).catch(() => false)) {
            await addAction.click();
            await page.waitForTimeout(3000);
            console.log('   ✓ Add an action 클릭됨');
          }
          await page.screenshot({ path: '/home/kogh/.playwright-mcp/pne-4.png' });

          // Office 365 Outlook 검색
          console.log('[7] Outlook 검색...');
          const searchInput = page.locator('input[placeholder*="Search"]').last();
          if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await searchInput.fill('Office 365 Outlook');
            await page.waitForTimeout(3000);
          }
          await page.screenshot({ path: '/home/kogh/.playwright-mcp/pne-5.png' });

          // Outlook Connector 선택
          console.log('[8] Outlook Connector 선택...');
          const outlookConn = page.locator('text=Office 365 Outlook').first();
          if (await outlookConn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await outlookConn.click({ force: true });
            await page.waitForTimeout(3000);
            console.log('   ✓ Outlook Connector 선택됨');
          }
          await page.screenshot({ path: '/home/kogh/.playwright-mcp/pne-6.png' });

          // Send an email (V2) 선택
          console.log('[9] Send an email (V2) 선택...');
          const sendEmail = page.locator('text=Send an email (V2)').first();
          if (await sendEmail.isVisible({ timeout: 5000 }).catch(() => false)) {
            await sendEmail.click({ force: true });
            await page.waitForTimeout(5000);
            console.log('   ✓ Send an email (V2) 선택됨');
          }
          await page.screenshot({ path: '/home/kogh/.playwright-mcp/pne-7.png' });

          // To Expression
          console.log('[10] To Expression...');
          const toField = page.locator('[aria-label="To"]').first();
          if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
            await toField.click();
            await page.waitForTimeout(1500);

            const exprTab = page.locator('button:has-text("Expression")').first();
            if (await exprTab.isVisible({ timeout: 3000 }).catch(() => false)) {
              await exprTab.click();
              await page.waitForTimeout(1000);
            }

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

          // Subject/Body 동적 콘텐츠
          console.log('[11] Subject/Body...');
          // (간략화 - 이전 스크립트와 동일)
          await page.screenshot({ path: '/home/kogh/.playwright-mcp/pne-8.png' });
        }

        // Save
        console.log('[12] Save...');
        const saveBtn = page.locator('button[aria-label="Save"]').first();
        if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(5000);
          console.log('   ✓ 저장됨');
        }

      } else {
        console.log('   ⚠️ 편집 모드로 진입하지 못함');
      }

    } else {
      console.log('   ⚠️ 상세 페이지로 이동하지 못함');

      // 대안: 플로우 ID를 사용하여 직접 상세 페이지로 이동
      console.log('[대안] 직접 상세 페이지로 이동...');
      const detailsUrl = 'https://make.powerautomate.com/environments/Default-ef30448f-b0ea-4625-99b6-991583884a18/flows/514fa3b0-89d6-4dec-a58a-4849e8ada79d/details';
      await page.goto(detailsUrl, { timeout: 60000 });
      await page.waitForTimeout(8000);

      const url4 = page.url();
      console.log(`   현재 URL: ${url4}`);
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pne-alt.png' });
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pne-final.png' });
    console.log('\n✅ 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pne-error.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await page.waitForTimeout(120000);
  await context.close();
}

main();
