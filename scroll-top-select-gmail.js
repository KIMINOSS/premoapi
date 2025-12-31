const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] 검색 필드 클리어 후 Gmail 재검색...');
  
  var searchInput = page.locator('input[placeholder*="Search all triggers"]');
  await searchInput.fill('');
  await searchInput.fill('Gmail new email');
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'C:\\temp\\pa-gmail-newsearch.png' });
  
  console.log('[2] 트리거 목록 스크롤 맨 위로...');
  
  // 키보드로 목록 맨 위로 이동
  await page.keyboard.press('Home');
  await page.waitForTimeout(500);
  
  // 또는 JavaScript로 스크롤
  await page.evaluate(function() {
    var lists = document.querySelectorAll('[class*="scroll"], [role="listbox"], [role="grid"]');
    lists.forEach(function(list) {
      list.scrollTop = 0;
    });
  });
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:\\temp\\pa-scroll-top2.png' });
  
  console.log('[3] 첫 번째 Gmail 관련 항목 클릭...');
  
  // Gmail이 포함된 첫 번째 항목 찾기
  var gmailItem = page.locator('[role="row"], [role="option"], div').filter({ 
    hasText: /Gmail/ 
  }).first();
  
  var isVisible = await gmailItem.isVisible().catch(function() { return false; });
  if (isVisible) {
    await gmailItem.click();
    console.log('   Gmail 항목 클릭됨');
    await page.waitForTimeout(1000);
  }
  
  await page.screenshot({ path: 'C:\\temp\\pa-gmail-item-clicked.png' });
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
