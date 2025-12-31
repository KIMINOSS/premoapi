const { chromium } = require('playwright');

async function main() {
  console.log('🔗 기존 Edge 브라우저에 연결...');
  
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  console.log('✅ 연결 성공');
  
  const context = browser.contexts()[0];
  
  // 새 탭에서 첫 화면 열기
  const page = await context.newPage();
  await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
  
  console.log('✅ 첫 화면 오픈 완료');
  console.log('   URL:', page.url());
  
  // 스크린샷
  await page.screenshot({ path: '.playwright-mcp/premo-homepage.png', fullPage: true });
  console.log('📸 스크린샷 저장: .playwright-mcp/premo-homepage.png');
  
  await browser.close();
}

main().catch(e => console.error('❌ 오류:', e.message));
