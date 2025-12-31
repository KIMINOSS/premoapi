const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    await dialog.dismiss().catch(function() {});
  });

  await page.screenshot({ path: 'C:\\temp\\pa-search-1.png' });

  console.log('[1] 현재 검색 패널 분석...');

  // 검색 결과 영역 확인
  var searchResults = await page.evaluate(function() {
    var results = [];
    // 모든 텍스트 요소 중 검색 결과 영역에 있는 것들
    var elements = document.querySelectorAll('[role="option"], [role="listitem"], [role="row"], [class*="item"], [class*="result"]');

    elements.forEach(function(el) {
      var text = el.innerText || '';
      var rect = el.getBoundingClientRect();
      if (rect.y > 200 && rect.y < 700 && rect.width > 100 && text.length > 0 && text.length < 200) {
        results.push({
          text: text.substring(0, 80).replace(/\n/g, ' '),
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2)
        });
      }
    });

    return results.slice(0, 15);
  });

  console.log('   검색 결과:');
  searchResults.forEach(function(r, i) {
    console.log('   [' + i + '] ' + r.text + ' (y=' + r.y + ')');
  });

  // 검색 필드 클리어 후 재검색
  console.log('[2] 검색 필드 클리어 후 재검색...');

  var searchInput = page.locator('input[placeholder*="Search"]').first();
  var isVisible = await searchInput.isVisible().catch(function() { return false; });

  if (isVisible) {
    // 기존 내용 지우기
    await searchInput.click();
    await searchInput.fill('');
    await page.waitForTimeout(500);

    // Variable 검색 (더 일반적인 Built-in 액션)
    await page.keyboard.type('variable', { delay: 50 });
    console.log('   "variable" 입력됨');
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-search-variable.png' });

  console.log('[3] Variable 검색 결과 분석...');

  var varResults = await page.evaluate(function() {
    var results = [];
    var elements = document.querySelectorAll('*');

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var text = el.innerText || '';
      var rect = el.getBoundingClientRect();

      // Variable 관련 항목
      if ((text.indexOf('Variable') >= 0 || text.indexOf('Initialize') >= 0) && rect.y > 250 && rect.y < 650 && rect.height > 20 && rect.height < 100) {
        results.push({
          text: text.substring(0, 60).replace(/\n/g, ' '),
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2)
        });
      }
    }

    // 중복 제거
    var seen = {};
    return results.filter(function(r) {
      var key = r.x + '-' + r.y;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    }).slice(0, 10);
  });

  console.log('   Variable 결과:');
  varResults.forEach(function(r, i) {
    console.log('   [' + i + '] ' + r.text + ' (x=' + r.x + ', y=' + r.y + ')');
  });

  // 첫 번째 Variable 항목 클릭
  if (varResults.length > 0) {
    console.log('[4] 첫 번째 Variable 항목 클릭...');
    await page.mouse.click(varResults[0].x, varResults[0].y);
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-variable-clicked.png' });

  console.log('[5] 액션 추가 확인...');

  var actionState = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasVariable: text.indexOf('Initialize variable') >= 0,
      hasInputs: text.indexOf('Name') >= 0 && text.indexOf('Type') >= 0,
      stillNeedsAction: text.indexOf('should contain at least one trigger and one action') >= 0
    };
  });

  console.log('   상태:', actionState);

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
