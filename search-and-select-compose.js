const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    await dialog.dismiss().catch(function() {});
  });

  await page.screenshot({ path: 'C:\\temp\\pa-state-now.png' });

  console.log('[1] 현재 상태 확인...');

  // 검색 필드가 있는지 확인
  var searchInput = page.locator('input[placeholder*="Search"]').first();
  var isVisible = await searchInput.isVisible().catch(function() { return false; });

  if (!isVisible) {
    console.log('   검색 필드 없음. Insert action 버튼 다시 클릭...');
    await page.mouse.click(515, 232);
    await page.waitForTimeout(2000);
  }

  console.log('[2] 검색 필드에 "Variable" 입력 (더 일반적인 액션)...');

  searchInput = page.locator('input[placeholder*="Search"]').first();
  isVisible = await searchInput.isVisible().catch(function() { return false; });

  if (isVisible) {
    await searchInput.click();
    await searchInput.fill('');
    await page.waitForTimeout(500);
    await searchInput.type('Initialize variable', { delay: 50 });
    console.log('   입력됨');
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-variable-search.png' });

  console.log('[3] 검색 결과 분석...');

  var searchResults = await page.evaluate(function() {
    var results = [];
    // 목록 항목들 찾기
    var items = document.querySelectorAll('[role="listitem"], [role="row"], [role="option"], [class*="item"], [class*="Item"]');
    items.forEach(function(item) {
      var text = item.innerText || '';
      var rect = item.getBoundingClientRect();
      // 검색 결과 영역 (y > 250)
      if (rect.y > 250 && rect.y < 700 && rect.width > 100 && text.length > 0 && text.length < 200) {
        results.push({
          text: text.substring(0, 80).replace(/\\n/g, ' '),
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2)
        });
      }
    });
    return results.slice(0, 10);
  });

  console.log('   검색 결과:');
  searchResults.forEach(function(r, i) {
    console.log('   [' + i + '] ' + r.text + ' (y=' + r.y + ')');
  });

  // 첫 번째 결과 클릭
  if (searchResults.length > 0) {
    console.log('[4] 첫 번째 결과 클릭...');
    await page.mouse.click(searchResults[0].x, searchResults[0].y);
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-action-selected.png' });

  console.log('[5] 액션 추가 확인...');

  var actionAdded = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasVariable: text.indexOf('Initialize variable') >= 0,
      hasCompose: text.indexOf('Compose') >= 0,
      actionCount: (text.match(/step/gi) || []).length
    };
  });

  console.log('   액션 상태:', actionAdded);

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
