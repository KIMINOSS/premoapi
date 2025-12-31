const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  console.log('[1] 현재 페이지 스크린샷...');
  await page.screenshot({ path: 'C:\\temp\\pa-current-state.png', fullPage: false });

  console.log('[2] 화면 하단(y > 550) 모든 버튼 스캔...');

  var bottomBtns = await page.evaluate(function() {
    var results = [];
    var buttons = document.querySelectorAll('button');
    buttons.forEach(function(btn, i) {
      var rect = btn.getBoundingClientRect();
      // 화면 하단 버튼만 (대화상자 버튼 영역)
      if (rect.y > 550 && rect.y < 700 && rect.width > 50) {
        results.push({
          index: i,
          innerText: (btn.innerText || '').trim(),
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2),
          width: Math.round(rect.width),
          tag: btn.tagName,
          type: btn.type || '',
          disabled: btn.disabled
        });
      }
    });
    return results;
  });

  console.log('   하단 버튼들:', JSON.stringify(bottomBtns, null, 2));

  // 모든 span 요소 중 "Create", "Skip" 텍스트 포함하는 것 찾기
  console.log('[3] Create/Skip 텍스트 포함 요소 찾기...');

  var textElements = await page.evaluate(function() {
    var results = [];
    var allElements = document.querySelectorAll('span, div');
    allElements.forEach(function(el) {
      var text = el.innerText || '';
      var rect = el.getBoundingClientRect();
      if ((text === 'Create' || text === 'Skip') && rect.y > 500 && rect.y < 700) {
        results.push({
          tag: el.tagName,
          text: text,
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2),
          parentTag: el.parentElement ? el.parentElement.tagName : 'none'
        });
      }
    });
    return results;
  });

  console.log('   텍스트 요소들:', JSON.stringify(textElements, null, 2));

  // 대화상자 컨테이너 확인
  console.log('[4] 대화상자/모달 확인...');

  var dialogs = await page.evaluate(function() {
    var results = [];
    var modals = document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="Modal"], [class*="Dialog"]');
    modals.forEach(function(m) {
      var rect = m.getBoundingClientRect();
      results.push({
        role: m.getAttribute('role'),
        className: (m.className || '').substring(0, 100),
        width: rect.width,
        height: rect.height
      });
    });
    return results;
  });

  console.log('   대화상자:', JSON.stringify(dialogs, null, 2));

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
