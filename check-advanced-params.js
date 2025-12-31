const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  await page.screenshot({ path: 'C:\\temp\\pa-current-view.png' });

  console.log('[1] 페이지 전체 텍스트에서 설정 관련 키워드 검색...');

  var pageContent = await page.evaluate(function() {
    return document.body.innerText.substring(0, 3000);
  });

  // 주요 키워드 확인
  var keywords = ['Folder', 'From', 'Subject', 'To', 'Importance', 'Include', 'Filter', 'Options'];
  keywords.forEach(function(kw) {
    if (pageContent.indexOf(kw) >= 0) {
      console.log('   [O] ' + kw + ' 발견');
    }
  });

  console.log('[2] 스크롤 가능한 영역 확인...');

  // 트리거 설정 영역을 찾아 스크롤
  var scrolled = await page.evaluate(function() {
    var panels = document.querySelectorAll('[class*="panel"], [class*="Panel"], [class*="card"], [class*="Card"]');
    for (var i = 0; i < panels.length; i++) {
      var p = panels[i];
      if (p.scrollHeight > p.clientHeight && p.clientHeight > 200) {
        // 스크롤 가능한 패널 발견
        p.scrollTop = 0;
        return { found: true, height: p.scrollHeight, visible: p.clientHeight };
      }
    }
    return { found: false };
  });

  console.log('   스크롤 영역:', scrolled);

  console.log('[3] "Show all" 또는 체크박스 클릭 시도...');

  // Show all 버튼이 있으면 클릭
  var showAllBtn = page.locator('button:has-text("Show all")').first();
  var isVisible = await showAllBtn.isVisible().catch(function() { return false; });

  if (isVisible) {
    await showAllBtn.click();
    console.log('   Show all 클릭됨');
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-after-show-all.png' });

  console.log('[4] 현재 보이는 모든 레이블...');

  var allLabels = await page.evaluate(function() {
    var labels = [];
    document.querySelectorAll('label, [class*="label"], [class*="Label"]').forEach(function(l) {
      var text = l.innerText.trim();
      var rect = l.getBoundingClientRect();
      if (text && text.length < 50 && rect.y > 100 && rect.y < 800) {
        labels.push({ text: text, y: Math.round(rect.y) });
      }
    });
    return labels.sort(function(a, b) { return a.y - b.y; });
  });

  console.log('   레이블 목록:');
  allLabels.forEach(function(l) {
    console.log('   - ' + l.text + ' (y=' + l.y + ')');
  });

  // 체크박스들 확인
  console.log('[5] 체크박스 상태...');

  var checkboxes = await page.evaluate(function() {
    var cbs = [];
    document.querySelectorAll('input[type="checkbox"], [role="checkbox"]').forEach(function(cb) {
      var rect = cb.getBoundingClientRect();
      if (rect.y > 100) {
        var label = cb.getAttribute('aria-label') || '';
        var parent = cb.closest('label, div');
        if (parent && !label) {
          label = parent.innerText.substring(0, 30);
        }
        cbs.push({ label: label, checked: cb.checked, y: Math.round(rect.y) });
      }
    });
    return cbs;
  });

  console.log('   체크박스:', checkboxes);

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
