const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    await dialog.dismiss().catch(function() {});
  });

  console.log('[1] 현재 페이지 상태 확인...');
  console.log('   URL:', page.url());

  await page.screenshot({ path: 'C:\\temp\\pa-keyboard-1.png' });

  // 열린 패널 강제 닫기 (JavaScript로 직접)
  console.log('[2] JavaScript로 열린 패널/드로워 닫기...');

  await page.evaluate(function() {
    // OverlayDrawer (패널) 찾아서 숨기기
    var drawers = document.querySelectorAll('[role="dialog"]');
    drawers.forEach(function(d) {
      d.style.display = 'none';
    });

    // fui-OverlayDrawer 클래스 요소 숨기기
    var overlays = document.querySelectorAll('.fui-OverlayDrawer');
    overlays.forEach(function(o) {
      o.style.display = 'none';
    });
  });

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:\\temp\\pa-panel-hidden.png' });

  console.log('[3] + 버튼 찾기...');

  var plusBtnInfo = await page.evaluate(function() {
    var buttons = document.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      var ariaLabel = buttons[i].getAttribute('aria-label') || '';
      if (ariaLabel.indexOf('Insert a new action') >= 0) {
        var rect = buttons[i].getBoundingClientRect();
        // 버튼 ID도 확인
        return {
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2),
          id: buttons[i].id,
          label: ariaLabel.substring(0, 80)
        };
      }
    }
    return null;
  });

  console.log('   + 버튼:', plusBtnInfo);

  if (plusBtnInfo) {
    console.log('[4] + 버튼 직접 클릭...');
    await page.mouse.click(plusBtnInfo.x, plusBtnInfo.y);
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-plus-clicked2.png' });

  console.log('[5] 메뉴 상태 확인...');

  var menuState = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasAddAction: text.indexOf('Add an action') >= 0,
      hasAddBranch: text.indexOf('Add a branch') >= 0,
      hasSearch: document.querySelector('input[placeholder*="Search"]') !== null,
      pageText: text.substring(0, 500)
    };
  });

  console.log('   메뉴:', menuState.hasAddAction, menuState.hasAddBranch, menuState.hasSearch);

  // Add an action 클릭
  if (menuState.hasAddAction) {
    console.log('[6] Add an action 클릭...');

    var addActionBtn = await page.evaluate(function() {
      var elements = document.querySelectorAll('*');
      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        var text = (el.innerText || '').trim();
        var rect = el.getBoundingClientRect();
        if (text === 'Add an action' && rect.width > 50 && rect.height > 15 && rect.height < 60) {
          return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) };
        }
      }
      return null;
    });

    if (addActionBtn) {
      await page.mouse.click(addActionBtn.x, addActionBtn.y);
      await page.waitForTimeout(2000);
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-add-action-menu.png' });

  console.log('[7] 검색창에 Compose 입력...');

  var searchInput = await page.evaluate(function() {
    var inputs = document.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) {
      var placeholder = inputs[i].getAttribute('placeholder') || '';
      if (placeholder.indexOf('Search') >= 0) {
        var rect = inputs[i].getBoundingClientRect();
        return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) };
      }
    }
    return null;
  });

  if (searchInput) {
    console.log('   검색창 위치:', searchInput);
    await page.mouse.click(searchInput.x, searchInput.y);
    await page.waitForTimeout(300);

    // 기존 내용 지우기
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);

    // Compose 입력
    await page.keyboard.type('Compose', { delay: 80 });
    console.log('   Compose 입력됨');
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-compose-search.png' });

  console.log('[8] 검색 결과에서 Compose 선택...');

  // 검색 결과 분석
  var searchResults = await page.evaluate(function() {
    var results = [];
    var elements = document.querySelectorAll('[role="option"], [role="listitem"], [data-automation-id*="search"]');

    elements.forEach(function(el) {
      var text = el.innerText || '';
      var rect = el.getBoundingClientRect();
      if (rect.y > 200 && rect.y < 700 && rect.width > 100 && text.indexOf('Compose') >= 0) {
        results.push({
          text: text.substring(0, 60).replace(/\n/g, ' '),
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2),
          tag: el.tagName
        });
      }
    });

    return results;
  });

  console.log('   검색 결과:', searchResults.length);
  searchResults.forEach(function(r, i) {
    console.log('   [' + i + ']', r.text, '(y=' + r.y + ')');
  });

  // 첫 번째 Compose 결과 클릭
  if (searchResults.length > 0) {
    console.log('[9] 첫 번째 Compose 결과 클릭...');
    await page.mouse.click(searchResults[0].x, searchResults[0].y);
    await page.waitForTimeout(3000);
  } else {
    // 키보드로 선택 시도
    console.log('[9] 키보드로 선택 시도...');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-compose-selected3.png' });

  console.log('[10] 액션 추가 확인...');

  var finalState = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasInputs: text.indexOf('Inputs') >= 0,
      hasCompose: text.indexOf('Compose') >= 0 && text.indexOf('Data Operations') >= 0,
      stillNeedsAction: text.indexOf('should contain at least one trigger and one action') >= 0,
      hasParameters: text.indexOf('Parameters') >= 0
    };
  });

  console.log('   최종 상태:', finalState);

  // 액션이 추가되었으면 저장
  if (finalState.hasInputs && !finalState.stillNeedsAction) {
    console.log('[11] 플로우 저장 시도...');

    // 패널 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Save 버튼 찾기
    var saveBtn = await page.evaluate(function() {
      var buttons = document.querySelectorAll('button');
      for (var i = 0; i < buttons.length; i++) {
        var text = buttons[i].innerText || '';
        var rect = buttons[i].getBoundingClientRect();
        if (text.indexOf('Save') >= 0 && rect.y < 100 && rect.width > 40) {
          return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) };
        }
      }
      return null;
    });

    if (saveBtn) {
      console.log('   Save 버튼:', saveBtn);
      await page.mouse.click(saveBtn.x, saveBtn.y);
      await page.waitForTimeout(15000);
      console.log('   저장 후 URL:', page.url());
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-keyboard-final.png' });

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
