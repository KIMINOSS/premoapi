const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const allPages = context.pages();
  
  console.log('페이지 수:', allPages.length);
  
  for (const p of allPages) {
    const url = p.url();
    if (url.includes('login')) {
      console.log('로그인 페이지 발견:', url.substring(0, 50));
      
      await p.screenshot({ path: '.playwright-mcp/current-login.png' });
      
      // 현재 상태 확인
      const content = await p.content();
      
      // 다른 계정 옵션
      if (content.includes('다른 계정') || content.includes('another account')) {
        const other = await p.locator('text=다른 계정으로 로그인').first();
        if (await other.isVisible()) {
          await other.click();
          console.log('   ✓ 다른 계정 클릭');
          await p.waitForTimeout(2000);
        }
      }
      
      // 이메일 입력 필드
      const emailInput = await p.locator('input[type="email"], input[name="loginfmt"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill('minho.kim@grupopremo.com');
        console.log('   ✓ 이메일 입력됨');
        
        // 다음 버튼 (여러 가능한 셀렉터)
        await p.waitForTimeout(500);
        await p.keyboard.press('Enter');
        console.log('   ✓ Enter 키 전송');
      }
      
      await p.waitForTimeout(5000);
      await p.screenshot({ path: '.playwright-mcp/after-email-entry.png' });
    }
  }
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
