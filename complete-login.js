const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const allPages = context.pages();
  
  console.log('페이지 수:', allPages.length);
  
  // Microsoft 로그인 팝업 찾기
  for (const p of allPages) {
    const url = p.url();
    console.log('-', url.substring(0, 60));
    
    if (url.includes('login.live.com') || url.includes('login.microsoftonline.com')) {
      console.log('   ✓ 로그인 팝업 처리...');
      
      await p.screenshot({ path: '.playwright-mcp/login-popup-state.png' });
      
      // 계정 선택 또는 이메일 입력
      const emailInput = await p.locator('input[type="email"], input[name="loginfmt"]').first();
      if (await emailInput.isVisible()) {
        console.log('   이메일 입력 필요');
        // 여기에 이메일 입력이 필요하면 사용자에게 알림
      }
      
      // 이미 계정이 선택된 경우
      const accountTile = await p.locator('[data-test-id*="account"], .table').first();
      if (await accountTile.isVisible()) {
        await accountTile.click();
        console.log('   ✓ 계정 타일 클릭');
      }
      
      // Stay signed in 확인
      const staySignedIn = await p.locator('button:has-text("Yes"), input[value="Yes"]').first();
      if (await staySignedIn.isVisible()) {
        await staySignedIn.click();
        console.log('   ✓ Stay signed in 클릭');
      }
      
      await p.waitForTimeout(3000);
    }
  }
  
  // 메인 페이지 확인
  const mainPage = allPages[0];
  await mainPage.waitForTimeout(5000);
  await mainPage.screenshot({ path: '.playwright-mcp/connection-result.png' });
  
  // 연결 상태 확인
  const content = await mainPage.content();
  if (content.includes('Connected') || !content.includes('Not connected')) {
    console.log('✅ 연결 성공!');
  } else if (content.includes('Signing in')) {
    console.log('⏳ 로그인 진행 중...');
  }
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
