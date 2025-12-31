const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] Create 버튼 찾기...');
  
  // 모든 버튼 확인
  var buttons = await page.locator('button').all();
  console.log('   버튼 수:', buttons.length);
  
  for (var i = 0; i < buttons.length; i++) {
    var text = await buttons[i].textContent().catch(function() { return ''; });
    if (text && text.trim() === 'Create') {
      console.log('   Create 버튼 발견 (index ' + i + ')');
      
      // 강제 클릭
      await buttons[i].click({ force: true });
      console.log('   클릭됨');
      await page.waitForTimeout(6000);
      break;
    }
  }
  
  await page.screenshot({ path: 'C:\\temp\\pa-after-force-create.png' });
  
  var currentUrl = page.url();
  console.log('[2] 현재 URL:', currentUrl);
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
