const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    await dialog.dismiss().catch(function() {});
  });

  await page.screenshot({ path: 'C:\\temp\\pa-click-1.png' });

  console.log('[1] 현재 화면에서 Compose 액션 항목 분석...');

  // 더 세밀하게 Compose 액션 항목 찾기
  var composeItems = await page.evaluate(function() {
    var items = [];
    var elements = document.querySelectorAll('*');

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var text = (el.innerText || '').trim();
      var rect = el.getBoundingClientRect();

      // "Compose"만 있거나 "Compose\nData Operations" 형태인 항목
      if (rect.y > 250 && rect.y < 550 && rect.width > 50 && rect.width < 600) {
        // 정확히 "Compose" 또는 Compose로 시작하는 짧은 텍스트
        if (text === 'Compose' ||
            (text.indexOf('Compose') === 0 && text.length < 50) ||
            text === 'Compose\nData Operations') {
          items.push({
            text: text.replace(/\n/g, ' | '),
            x: Math.round(rect.x + rect.width / 2),
            y: Math.round(rect.y + rect.height / 2),
            w: Math.round(rect.width),
            h: Math.round(rect.height),
            tag: el.tagName
          });
        }
      }
    }

    // y 좌표 기준 정렬
    items.sort(function(a, b) { return a.y - b.y; });

    return items.slice(0, 10);
  });

  console.log('   Compose 항목들:');
  composeItems.forEach(function(item, i) {
    console.log('   [' + i + ']', '"' + item.text + '"', 'x=' + item.x, 'y=' + item.y, 'w=' + item.w, 'h=' + item.h, item.tag);
  });

  // "Compose | Data Operations" 또는 단독 "Compose" 찾기
  var targetItem = composeItems.find(function(item) {
    return item.text === 'Compose | Data Operations' || item.text === 'Compose';
  });

  if (!targetItem && composeItems.length > 0) {
    // 가장 적합한 항목 선택 (높이가 40-70, 너비 적당한 것)
    targetItem = composeItems.find(function(item) {
      return item.h > 30 && item.h < 80 && item.w > 150;
    }) || composeItems[0];
  }

  if (targetItem) {
    console.log('[2] Compose 항목 클릭:', targetItem.text, 'at y=' + targetItem.y);
    await page.mouse.click(targetItem.x, targetItem.y);
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'C:\\temp\\pa-click-2.png' });

    // 클릭 결과 확인
    var afterClick = await page.evaluate(function() {
      var text = document.body.innerText;
      return {
        hasInputs: text.indexOf('Inputs') >= 0,
        hasParameters: text.indexOf('Parameters') >= 0,
        stillSearchPanel: text.indexOf('Search for an action') >= 0
      };
    });

    console.log('   클릭 후 상태:', afterClick);

    // 검색 패널이 여전히 있으면 다시 시도
    if (afterClick.stillSearchPanel && !afterClick.hasInputs) {
      console.log('[3] 키보드로 다시 시도...');

      // 검색창 포커스
      var searchInput = page.locator('input[placeholder*="Search for an action"]').first();
      if (await searchInput.isVisible().catch(function() { return false; })) {
        await searchInput.click();
        await page.waitForTimeout(300);

        // Tab으로 첫 번째 결과로 이동
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);

        // Enter로 선택
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'C:\\temp\\pa-click-3.png' });
      }
    }
  } else {
    console.log('   Compose 항목을 찾을 수 없음');

    // "See more" 클릭해서 Data Operations 확장
    console.log('[2] See more 클릭 시도...');

    var seeMoreBtn = await page.evaluate(function() {
      var elements = document.querySelectorAll('*');
      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        var text = (el.innerText || '').trim();
        var rect = el.getBoundingClientRect();
        if (text === 'See more' && rect.y > 250 && rect.y < 400) {
          return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) };
        }
      }
      return null;
    });

    if (seeMoreBtn) {
      console.log('   See more 클릭:', seeMoreBtn);
      await page.mouse.click(seeMoreBtn.x, seeMoreBtn.y);
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'C:\\temp\\pa-see-more.png' });
    }
  }

  console.log('[4] 최종 상태 확인...');

  var finalState = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasInputs: text.indexOf('Inputs') >= 0,
      hasCompose: text.indexOf('Compose') >= 0,
      stillNeedsAction: text.indexOf('should contain at least one trigger and one action') >= 0,
      hasParameters: text.indexOf('Parameters') >= 0
    };
  });

  console.log('   최종:', finalState);

  // 성공하면 저장
  if (finalState.hasInputs && !finalState.stillNeedsAction) {
    console.log('[5] 저장...');

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
      console.log('   저장 완료. URL:', page.url());
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-click-final.png' });

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
