const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] Create 버튼 클릭...');
  
  const createBtn = await page.locator('button').filter({ hasText: /^Create$/ }).first();
  var btnVisible = await createBtn.isVisible().catch(function() { return false; });
  
  if (btnVisible) {
    await createBtn.click();
    console.log('   Create 클릭됨');
    await page.waitForTimeout(5000);
  }
  
  await page.screenshot({ path: 'C:\\temp\\pa-flow-created-final.png' });
  
  // 현재 URL 확인
  var currentUrl = page.url();
  console.log('[2] 현재 URL:', currentUrl);
  
  // Gmail 연결 확인
  console.log('[3] Gmail 연결 확인...');
  
  var pageContent = await page.evaluate(function() {
    return document.body.innerText.substring(0, 500);
  });
  
  console.log('   페이지 내용:', pageContent.substring(0, 200));
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
