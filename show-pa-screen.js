const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 브라우저 연결...');
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  console.log('✅ 연결 성공');
  
  const context = browser.contexts()[0];
  const pages = context.pages();
  let page = pages.find(p => p.url().includes('powerautomate')) || pages[0];
  
  console.log('현재 URL:', page.url());
  
  // 스크린샷
  await page.screenshot({ path: '.playwright-mcp/pa-current.png', fullPage: false });
  console.log('📸 스크린샷: .playwright-mcp/pa-current.png');
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
