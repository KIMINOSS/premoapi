const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const allPages = context.pages();
  
  for (const p of allPages) {
    const url = p.url();
    if (url.includes('login') || url.includes('signup') || url.includes('microsoft')) {
      await p.screenshot({ path: '.playwright-mcp/current-state.png' });
      
      // 동의 버튼 찾기 및 클릭
      console.log('[1] 동의 버튼 클릭...');
      
      // JavaScript로 직접 클릭
      const clicked = await p.evaluate(() => {
        const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
        for (const btn of buttons) {
          const text = btn.textContent || btn.value || '';
          if (text.includes('동의') || text.includes('Agree') || text.includes('Accept')) {
            btn.click();
            return 'clicked: ' + text;
          }
        }
        return 'not found';
      });
      
      console.log('   결과:', clicked);
      await p.waitForTimeout(3000);
      await p.screenshot({ path: '.playwright-mcp/after-click.png' });
    }
  }
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
