const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 1. Change connection 클릭
  console.log('[1] Change connection 클릭...');
  const changeConn = await page.locator('text=Change connection').first();
  if (await changeConn.isVisible()) {
    await changeConn.click();
    console.log('   ✓ Change connection 클릭됨');
    await page.waitForTimeout(2000);
  }
  
  await page.screenshot({ path: '.playwright-mcp/change-connection.png' });
  
  // 2. 연결 옵션 확인
  console.log('[2] 연결 옵션 확인...');
  
  // Sign in 또는 Add new connection
  const signIn = await page.locator('button:has-text("Sign in"), a:has-text("Add new")').first();
  if (await signIn.isVisible()) {
    await signIn.click();
    console.log('   ✓ Sign in / Add new 클릭됨');
    await page.waitForTimeout(5000);
  }
  
  // 3. 로그인 팝업 확인
  const allPages = context.pages();
  console.log('   열린 페이지 수:', allPages.length);
  
  for (const p of allPages) {
    const url = p.url();
    console.log('   -', url.substring(0, 60));
  }
  
  await page.screenshot({ path: '.playwright-mcp/login-popup.png' });
  console.log('📸 스크린샷 저장');
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
