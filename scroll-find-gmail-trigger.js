const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] 트리거 목록 스크롤 위로...');
  
  // 목록 영역 찾기
  var listArea = page.locator('[role="listbox"], .ms-ScrollablePane, [class*="scroll"]').first();
  
  // 스크롤 위로
  await listArea.evaluate(function(el) {
    el.scrollTop = 0;
  }).catch(function() {});
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:\\temp\\pa-scroll-top.png' });
  
  console.log('[2] 페이지에서 Gmail 텍스트 찾기...');
  
  var gmailElements = await page.evaluate(function() {
    var results = [];
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var text = all[i].textContent || '';
      if (text.toLowerCase().includes('gmail') && text.length < 80) {
        results.push({
          tag: all[i].tagName,
          text: text.trim()
        });
      }
    }
    return results.slice(0, 15);
  });
  
  console.log('   Gmail 요소:', JSON.stringify(gmailElements.slice(0, 5), null, 2));
  
  console.log('[3] Gmail 아이콘이 있는 트리거 찾기...');
  
  // Gmail 아이콘(빨간 M 로고)이 있는 요소 찾기
  var gmailOption = page.locator('[aria-label*="Gmail"], [title*="Gmail"]').first();
  var isVisible = await gmailOption.isVisible().catch(function() { return false; });
  
  if (isVisible) {
    await gmailOption.click();
    console.log('   Gmail 옵션 클릭됨');
  } else {
    // 텍스트로 찾기 - 정확한 Gmail 매치
    var gmailText = page.locator('span, div').filter({ hasText: /^Gmail$/ }).first();
    isVisible = await gmailText.isVisible().catch(function() { return false; });
    if (isVisible) {
      await gmailText.click();
      console.log('   Gmail 텍스트 클릭됨');
    }
  }
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:\\temp\\pa-gmail-found.png' });
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
