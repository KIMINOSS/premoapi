const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] Flow name 입력...');
  
  // Flow name 필드에 입력
  const flowNameInput = await page.locator('input[placeholder*="name"], input[placeholder*="이름"]').first();
  var nameVisible = await flowNameInput.isVisible().catch(function() { return false; });
  
  if (!nameVisible) {
    // 첫 번째 텍스트 입력 필드 사용
    const firstInput = await page.locator('input[type="text"]').first();
    await firstInput.fill('PREMO-Gmail-Auth');
    console.log('   Flow name 입력됨');
  } else {
    await flowNameInput.fill('PREMO-Gmail-Auth');
    console.log('   Flow name 입력됨');
  }
  
  console.log('[2] Search all triggers 필드에 Gmail 입력...');
  
  // Search all triggers 필드 클릭 및 입력
  const searchField = await page.locator('input[placeholder*="Search all triggers"]').first();
  var searchVisible = await searchField.isVisible().catch(function() { return false; });
  
  if (searchVisible) {
    await searchField.click();
    await searchField.fill('Gmail');
    console.log('   Gmail 입력됨');
  } else {
    // placeholder로 찾기
    const inputs = await page.locator('input').all();
    for (var i = 0; i < inputs.length; i++) {
      var ph = await inputs[i].getAttribute('placeholder').catch(function() { return ''; });
      console.log('   input[' + i + '] placeholder: ' + ph);
      if (ph && ph.includes('Search')) {
        await inputs[i].click();
        await inputs[i].fill('Gmail');
        console.log('   Gmail 입력됨 (input ' + i + ')');
        break;
      }
    }
  }
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:\\temp\\pa-gmail-search2.png' });
  
  console.log('[3] Gmail 검색 결과 확인...');
  
  // 스크롤하여 Gmail 트리거 찾기
  const triggerList = await page.locator('[role="listbox"], [role="list"], .ms-ScrollablePane').first();
  var listVisible = await triggerList.isVisible().catch(function() { return false; });
  
  if (listVisible) {
    // 스크롤 다운
    await triggerList.evaluate(function(el) { el.scrollTop += 300; });
    await page.waitForTimeout(500);
  }
  
  // 페이지에서 Gmail 관련 요소 찾기
  const gmailElements = await page.evaluate(function() {
    var results = [];
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var text = (all[i].textContent || '').toLowerCase();
      if (text.includes('gmail') && text.length < 100) {
        results.push({
          tag: all[i].tagName,
          text: all[i].textContent.substring(0, 60)
        });
      }
    }
    return results.slice(0, 10);
  });
  
  console.log('   Gmail 관련 요소:', JSON.stringify(gmailElements, null, 2));
  
  await page.screenshot({ path: 'C:\\temp\\pa-gmail-results.png' });
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
