/**
 * PA 간단한 Gmail 플로우 생성
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🤖 PA Gmail 플로우...\n');

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
    console.log('[1] Create 페이지...');
    await page.goto('https://make.powerautomate.com/create', { timeout: 60000 });
    await page.waitForTimeout(5000);

    // 2. Automated cloud flow
    console.log('[2] Automated cloud flow...');
    await page.locator('text=Automated cloud flow').first().click();
    await page.waitForTimeout(4000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf1.png' });

    // 3. 플로우 이름
    console.log('[3] 플로우 이름...');
    const inputs = await page.locator('input').all();
    console.log(`   input 개수: ${inputs.length}`);

    // 첫번째 input이 flow name
    if (inputs.length > 0) {
      await inputs[0].fill('PREMO-Auth-Forward');
    }
    await page.waitForTimeout(1000);

    // 4. Gmail 검색
    console.log('[4] Gmail 검색...');
    // 검색 input 찾기 (보통 2번째 또는 placeholder 있는 것)
    for (let i = 0; i < inputs.length; i++) {
      const placeholder = await inputs[i].getAttribute('placeholder');
      if (placeholder && placeholder.toLowerCase().includes('search')) {
        console.log(`   검색창 발견: index ${i}`);
        await inputs[i].fill('Gmail');
        break;
      }
    }
    await page.waitForTimeout(3000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf2.png' });

    // 5. Gmail 커넥터 클릭
    console.log('[5] Gmail 클릭...');
    const gmail = page.locator('img[alt*="Gmail"], [aria-label*="Gmail"], text=Gmail').first();
    if (await gmail.isVisible({ timeout: 5000 }).catch(() => false)) {
      await gmail.click();
      await page.waitForTimeout(2000);
    }

    // 6. When a new email arrives 선택
    console.log('[6] 트리거 선택...');
    const trigger = page.locator('text=/When a new email arrives/i').first();
    if (await trigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await trigger.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf3.png' });

    // 7. Create 버튼 찾기
    console.log('[7] Create 버튼...');
    const allButtons = await page.locator('button').all();
    console.log(`   버튼 개수: ${allButtons.length}`);

    for (const btn of allButtons) {
      const text = await btn.textContent();
      if (text && text.includes('Create')) {
        console.log(`   Create 버튼 발견: "${text}"`);
        const isDisabled = await btn.isDisabled();
        console.log(`   비활성화 상태: ${isDisabled}`);
        if (!isDisabled) {
          await btn.click();
          console.log('   Create 클릭됨');
          break;
        }
      }
    }
    await page.waitForTimeout(8000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf4.png' });

    // 8. 플로우 편집 화면 확인
    console.log('[8] 편집 화면...');

    // Gmail Sign in 필요시
    const signIn = page.locator('button:has-text("Sign in"), text=/Sign in/i').first();
    if (await signIn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('   Gmail Sign in 필요');
      await signIn.click();
      await page.waitForTimeout(8000);

      // Google 팝업
      const pages = context.pages();
      console.log(`   페이지 수: ${pages.length}`);

      if (pages.length > 1) {
        const popup = pages[pages.length - 1];

        // 계정 선택 또는 이메일 입력
        const account = popup.locator('text=authpremoapi@gmail.com').first();
        if (await account.isVisible({ timeout: 3000 }).catch(() => false)) {
          await account.click();
        } else {
          const emailInput = popup.locator('input[type="email"]').first();
          if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await emailInput.fill('authpremoapi@gmail.com');
            await popup.locator('button:has-text("Next")').first().click();
          }
        }
        await page.waitForTimeout(5000);
      }
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf5.png' });

    console.log('\n📌 현재 상태 캡처됨');
    console.log('   스크린샷: pf1.png ~ pf5.png');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pf-error.png' });
  }

  console.log('\n⏳ 브라우저 180초 유지...');
  await page.waitForTimeout(180000);
  await context.close();
}

main();
