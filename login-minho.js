const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const allPages = context.pages();
  
  console.log('페이지 수:', allPages.length);
  
  for (const p of allPages) {
    const url = p.url();
    console.log('-', url.substring(0, 50));
    
    if (url.includes('login.live.com') || url.includes('login.microsoftonline.com')) {
      console.log('[1] 로그인 팝업 처리...');
      
      // "다른 계정으로 로그인" 클릭
      const otherAccount = await p.locator('text=다른 계정으로 로그인').first();
      if (await otherAccount.isVisible()) {
        await otherAccount.click();
        await p.waitForTimeout(2000);
        console.log('   ✓ 다른 계정 클릭');
      }
      
      // 이메일 입력
      const emailInput = await p.locator('input[type="email"], input[name="loginfmt"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.clear();
        await emailInput.fill('minho.kim@grupopremo.com');
        console.log('   ✓ 이메일 입력됨: minho.kim@grupopremo.com');
        await p.waitForTimeout(500);
        
        // Next 버튼
        const nextBtn = await p.locator('input[type="submit"], button[type="submit"]').first();
        if (await nextBtn.isVisible()) {
          await nextBtn.click();
          console.log('   ✓ Next 클릭됨');
        }
      }
      
      await p.waitForTimeout(5000);
      await p.screenshot({ path: '.playwright-mcp/minho-login.png' });
    }
  }
  
  // 메인 페이지
  const mainPage = allPages[0];
  await mainPage.screenshot({ path: '.playwright-mcp/after-email.png' });
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
