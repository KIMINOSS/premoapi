const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  console.log('URL:', page.url());

  await page.screenshot({ path: 'C:\\temp\\debug-1.png' });

  console.log('[1] 화면 전체 텍스트 (처음 1500자)...');
  var bodyText = await page.evaluate(function() {
    return document.body.innerText.substring(0, 1500);
  });
  console.log(bodyText);

  console.log('\n[2] 검색창 상태...');
  var inputs = await page.evaluate(function() {
    var result = [];
    var inputs = document.querySelectorAll('input');
    inputs.forEach(function(inp) {
      var rect = inp.getBoundingClientRect();
      result.push({
        placeholder: inp.getAttribute('placeholder'),
        value: inp.value,
        y: Math.round(rect.y),
        visible: rect.height > 0
      });
    });
    return result;
  });
  console.log(JSON.stringify(inputs, null, 2));

  console.log('\n[3] 버튼들 (aria-label 포함)...');
  var buttons = await page.evaluate(function() {
    var result = [];
    var buttons = document.querySelectorAll('button');
    buttons.forEach(function(btn) {
      var rect = btn.getBoundingClientRect();
      if (rect.y > 100 && rect.y < 500 && rect.height > 0) {
        result.push({
          text: (btn.innerText || '').substring(0, 30),
          ariaLabel: (btn.getAttribute('aria-label') || '').substring(0, 50),
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2)
        });
      }
    });
    return result.slice(0, 15);
  });
  buttons.forEach(function(b) {
    console.log('  ', b.text || b.ariaLabel, 'at', b.x, b.y);
  });

  console.log('\n[4] role="option" 또는 클릭 가능 항목...');
  var options = await page.evaluate(function() {
    var result = [];
    var elements = document.querySelectorAll('[role="option"], [role="listitem"], [role="menuitem"]');
    elements.forEach(function(el) {
      var rect = el.getBoundingClientRect();
      if (rect.height > 0 && rect.y > 150 && rect.y < 600) {
        result.push({
          text: (el.innerText || '').substring(0, 50).replace(/\n/g, ' '),
          y: Math.round(rect.y),
          x: Math.round(rect.x + rect.width / 2)
        });
      }
    });
    return result;
  });
  options.forEach(function(o) {
    console.log('  ', o.text, 'y=' + o.y);
  });

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
