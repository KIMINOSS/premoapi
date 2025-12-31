const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  console.log('URL:', page.url());
  await page.screenshot({ path: 'C:\\temp\\status-1.png' });

  console.log('[1] 페이지 전체 텍스트 분석...');

  var pageText = await page.evaluate(function() {
    return document.body.innerText.substring(0, 2000);
  });

  console.log(pageText);

  console.log('\n[2] 상단 툴바 버튼들...');

  var toolbarItems = await page.evaluate(function() {
    var items = [];
    var buttons = document.querySelectorAll('button, a');

    buttons.forEach(function(el) {
      var rect = el.getBoundingClientRect();
      if (rect.y > 30 && rect.y < 120 && rect.width > 20) {
        var text = (el.innerText || '').trim().substring(0, 25);
        var ariaLabel = (el.getAttribute('aria-label') || '').substring(0, 30);
        if (text || ariaLabel) {
          items.push({
            text: text,
            ariaLabel: ariaLabel,
            x: Math.round(rect.x + rect.width / 2),
            y: Math.round(rect.y + rect.height / 2)
          });
        }
      }
    });

    return items;
  });

  toolbarItems.forEach(function(item) {
    console.log('  ', item.text || item.ariaLabel, 'at', item.x, item.y);
  });

  console.log('\n[3] 플로우 구성 요소 확인...');

  var flowComponents = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      trigger: text.indexOf('When a new email arrives (V3)') >= 0,
      action: text.indexOf('Compose') >= 0,
      fromFilter: text.indexOf('onboarding@resend.dev') >= 0 || text.indexOf('From') >= 0,
      canTest: text.indexOf('Test') >= 0,
      canSave: text.indexOf('Save') >= 0
    };
  });

  console.log('   구성:', flowComponents);

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
