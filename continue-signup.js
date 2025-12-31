const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const allPages = context.pages();
  
  console.log('페이지 수:', allPages.length);
  
  for (const p of allPages) {
    const url = p.url();
    console.log('URL:', url.substring(0, 60));
    
    await p.screenshot({ path: '.playwright-mcp/current-state.png' });
  }
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
