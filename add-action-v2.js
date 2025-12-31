const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    await dialog.dismiss().catch(function() {});
  });

  console.log('[1] 열린 패널 JavaScript로 숨기기...');

  await page.evaluate(function() {
    var drawers = document.querySelectorAll('[role="dialog"], .fui-OverlayDrawer');
    drawers.forEach(function(d) {
      d.style.display = 'none';
    });
  });

  await page.waitForTimeout(500);

  console.log('[2] + 버튼 클릭...');

  var plusBtn = await page.evaluate(function() {
    var buttons = document.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      var ariaLabel = buttons[i].getAttribute('aria-label') || '';
      if (ariaLabel.indexOf('Insert a new action') >= 0) {
        var rect = buttons[i].getBoundingClientRect();
        return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) };
      }
    }
    return null;
  });

  if (plusBtn) {
    await page.mouse.click(plusBtn.x, plusBtn.y);
    await page.waitForTimeout(1500);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-v2-1.png' });

  console.log('[3] Add an action 메뉴 찾기 및 클릭...');

  var addActionMenu = await page.evaluate(function() {
    var elements = document.querySelectorAll('*');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var text = (el.innerText || '').trim();
      var rect = el.getBoundingClientRect();
      // Add an action 텍스트가 있고, 적절한 크기의 요소
      if (text === 'Add an action' && rect.y > 150 && rect.y < 400 && rect.width > 80 && rect.height < 50) {
        return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2), h: rect.height };
      }
    }
    return null;
  });

  console.log('   Add an action:', addActionMenu);

  if (addActionMenu) {
    await page.mouse.click(addActionMenu.x, addActionMenu.y);
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-v2-2.png' });

  console.log('[4] 액션 검색 패널 분석...');

  // y > 150 영역의 검색창 찾기 (헤더가 아닌)
  var actionSearchInfo = await page.evaluate(function() {
    var inputs = document.querySelectorAll('input');
    var searchInputs = [];

    for (var i = 0; i < inputs.length; i++) {
      var placeholder = inputs[i].getAttribute('placeholder') || '';
      var rect = inputs[i].getBoundingClientRect();
      if (placeholder.indexOf('Search') >= 0) {
        searchInputs.push({
          placeholder: placeholder,
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2),
          width: rect.width
        });
      }
    }

    return searchInputs;
  });

  console.log('   검색창들:', actionSearchInfo);

  // y > 150인 검색창 선택 (액션 패널의 검색창)
  var actionSearch = actionSearchInfo.find(function(s) { return s.y > 150; });

  if (actionSearch) {
    console.log('[5] 액션 검색창에 Compose 입력...');
    console.log('   사용할 검색창:', actionSearch);

    await page.mouse.click(actionSearch.x, actionSearch.y);
    await page.waitForTimeout(300);

    await page.keyboard.type('Compose', { delay: 80 });
    console.log('   Compose 입력됨');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'C:\\temp\\pa-v2-3.png' });

    console.log('[6] 검색 결과 분석...');

    var results = await page.evaluate(function() {
      var items = [];
      // 모든 클릭 가능 요소 중 Compose 포함된 것
      var elements = document.querySelectorAll('*');

      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        var text = el.innerText || '';
        var rect = el.getBoundingClientRect();

        // Compose와 Data Operations 포함, 검색결과 영역 (y > 200)
        if (text.indexOf('Compose') >= 0 && rect.y > 200 && rect.y < 600) {
          // 적절한 크기의 항목
          if (rect.height > 30 && rect.height < 100 && rect.width > 200) {
            items.push({
              text: text.substring(0, 60).replace(/\n/g, ' '),
              x: Math.round(rect.x + rect.width / 2),
              y: Math.round(rect.y + rect.height / 2),
              h: rect.height,
              tag: el.tagName
            });
          }
        }
      }

      // 중복 제거 (비슷한 위치)
      var unique = [];
      items.forEach(function(item) {
        var isDup = unique.some(function(u) {
          return Math.abs(u.y - item.y) < 20;
        });
        if (!isDup) unique.push(item);
      });

      return unique.slice(0, 5);
    });

    console.log('   검색 결과:');
    results.forEach(function(r, i) {
      console.log('   [' + i + ']', r.text.substring(0, 40), 'y=' + r.y, 'h=' + r.h);
    });

    if (results.length > 0) {
      console.log('[7] Compose 항목 클릭...');
      // 가장 적절한 항목 선택 (높이가 40-80 범위)
      var target = results.find(function(r) { return r.h > 35 && r.h < 90; }) || results[0];
      console.log('   클릭할 항목:', target.text.substring(0, 40), 'y=' + target.y);

      await page.mouse.click(target.x, target.y);
      await page.waitForTimeout(3000);
    } else {
      console.log('[7] 결과 없음. ArrowDown + Enter 시도...');
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(300);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
    }
  } else {
    console.log('   액션 검색창을 찾을 수 없음');
  }

  await page.screenshot({ path: 'C:\\temp\\pa-v2-4.png' });

  console.log('[8] 최종 상태 확인...');

  var finalState = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasInputs: text.indexOf('Inputs') >= 0,
      stillNeedsAction: text.indexOf('should contain at least one trigger and one action') >= 0,
      hasComposeInFlow: text.indexOf('Compose') >= 0 && text.indexOf('Parameters') >= 0
    };
  });

  console.log('   최종:', finalState);

  if (!finalState.stillNeedsAction && finalState.hasInputs) {
    console.log('[9] 저장 시도...');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    var saveBtn = await page.evaluate(function() {
      var buttons = document.querySelectorAll('button');
      for (var i = 0; i < buttons.length; i++) {
        var text = buttons[i].innerText || '';
        var rect = buttons[i].getBoundingClientRect();
        if (text.indexOf('Save') >= 0 && rect.y < 100) {
          return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) };
        }
      }
      return null;
    });

    if (saveBtn) {
      await page.mouse.click(saveBtn.x, saveBtn.y);
      await page.waitForTimeout(15000);
      console.log('   저장 후 URL:', page.url());
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-v2-final.png' });

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
