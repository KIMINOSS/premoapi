const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] Flow name 입력...');
  var nameInput = page.locator('input').first();
  await nameInput.fill('PREMO-Gmail-Auth');
  
  console.log('[2] Skip 버튼 클릭...');
  var skipBtn = page.getByRole('button', { name: 'Skip' });
  await skipBtn.click();
  console.log('   Skip 클릭됨');
  
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'C:\\temp\\pa-after-skip.png' });
  
  var currentUrl = page.url();
  console.log('[3] 현재 URL:', currentUrl);
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
