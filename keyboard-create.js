const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] Tab으로 버튼 포커스 이동...');
  
  // 여러 번 Tab을 눌러 Create 버튼으로 이동
  for (var i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
  }
  
  await page.screenshot({ path: 'C:\\temp\\pa-tab-focus.png' });
  
  console.log('[2] Enter 키 누르기...');
  await page.keyboard.press('Enter');
  
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'C:\\temp\\pa-after-enter.png' });
  
  var currentUrl = page.url();
  console.log('[3] 현재 URL:', currentUrl);
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
