const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // Sign in 버튼 클릭
  console.log('[1] Sign in 클릭...');
  const signIn = await page.locator('button:has-text("Sign in")').first();
  if (await signIn.isVisible()) {
    await signIn.click();
    console.log('   ✓ Sign in 클릭됨');
  }
  
  // 팝업 대기
  console.log('[2] 로그인 팝업 대기...');
  await page.waitForTimeout(5000);
  
  // 모든 페이지 확인
  const allPages = context.pages();
  console.log('   페이지 수:', allPages.length);
  
  for (const p of allPages) {
    const url = p.url();
    console.log('   -', url.substring(0, 70));
    
    // Microsoft 로그인 페이지 처리
    if (url.includes('login.microsoftonline.com') || url.includes('login.live.com')) {
      console.log('   ✓ Microsoft 로그인 팝업 발견!');
      
      // 이미 로그인되어 있으면 자동으로 진행될 수 있음
      await p.waitForTimeout(3000);
      
      // 계정 선택 화면인지 확인
      const accountTile = await p.locator('[data-test-id="accountList"]').first();
      if (await accountTile.isVisible()) {
        await accountTile.click();
        console.log('   ✓ 계정 선택됨');
      }
    }
  }
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '.playwright-mcp/after-signin.png' });
  console.log('📸 스크린샷 저장');
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
