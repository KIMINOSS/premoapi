const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] Flow name 입력...');
  
  // Flow name 입력
  const nameInput = await page.locator('input').filter({ hasText: '' }).first();
  await nameInput.fill('PREMO-Gmail-Auth');
  console.log('   이름 입력됨');
  
  console.log('[2] 트리거 검색 필드에 Gmail 입력...');
  
  // Search all triggers 필드 찾기
  const searchInput = await page.locator('input[placeholder*="Search"], input[placeholder*="trigger"]').first();
  
  const isVisible = await searchInput.isVisible().catch(function() { return false; });
  if (isVisible) {
    await searchInput.click();
    await searchInput.fill('Gmail');
    console.log('   Gmail 입력됨');
    await page.waitForTimeout(2500);
  } else {
    // 다른 방법으로 검색 필드 찾기
    const allInputs = await page.locator('input').all();
    for (let i = 0; i < allInputs.length; i++) {
      const placeholder = await allInputs[i].getAttribute('placeholder').catch(function() { return ''; });
      if (placeholder && placeholder.toLowerCase().includes('trigger')) {
        await allInputs[i].fill('Gmail');
        console.log('   Gmail 입력됨 (input ' + i + ')');
        await page.waitForTimeout(2500);
        break;
      }
    }
  }
  
  await page.screenshot({ path: 'C:\\temp\\pa-gmail-search-result.png' });
  
  console.log('[3] Gmail 트리거 옵션 확인...');
  
  // 페이지 내 모든 텍스트 확인
  const visibleText = await page.evaluate(function() {
    var results = [];
    var items = document.querySelectorAll('[role="option"], [role="listitem"], [class*="trigger"], [class*="list"]');
    items.forEach(function(item) {
      var text = item.textContent || '';
      if (text.length > 5 && text.length < 100) {
        results.push(text.trim().substring(0, 60));
      }
    });
    return results.slice(0, 15);
  });
  
  console.log('   발견된 옵션들:');
  visibleText.forEach(function(t, i) { console.log('   [' + i + '] ' + t); });
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
