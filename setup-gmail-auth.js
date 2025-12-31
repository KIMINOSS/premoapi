const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const pages = context.pages();
  let page = pages.find(p => p.url().includes('powerautomate')) || pages[0];
  
  console.log('현재 URL:', page.url());
  
  // Create 버튼 클릭
  console.log('[1] Create 버튼 클릭...');
  const createBtn = await page.locator('button:has-text("Create")').first();
  if (await createBtn.isVisible()) {
    await createBtn.click();
    await page.waitForTimeout(5000);
    console.log('   ✓ Create 클릭됨');
  }
  
  await page.screenshot({ path: '.playwright-mcp/after-create.png' });
  console.log('📸 Create 후 스크린샷');
  
  // Gmail 카드 클릭
  console.log('[2] Gmail 트리거 카드 클릭...');
  await page.waitForTimeout(2000);
  const gmailCard = await page.locator('[class*="msla-panel"], [class*="card"], [data-automation-id]').first();
  if (await gmailCard.isVisible()) {
    await gmailCard.click();
    await page.waitForTimeout(2000);
  }
  
  // Sign in 버튼 찾기
  console.log('[3] Sign in 버튼 찾기...');
  const signInBtn = await page.locator('button:has-text("Sign in"), a:has-text("Sign in"), button:has-text("연결"), a:has-text("Change connection")').first();
  if (await signInBtn.isVisible()) {
    console.log('   Sign in 버튼 발견!');
    await signInBtn.click();
    await page.waitForTimeout(3000);
  } else {
    // 다른 연결 관련 요소 찾기
    const connectLink = await page.locator('text=/Sign in|연결|Connect|Change connection/i').first();
    if (await connectLink.isVisible()) {
      await connectLink.click();
      await page.waitForTimeout(3000);
    }
  }
  
  await page.screenshot({ path: '.playwright-mcp/gmail-signin.png' });
  console.log('📸 Sign in 스크린샷');
  
  // Google 로그인 팝업 처리
  console.log('[4] Google 로그인 팝업 확인...');
  const allPages = context.pages();
  console.log('   열린 페이지 수:', allPages.length);
  
  for (const p of allPages) {
    const url = p.url();
    console.log('   -', url.substring(0, 50));
    if (url.includes('accounts.google.com')) {
      console.log('   ✓ Google 로그인 팝업 발견!');
      // 이메일 입력
      const emailInput = await p.locator('input[type="email"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill('koghminho@gmail.com');
        await p.locator('button:has-text("Next"), button:has-text("다음")').first().click();
        await p.waitForTimeout(3000);
      }
    }
  }
  
  await page.screenshot({ path: '.playwright-mcp/gmail-auth-final.png' });
  console.log('\n✅ Gmail 인증 설정 진행됨');
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
