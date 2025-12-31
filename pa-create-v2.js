/**
 * PA Gmail 플로우 생성 v2 - 더 정확한 UI 탐색
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🆕 PA Gmail 플로우 생성 v2...\n');

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
    console.log('⚠️ Edge 충돌');
    process.exit(1);
  }

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. Create 페이지
    console.log('[1] Create 페이지...');
    await page.goto('https://make.powerautomate.com/create', { timeout: 60000 });
    await page.waitForTimeout(6000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcv1.png' });

    // 2. Automated cloud flow 클릭
    console.log('[2] Automated cloud flow 클릭...');
    await page.click('text=Automated cloud flow');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcv2.png' });

    // 3. 다이얼로그에서 플로우 이름 입력
    console.log('[3] 플로우 이름 입력...');
    // 첫번째 input (플로우 이름)
    const dialogInputs = await page.locator('.ms-Dialog input, [role="dialog"] input').all();
    console.log(`   다이얼로그 input 수: ${dialogInputs.length}`);

    if (dialogInputs.length > 0) {
      await dialogInputs[0].fill('PREMO-Gmail-Relay');
      console.log('   ✓ 이름 입력됨');
    }
    await page.waitForTimeout(1000);

    // 4. 검색창에 Gmail 입력
    console.log('[4] Gmail 검색...');
    // 검색 input 찾기
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').last();
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('Gmail');
      await page.waitForTimeout(3000);
      console.log('   ✓ Gmail 검색됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcv3.png' });

    // 5. Gmail 커넥터 선택 (아이콘 또는 텍스트)
    console.log('[5] Gmail 선택...');
    // Gmail 로고/아이콘 클릭
    const gmailIcon = page.locator('[alt*="Gmail"], [aria-label*="Gmail"]').first();
    if (await gmailIcon.isVisible({ timeout: 3000 }).catch(() => false)) {
      await gmailIcon.click();
      await page.waitForTimeout(2000);
    } else {
      // 텍스트로 찾기
      await page.click('text=Gmail');
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcv4.png' });

    // 6. When a new email arrives 트리거 선택
    console.log('[6] When a new email arrives...');
    const trigger = page.locator('text=/When a new email arrives/i');
    if (await trigger.isVisible({ timeout: 5000 })) {
      await trigger.click();
      await page.waitForTimeout(2000);
      console.log('   ✓ 트리거 선택됨');
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcv5.png' });

    // 7. Create 버튼 클릭 (다이얼로그 내)
    console.log('[7] Create 버튼...');
    // 다이얼로그 내 Create 버튼 찾기
    const createBtn = page.locator('[role="dialog"] button:has-text("Create"), .ms-Dialog button:has-text("Create")').first();
    if (await createBtn.isVisible({ timeout: 5000 })) {
      const isDisabled = await createBtn.isDisabled();
      console.log(`   Create 버튼 비활성화: ${isDisabled}`);
      if (!isDisabled) {
        await createBtn.click();
        console.log('   ✓ Create 클릭됨');
        await page.waitForTimeout(10000);
      } else {
        console.log('   ❌ 버튼 비활성화 - 트리거 선택 필요');
        // 스크린샷 찍고 상태 확인
        await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcv-disabled.png' });
      }
    } else {
      console.log('   Create 버튼 없음 - 모든 버튼 확인');
      const allBtns = await page.locator('button').all();
      for (const btn of allBtns) {
        const text = await btn.textContent().catch(() => '');
        if (text && text.includes('Create')) {
          console.log(`   발견: "${text.trim()}"`);
        }
      }
    }
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcv6.png' });

    // 8. 편집 화면 확인
    console.log('[8] 편집 화면 확인...');
    await page.waitForTimeout(3000);
    const url = page.url();
    console.log(`   URL: ${url}`);

    if (url.includes('edit') || url.includes('flow')) {
      console.log('   ✓ 플로우 편집 화면');

      // Gmail Sign in 확인
      console.log('[9] Gmail Sign in...');
      const signIn = page.locator('button:has-text("Sign in")').first();
      if (await signIn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await signIn.click();
        await page.waitForTimeout(5000);

        // Google 팝업
        const pages = context.pages();
        for (const p of pages) {
          if (p.url().includes('google.com')) {
            console.log('   Google 로그인 페이지');
            const account = p.locator('text=authpremoapi@gmail.com').first();
            if (await account.isVisible({ timeout: 5000 }).catch(() => false)) {
              await account.click();
              await page.waitForTimeout(5000);
            }
          }
        }
      }

      // Subject Filter
      console.log('[10] Subject Filter...');
      const subjFilter = page.locator('input[aria-label*="Subject"]').first();
      if (await subjFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
        await subjFilter.fill('[TO:');
      }

      // New step
      console.log('[11] New step...');
      const newStep = page.locator('button:has-text("New step")').first();
      if (await newStep.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newStep.click();
        await page.waitForTimeout(2000);
      }

      // Outlook 검색
      const actionSearch = page.locator('input[placeholder*="Search"]').last();
      if (await actionSearch.isVisible({ timeout: 3000 }).catch(() => false)) {
        await actionSearch.fill('Office 365 Outlook Send');
        await page.waitForTimeout(3000);
      }

      // Send an email (V2)
      const sendEmail = page.locator('text=/Send an email.*V2/i').first();
      if (await sendEmail.isVisible({ timeout: 5000 }).catch(() => false)) {
        await sendEmail.click();
        await page.waitForTimeout(3000);
      }

      // To 필드 Expression
      console.log('[12] To Expression...');
      const toField = page.locator('[aria-label="To"]').first();
      if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
        await toField.click();
        await page.waitForTimeout(1000);

        await page.click('text=Expression');
        await page.waitForTimeout(500);

        const fxInput = page.locator('textarea, input[placeholder*="fx"]').first();
        if (await fxInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await fxInput.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");
          await page.click('button:has-text("Add")');
        }
      }

      // Save
      console.log('[13] Save...');
      const saveBtn = page.locator('button:has-text("Save")').first();
      if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(5000);
        console.log('   ✓ 저장됨');
      }
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcv-final.png' });
    console.log('\n📌 완료');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pcv-error.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await page.waitForTimeout(120000);
  await context.close();
}

main();
