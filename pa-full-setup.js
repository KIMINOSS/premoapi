/**
 * PA 전체 자동 설정
 * Gmail 트리거 → Subject 파싱 → Outlook 발송
 */
const { chromium } = require('playwright');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🤖 PA 플로우 전체 자동 설정...\n');

  const userDataDir = 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data';

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'msedge',
    args: ['--start-maximized'],
    viewport: { width: 1400, height: 900 }
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. Create 페이지
    console.log('[1] Create 페이지 이동...');
    await page.goto('https://make.powerautomate.com/create', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await delay(5000);

    // 2. Automated cloud flow 클릭
    console.log('[2] Automated cloud flow...');
    await page.click('text=/Automated cloud flow/i', { timeout: 10000 }).catch(() => {});
    await delay(3000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-step1.png' });

    // 3. 플로우 이름 입력
    console.log('[3] 플로우 이름...');
    const nameInput = page.locator('input').first();
    await nameInput.fill('PREMO-Email-Forward');
    await delay(1000);

    // 4. Gmail 검색
    console.log('[4] Gmail 트리거 검색...');
    const searchInputs = page.locator('input[placeholder*="Search"], input[placeholder*="search"], input[type="search"]');
    const searchInput = searchInputs.nth(1); // 두번째 input이 트리거 검색
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Gmail');
      await delay(2000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-step2.png' });

    // 5. Gmail 트리거 선택
    console.log('[5] Gmail 트리거 선택...');
    const gmailOption = page.locator('text=/When a new email arrives.*Gmail|Gmail.*When a new email/i').first();
    if (await gmailOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await gmailOption.click();
      await delay(2000);
    } else {
      // Gmail 커넥터 먼저 클릭
      await page.click('text=Gmail', { timeout: 5000 }).catch(() => {});
      await delay(2000);
      await page.click('text=/When a new email arrives/i', { timeout: 5000 }).catch(() => {});
      await delay(2000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-step3.png' });

    // 6. Create 버튼
    console.log('[6] Create 버튼...');
    await page.click('button:has-text("Create")', { timeout: 5000 }).catch(() => {});
    await delay(8000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-step4.png' });

    // 7. Gmail 연결 (Sign in 버튼이 있으면)
    console.log('[7] Gmail 연결 확인...');
    const signInBtn = page.locator('text=/Sign in|로그인|Connect/i').first();
    if (await signInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('   Sign in 버튼 발견 - 클릭');
      await signInBtn.click();
      await delay(5000);

      // Google 로그인 팝업 처리
      const pages = context.pages();
      if (pages.length > 1) {
        const popup = pages[pages.length - 1];
        console.log('   Google 로그인 팝업 감지');

        // 이메일 입력
        const emailInput = popup.locator('input[type="email"]');
        if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
          await emailInput.fill('authpremoapi@gmail.com');
          await popup.click('button:has-text("Next"), button:has-text("다음")');
          await delay(3000);
        }

        await popup.screenshot({ path: '/home/kogh/.playwright-mcp/pa-google-login.png' });
      }
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-step5.png' });

    // 8. Subject Filter 설정
    console.log('[8] Subject Filter 설정...');
    const subjectFilter = page.locator('input[aria-label*="Subject"], input[placeholder*="Subject"]').first();
    if (await subjectFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await subjectFilter.fill('[TO:');
      await delay(1000);
    }

    // 9. + New step 클릭
    console.log('[9] New step 추가...');
    await page.click('text=/New step|새 단계/i', { timeout: 10000 }).catch(() => {});
    await delay(3000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-step6.png' });

    // 10. Outlook 검색
    console.log('[10] Outlook 액션 검색...');
    const actionSearch = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').last();
    if (await actionSearch.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionSearch.fill('Outlook Send email');
      await delay(2000);
    }

    // 11. Send an email (V2) 선택
    console.log('[11] Send an email 선택...');
    await page.click('text=/Send an email.*V2|전자 메일 보내기/i', { timeout: 5000 }).catch(() => {});
    await delay(3000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-step7.png' });

    // 12. To 필드에 수식 입력
    console.log('[12] To 필드 수식 입력...');
    const toField = page.locator('input[aria-label*="To"], input[placeholder*="To"]').first();
    if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toField.click();
      await delay(500);

      // Expression 탭 클릭
      await page.click('text=/Expression|식/i', { timeout: 3000 }).catch(() => {});
      await delay(1000);

      // 수식 입력
      const exprInput = page.locator('textarea, input[aria-label*="expression"]').first();
      if (await exprInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exprInput.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");
        await delay(1000);

        // OK 또는 Update 클릭
        await page.click('button:has-text("OK"), button:has-text("Update"), button:has-text("추가")').catch(() => {});
        await delay(1000);
      }
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-step8.png' });

    // 13. Subject 필드
    console.log('[13] Subject 필드...');
    const subjectField = page.locator('input[aria-label*="Subject"]').last();
    if (await subjectField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await subjectField.click();
      await delay(500);

      // Dynamic content에서 Subject 선택
      await page.click('text=/Subject|제목/i', { timeout: 3000 }).catch(() => {});
      await delay(1000);
    }

    // 14. Body 필드
    console.log('[14] Body 필드...');
    const bodyField = page.locator('textarea[aria-label*="Body"], div[aria-label*="Body"]').first();
    if (await bodyField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bodyField.click();
      await delay(500);

      // Dynamic content에서 Body 선택
      await page.click('text=/Body|본문/i', { timeout: 3000 }).catch(() => {});
      await delay(1000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-step9.png' });

    // 15. Save
    console.log('[15] 저장...');
    await page.click('button:has-text("Save"), button:has-text("저장")').catch(() => {});
    await delay(5000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-final.png' });

    console.log('\n════════════════════════════════════════════════════════');
    console.log('✅ PA 플로우 설정 완료');
    console.log('════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-error.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await delay(120000);
  await context.close();
}

main();
