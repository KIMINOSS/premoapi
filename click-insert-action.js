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

  console.log('[1] "Insert a new action" 버튼 클릭 (515, 232)...');

  // 먼저 ESC로 현재 패널 닫기
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Insert action 버튼 클릭
  await page.mouse.click(515, 232);
  console.log('   클릭됨!');

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:\\temp\\pa-insert-clicked.png' });

  console.log('[2] 액션 선택 메뉴 확인...');

  var menuState = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasSearchInput: document.querySelector('input[placeholder*="Search"]') !== null,
      hasAddAction: text.indexOf('Add an action') >= 0,
      hasSearchConnectors: text.indexOf('Search connectors') >= 0,
      hasRuntime: text.indexOf('Runtime') >= 0 || text.indexOf('Built-in') >= 0
    };
  });

  console.log('   메뉴 상태:', menuState);

  if (menuState.hasSearchInput || menuState.hasSearchConnectors) {
    console.log('[3] 검색 필드에 "Compose" 입력...');

    var searchInput = page.locator('input[placeholder*="Search"]').first();
    var isVisible = await searchInput.isVisible().catch(function() { return false; });

    if (isVisible) {
      await searchInput.fill('Compose');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'C:\\temp\\pa-compose-search.png' });

    console.log('[4] Compose 액션 선택...');

    // "Compose" 또는 "Data Operation" 클릭
    var composeItem = await page.evaluate(function() {
      var items = document.querySelectorAll('[role="row"], [role="option"], [class*="list-item"], div');
      for (var i = 0; i < items.length; i++) {
        var text = items[i].innerText || '';
        var rect = items[i].getBoundingClientRect();
        // "Compose"가 포함되고 "Data Operation"이 포함된 항목
        if (text.indexOf('Compose') >= 0 && rect.width > 100 && rect.y > 200 && rect.y < 700) {
          // 중복 방지를 위해 높이가 적당한 항목만
          if (rect.height > 30 && rect.height < 100) {
            return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2), text: text.substring(0, 50) };
          }
        }
      }
      return null;
    });

    console.log('   Compose 항목:', composeItem);

    if (composeItem) {
      await page.mouse.click(composeItem.x, composeItem.y);
      console.log('   Compose 클릭됨!');
      await page.waitForTimeout(2000);
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-after-compose.png' });

  console.log('[5] 현재 상태 확인...');

  var hasCompose = await page.evaluate(function() {
    var text = document.body.innerText;
    return text.indexOf('Compose') >= 0 && (text.indexOf('Inputs') >= 0 || text.indexOf('Input') >= 0);
  });

  console.log('   Compose 액션 추가됨:', hasCompose);

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
