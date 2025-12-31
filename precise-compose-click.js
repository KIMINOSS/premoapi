const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    await dialog.dismiss().catch(function() {});
  });

  console.log('[1] 다시 Compose 검색...');

  // 먼저 검색 패널이 열려있는지 확인
  var hasSearchPanel = await page.evaluate(function() {
    return document.body.innerText.indexOf('Search for an action') >= 0;
  });

  if (!hasSearchPanel) {
    console.log('   검색 패널 없음. + 버튼 클릭...');

    // 패널 숨기기
    await page.evaluate(function() {
      var drawers = document.querySelectorAll('[role="dialog"], .fui-OverlayDrawer');
      drawers.forEach(function(d) { d.style.display = 'none'; });
    });
    await page.waitForTimeout(500);

    // + 버튼 클릭
    await page.mouse.click(515, 228);
    await page.waitForTimeout(1500);

    // Add an action 클릭
    var addAction = await page.evaluate(function() {
      var elements = document.querySelectorAll('*');
      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        var text = (el.innerText || '').trim();
        var rect = el.getBoundingClientRect();
        if (text === 'Add an action' && rect.y > 150 && rect.height > 10) {
          return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) };
        }
      }
      return null;
    });

    if (addAction) {
      await page.mouse.click(addAction.x, addAction.y);
      await page.waitForTimeout(2000);
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-precise-1.png' });

  // 검색창 찾아서 Compose 입력
  console.log('[2] 검색창 찾기...');

  var searchInput = await page.evaluate(function() {
    var inputs = document.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) {
      var placeholder = inputs[i].getAttribute('placeholder') || '';
      var rect = inputs[i].getBoundingClientRect();
      if (placeholder.indexOf('Search for an action') >= 0 && rect.y > 100) {
        return { x: Math.round(rect.x + 50), y: Math.round(rect.y + rect.height / 2) };
      }
    }
    return null;
  });

  if (searchInput) {
    console.log('   검색창:', searchInput);
    await page.mouse.click(searchInput.x, searchInput.y);
    await page.waitForTimeout(300);

    // 기존 내용 지우고 새로 입력
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);

    await page.keyboard.type('Compose', { delay: 60 });
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-precise-2.png' });

  console.log('[3] 클릭 가능한 Compose 항목 찾기...');

  // 높이가 0이 아닌, 실제 클릭 가능한 요소만 찾기
  var clickableItems = await page.evaluate(function() {
    var items = [];
    var elements = document.querySelectorAll('*');

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var text = (el.innerText || '').trim();
      var rect = el.getBoundingClientRect();

      // height > 20 이고 Compose 포함
      if (rect.height > 20 && rect.height < 80 && rect.y > 280 && rect.y < 450) {
        if (text === 'Compose' || text === 'Compose\nData Operations') {
          items.push({
            text: text.replace(/\n/g, ' | '),
            x: Math.round(rect.x + rect.width / 2),
            y: Math.round(rect.y + rect.height / 2),
            h: Math.round(rect.height),
            w: Math.round(rect.width),
            tag: el.tagName,
            clickable: el.tagName === 'BUTTON' || el.tagName === 'A' || el.onclick !== null || el.getAttribute('role') === 'option'
          });
        }
      }
    }

    // 높이와 너비가 적절한 것 우선
    items.sort(function(a, b) {
      // 버튼이나 링크 우선
      if (a.clickable && !b.clickable) return -1;
      if (!a.clickable && b.clickable) return 1;
      // 그 다음 높이 기준
      return b.h - a.h;
    });

    return items.slice(0, 8);
  });

  console.log('   클릭 가능한 항목들:');
  clickableItems.forEach(function(item, i) {
    console.log('   [' + i + ']', item.text, 'h=' + item.h, 'w=' + item.w, item.tag, 'clickable=' + item.clickable);
  });

  // 적절한 항목 클릭
  var target = clickableItems.find(function(item) {
    return item.h > 35 && item.h < 60 && item.w > 100;
  }) || clickableItems[0];

  if (target) {
    console.log('[4] 항목 클릭:', target.text, 'at', target.x, target.y);
    await page.mouse.click(target.x, target.y);
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-precise-3.png' });

  // 상태 확인
  var state1 = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasInputs: text.indexOf('Inputs') >= 0,
      stillNeedsAction: text.indexOf('should contain at least one trigger and one action') >= 0
    };
  });

  console.log('   클릭 후:', state1);

  // 아직 안됐으면 다른 방법 시도
  if (state1.stillNeedsAction) {
    console.log('[5] 다른 방법: 아이콘 옆 텍스트 클릭...');

    // Data Operations 카테고리의 Compose
    var composeRow = await page.evaluate(function() {
      // 모든 요소 중 "Compose"와 "Data Operations"가 같이 있는 row 찾기
      var elements = document.querySelectorAll('[role="option"], [role="listitem"], [class*="item"], [class*="row"]');

      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        var text = el.innerText || '';
        var rect = el.getBoundingClientRect();

        if (text.indexOf('Compose') >= 0 && text.indexOf('Data Operations') >= 0) {
          if (rect.height > 40 && rect.y > 280) {
            return { x: Math.round(rect.x + 100), y: Math.round(rect.y + rect.height / 2), text: text.substring(0, 40) };
          }
        }
      }
      return null;
    });

    if (composeRow) {
      console.log('   Compose row:', composeRow);
      await page.mouse.click(composeRow.x, composeRow.y);
      await page.waitForTimeout(3000);
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-precise-4.png' });

  console.log('[6] 최종 확인...');

  var finalState = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasInputs: text.indexOf('Inputs') >= 0,
      stillNeedsAction: text.indexOf('should contain at least one trigger and one action') >= 0,
      hasComposeAction: text.indexOf('Compose') >= 0 && text.indexOf('Parameters') >= 0
    };
  });

  console.log('   최종:', finalState);

  if (!finalState.stillNeedsAction) {
    console.log('[7] 저장...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    var saveBtn = await page.evaluate(function() {
      var buttons = document.querySelectorAll('button');
      for (var i = 0; i < buttons.length; i++) {
        var t = buttons[i].innerText || '';
        var r = buttons[i].getBoundingClientRect();
        if (t.indexOf('Save') >= 0 && r.y < 100) {
          return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
        }
      }
      return null;
    });

    if (saveBtn) {
      await page.mouse.click(saveBtn.x, saveBtn.y);
      await page.waitForTimeout(15000);
      console.log('   저장 완료');
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-precise-final.png' });

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
