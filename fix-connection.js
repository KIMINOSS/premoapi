const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('URL:', page.url());
  
  // 1. 팝업들 닫기
  console.log('[1] 팝업 닫기...');
  
  // Got it 버튼
  const gotIt = await page.locator('button:has-text("Got it")').first();
  if (await gotIt.isVisible()) {
    await gotIt.click();
    console.log('   ✓ Got it 클릭');
  }
  
  // Copilot X 버튼
  const closeBtn = await page.locator('[aria-label="Close"], button:has-text("Close")').first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    console.log('   ✓ Copilot 닫기');
  }
  
  await page.waitForTimeout(1000);
  
  // 2. 트리거 카드 클릭
  console.log('[2] 트리거 카드 클릭...');
  const triggerCard = await page.locator('text=When a new email arrives').first();
  if (await triggerCard.isVisible()) {
    await triggerCard.click();
    await page.waitForTimeout(2000);
    console.log('   ✓ 트리거 카드 클릭됨');
  }
  
  await page.screenshot({ path: '.playwright-mcp/trigger-panel.png' });
  
  // 3. Sign in 또는 연결 버튼 클릭
  console.log('[3] 연결 설정...');
  const signIn = await page.locator('button:has-text("Sign in"), a:has-text("Sign in"), button:has-text("update"), a:has-text("update")').first();
  if (await signIn.isVisible()) {
    await signIn.click();
    console.log('   ✓ Sign in 클릭됨');
    await page.waitForTimeout(5000);
  }
  
  // 4. 팝업 창 확인
  const allPages = context.pages();
  console.log('   열린 페이지 수:', allPages.length);
  
  for (const p of allPages) {
    const url = p.url();
    if (url.includes('login.microsoftonline') || url.includes('accounts.google.com')) {
      console.log('   ✓ 로그인 팝업 발견:', url.substring(0, 50));
    }
  }
  
  await page.screenshot({ path: '.playwright-mcp/connection-setup.png' });
  console.log('📸 스크린샷 저장');
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
