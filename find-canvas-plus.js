const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    console.log('   대화상자:', dialog.message());
    await dialog.dismiss().catch(function() {});
  });

  console.log('[1] 현재 화면 분석...');
  await page.screenshot({ path: 'C:\\temp\\pa-canvas-1.png' });

  // 플로우 캔버스 영역 (x > 200) 내의 클릭 가능 요소 찾기
  var canvasElements = await page.evaluate(function() {
    var results = [];
    var allElements = document.querySelectorAll('button, [role="button"], [class*="add"], [class*="plus"], [class*="Insert"]');

    allElements.forEach(function(el) {
      var rect = el.getBoundingClientRect();
      // 캔버스 영역 (x > 250, y > 200)
      if (rect.x > 250 && rect.y > 200 && rect.y < 600 && rect.width > 10) {
        var text = el.innerText || '';
        var ariaLabel = el.getAttribute('aria-label') || '';
        var className = el.className || '';
        results.push({
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2),
          text: text.substring(0, 30),
          ariaLabel: ariaLabel.substring(0, 50),
          className: className.substring(0, 60)
        });
      }
    });

    return results;
  });

  console.log('   캔버스 영역 요소들:');
  canvasElements.forEach(function(el) {
    console.log('   - x=' + el.x + ' y=' + el.y + ' "' + (el.text || el.ariaLabel) + '"');
  });

  // 트리거 카드 위치 확인
  var triggerCard = await page.evaluate(function() {
    var cards = document.querySelectorAll('[class*="card"], [class*="Card"], [class*="operation"], [class*="Operation"]');
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var text = card.innerText || '';
      var rect = card.getBoundingClientRect();
      if (text.indexOf('When a new email') >= 0 && rect.width > 100) {
        return {
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2),
          bottom: Math.round(rect.y + rect.height),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      }
    }
    return null;
  });

  console.log('   트리거 카드:', triggerCard);

  if (triggerCard) {
    // 트리거 카드 바로 아래의 + 버튼 또는 연결선 찾기
    var plusBelowTrigger = await page.evaluate(function(triggerBottom) {
      var elements = document.querySelectorAll('*');
      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        var rect = el.getBoundingClientRect();
        // 트리거 바로 아래 (triggerBottom ~ triggerBottom + 100)
        if (rect.y >= triggerBottom && rect.y <= triggerBottom + 100 && rect.x > 300 && rect.x < 800) {
          var text = el.innerText || el.getAttribute('aria-label') || '';
          if (text === '+' || text.indexOf('add') >= 0 || text.indexOf('Add') >= 0 || text.indexOf('Insert') >= 0) {
            return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2), text: text };
          }
        }
      }
      return null;
    }, triggerCard.bottom);

    console.log('   트리거 아래 + 버튼:', plusBelowTrigger);

    if (plusBelowTrigger) {
      await page.mouse.click(plusBelowTrigger.x, plusBelowTrigger.y);
      console.log('   클릭됨!');
    } else {
      // 트리거 카드 아래 중앙 클릭
      console.log('   + 버튼 없음. 트리거 아래 클릭 시도...');
      await page.mouse.click(triggerCard.x, triggerCard.bottom + 40);
    }
  } else {
    // 캔버스 중앙 클릭
    console.log('   트리거 카드 못 찾음. 중앙 클릭...');
    await page.mouse.click(550, 400);
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:\\temp\\pa-canvas-2.png' });

  console.log('[2] 액션 메뉴 확인...');
  var menuVisible = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      addAction: text.indexOf('Add an action') >= 0,
      searchActions: text.indexOf('Search actions') >= 0 || text.indexOf('Search connectors') >= 0,
      chooseOperation: text.indexOf('Choose an operation') >= 0,
      newStep: text.indexOf('New step') >= 0
    };
  });

  console.log('   메뉴 상태:', menuVisible);

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
