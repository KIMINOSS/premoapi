const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    await dialog.dismiss().catch(function() {});
  });

  await page.screenshot({ path: 'C:\\temp\\pa-tab-1.png' });

  console.log('[1] 현재 상태 분석...');

  var pageContent = await page.evaluate(function() {
    return {
      innerText: document.body.innerText.substring(0, 1500),
      buttons: Array.from(document.querySelectorAll('button')).map(function(b) {
        return { text: (b.innerText || '').substring(0, 30), ariaLabel: (b.getAttribute('aria-label') || '').substring(0, 50) };
      }).slice(0, 30)
    };
  });

  console.log('   페이지 일부:', pageContent.innerText.substring(0, 500));

  // + 버튼이나 New step 관련 요소 찾기
  console.log('[2] 플로우 캔버스에서 클릭 가능한 + 영역 찾기...');

  var plusElements = await page.evaluate(function() {
    var results = [];
    var allElements = document.querySelectorAll('*');

    for (var i = 0; i < allElements.length; i++) {
      var el = allElements[i];
      var text = el.innerText || '';
      var ariaLabel = el.getAttribute('aria-label') || '';
      var rect = el.getBoundingClientRect();

      // + 또는 Insert/Add action 관련
      if ((text === '+' || ariaLabel.indexOf('Insert') >= 0 || ariaLabel.indexOf('Add') >= 0 || text.indexOf('New step') >= 0) && rect.y > 200 && rect.y < 500 && rect.x > 300) {
        results.push({
          tag: el.tagName,
          text: text.substring(0, 20),
          ariaLabel: ariaLabel.substring(0, 50),
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2)
        });
      }
    }

    return results.slice(0, 10);
  });

  console.log('   + 관련 요소:', plusElements);

  // 트리거 카드 아래 영역의 클릭 가능한 요소
  console.log('[3] 트리거 아래 클릭 가능 영역 분석...');

  var clickableBelow = await page.evaluate(function() {
    // 트리거 카드 위치 추정 (보통 상단 200-350px)
    var clickables = [];
    var elements = document.querySelectorAll('button, a, [role="button"], [tabindex="0"]');

    elements.forEach(function(el) {
      var rect = el.getBoundingClientRect();
      // 트리거 아래 영역 (y: 350-500, x: 캔버스 중앙)
      if (rect.y > 350 && rect.y < 500 && rect.x > 300 && rect.x < 800 && rect.width > 10) {
        var text = el.innerText || el.getAttribute('aria-label') || '';
        clickables.push({
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2),
          text: text.substring(0, 40)
        });
      }
    });

    return clickables;
  });

  console.log('   클릭 가능 요소:', clickableBelow);

  // 특정 좌표 클릭 시도 (트리거 카드 바로 아래)
  if (clickableBelow.length === 0) {
    console.log('[4] 직접 좌표로 + 버튼 클릭 시도 (500, 380)...');
    await page.mouse.click(500, 380);
    await page.waitForTimeout(2000);
  } else {
    console.log('[4] 첫 번째 클릭 가능 요소 클릭...');
    await page.mouse.click(clickableBelow[0].x, clickableBelow[0].y);
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-tab-2.png' });

  // 메뉴가 열렸는지 확인
  var menuOpened = await page.evaluate(function() {
    var text = document.body.innerText;
    return text.indexOf('Add an action') >= 0 || text.indexOf('Search') >= 0 || text.indexOf('Built-in') >= 0;
  });

  console.log('[5] 메뉴 열림:', menuOpened);

  if (menuOpened) {
    // Add an action 클릭
    var addBtn = page.locator('text=Add an action').first();
    var isVisible = await addBtn.isVisible().catch(function() { return false; });
    if (isVisible) {
      await addBtn.click();
      await page.waitForTimeout(1500);
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-tab-3.png' });

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
