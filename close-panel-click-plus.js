const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    await dialog.dismiss().catch(function() {});
  });

  console.log('[1] 패널 외부 (왼쪽 영역) 클릭하여 닫기...');

  // 왼쪽 캔버스 영역 클릭 (패널 외부)
  await page.mouse.click(150, 400);
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'C:\\temp\\pa-panel-closed.png' });

  console.log('[2] + 버튼 좌표로 직접 클릭 (515, 232)...');

  await page.mouse.click(515, 232);
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'C:\\temp\\pa-plus-clicked.png' });

  console.log('[3] 메뉴 확인...');

  var menuState = await page.evaluate(function() {
    return {
      hasAddAction: document.body.innerText.indexOf('Add an action') >= 0,
      hasSearch: document.querySelector('input[placeholder*="Search"]') !== null
    };
  });

  console.log('   메뉴:', menuState);

  if (menuState.hasAddAction) {
    console.log('[4] Add an action 클릭...');

    // Add an action 좌표로 클릭
    var addActionPos = await page.evaluate(function() {
      var links = document.querySelectorAll('a, button, span, div');
      for (var i = 0; i < links.length; i++) {
        var text = links[i].innerText || '';
        var rect = links[i].getBoundingClientRect();
        if (text.trim() === 'Add an action' && rect.width > 50) {
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        }
      }
      return null;
    });

    if (addActionPos) {
      await page.mouse.click(addActionPos.x, addActionPos.y);
      await page.waitForTimeout(2000);
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-add-action-clicked.png' });

  console.log('[5] 검색 패널에서 Compose 검색...');

  var searchInput = page.locator('input[placeholder*="Search"]').first();
  var isVisible = await searchInput.isVisible().catch(function() { return false; });

  if (isVisible) {
    await searchInput.click();
    await page.keyboard.type('Compose', { delay: 80 });
    console.log('   Compose 입력됨');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'C:\\temp\\pa-compose-searched.png' });

    // 검색 결과 클릭
    console.log('[6] Compose 선택...');

    // "Compose" 포함 항목 중 클릭 가능한 것
    var composePos = await page.evaluate(function() {
      var allElements = document.querySelectorAll('*');
      for (var i = 0; i < allElements.length; i++) {
        var el = allElements[i];
        var text = el.innerText || '';
        var rect = el.getBoundingClientRect();

        // Compose + Data Operations 포함, 검색 결과 영역
        if (text.indexOf('Compose') >= 0 && text.indexOf('Data') >= 0 && rect.y > 300 && rect.y < 700 && rect.height > 30 && rect.height < 100) {
          return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) };
        }
      }
      return null;
    });

    console.log('   Compose 위치:', composePos);

    if (composePos) {
      await page.mouse.click(composePos.x, composePos.y);
      console.log('   Compose 클릭됨');
      await page.waitForTimeout(3000);
    } else {
      // 키보드로 첫 번째 결과 선택
      console.log('   키보드로 선택 시도...');
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-compose-selected2.png' });

  console.log('[7] 액션 추가 확인...');

  var actionAdded = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasInputs: text.indexOf('Inputs') >= 0,
      stillNeedsAction: text.indexOf('should contain at least one trigger and one action') >= 0,
      composeCount: (text.match(/Compose/g) || []).length
    };
  });

  console.log('   결과:', actionAdded);

  if (!actionAdded.stillNeedsAction && actionAdded.hasInputs) {
    console.log('[8] 플로우 저장...');

    // 패널 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Save 버튼 클릭
    var savePos = await page.evaluate(function() {
      var buttons = document.querySelectorAll('button');
      for (var i = 0; i < buttons.length; i++) {
        var text = buttons[i].innerText || '';
        var rect = buttons[i].getBoundingClientRect();
        if (text.indexOf('Save') >= 0 && rect.y < 100) {
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        }
      }
      return null;
    });

    if (savePos) {
      await page.mouse.click(savePos.x, savePos.y);
      console.log('   Save 클릭됨');
      await page.waitForTimeout(15000);

      console.log('   최종 URL:', page.url());
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-final-attempt.png' });

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
