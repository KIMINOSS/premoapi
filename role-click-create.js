const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] getByRole로 Create 버튼 찾기...');
  
  var createBtn = page.getByRole('button', { name: 'Create' });
  var count = await createBtn.count();
  console.log('   Create 버튼 수:', count);
  
  if (count > 0) {
    // 첫 번째 버튼 클릭
    await createBtn.first().click();
    console.log('   첫 번째 Create 버튼 클릭됨');
    await page.waitForTimeout(6000);
  }
  
  await page.screenshot({ path: 'C:\\temp\\pa-role-click.png' });
  
  var currentUrl = page.url();
  console.log('[2] 현재 URL:', currentUrl);
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
