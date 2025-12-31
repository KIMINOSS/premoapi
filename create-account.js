const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const allPages = context.pages();
  
  for (const p of allPages) {
    const url = p.url();
    if (url.includes('login')) {
      console.log('[1] 계정 만들기 클릭...');
      
      // "계정 만들기" 링크 클릭
      const createAccount = await p.locator('text=계정 만들기').first();
      if (await createAccount.isVisible()) {
        await createAccount.click();
        console.log('   ✓ 계정 만들기 클릭됨');
        await p.waitForTimeout(3000);
      }
      
      await p.screenshot({ path: '.playwright-mcp/create-account.png' });
    }
  }
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
