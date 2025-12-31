const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    await dialog.dismiss().catch(function() {});
  });

  console.log('[1] ESC로 현재 패널 닫기...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  console.log('[2] Insert action 버튼 클릭 (515, 232)...');
  await page.mouse.click(515, 232);
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'C:\\temp\\pa-insert-515.png' });

  console.log('[3] Add an action 메뉴 확인...');

  var menuState = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasAddAction: text.indexOf('Add an action') >= 0,
      hasSearch: text.indexOf('Search') >= 0,
      hasBuiltIn: text.indexOf('Built-in') >= 0 || text.indexOf('Runtime') >= 0,
      hasConnectors: text.indexOf('connectors') >= 0
    };
  });

  console.log('   메뉴 상태:', menuState);

  if (menuState.hasAddAction) {
    console.log('[4] Add an action 클릭...');
    var addBtn = page.locator('text=Add an action').first();
    await addBtn.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-add-action-menu.png' });

  console.log('[5] 검색 필드에 Compose 입력...');

  var searchInput = page.locator('input[placeholder*="Search"]').first();
  var isVisible = await searchInput.isVisible().catch(function() { return false; });

  if (isVisible) {
    await searchInput.click();
    await searchInput.fill('Compose');
    console.log('   Compose 입력됨');
    await page.waitForTimeout(3000);
  } else {
    console.log('   검색 필드를 찾지 못함');
  }

  await page.screenshot({ path: 'C:\\temp\\pa-compose-search3.png' });

  console.log('[6] 검색 결과에서 Compose 선택...');

  // Compose - Data Operations 선택
  var composeItem = await page.evaluate(function() {
    // 모든 요소에서 "Compose"와 "Data" 포함하는 것 찾기
    var elements = document.querySelectorAll('*');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var text = el.innerText || '';
      var rect = el.getBoundingClientRect();

      // "Compose"만 포함하고 다른 텍스트가 적은 요소 (검색 결과 항목)
      if (text.trim() === 'Compose' || (text.indexOf('Compose') >= 0 && text.indexOf('Data') >= 0)) {
        if (rect.y > 200 && rect.y < 700 && rect.width > 100 && rect.height > 20 && rect.height < 80) {
          return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2), text: text.substring(0, 60) };
        }
      }
    }

    // 대안: "Compose"를 포함하는 첫 번째 클릭 가능 요소
    var clickables = document.querySelectorAll('[role="option"], [role="listitem"], [role="row"]');
    for (var j = 0; j < clickables.length; j++) {
      var el2 = clickables[j];
      var text2 = el2.innerText || '';
      var rect2 = el2.getBoundingClientRect();
      if (text2.indexOf('Compose') >= 0 && rect2.y > 200) {
        return { x: Math.round(rect2.x + rect2.width / 2), y: Math.round(rect2.y + rect2.height / 2), text: text2.substring(0, 60) };
      }
    }

    return null;
  });

  console.log('   Compose 항목:', composeItem);

  if (composeItem) {
    await page.mouse.click(composeItem.x, composeItem.y);
    console.log('   Compose 클릭됨');
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-compose-added3.png' });

  console.log('[7] 액션 추가 확인...');

  var hasCompose = await page.evaluate(function() {
    var text = document.body.innerText;
    return text.indexOf('Inputs') >= 0 || (text.match(/Compose/g) || []).length > 1;
  });

  console.log('   Compose 추가됨:', hasCompose);

  console.log('[8] 플로우 저장 시도...');
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
    console.log('   Save 클릭됨');
    await page.waitForTimeout(15000);
  }

  var currentUrl = page.url();
  console.log('[9] 최종 URL:', currentUrl);

  await page.screenshot({ path: 'C:\\temp\\pa-final-515.png' });

  if (!currentUrl.includes('/flows/new')) {
    console.log('[성공] 플로우 저장됨!');
  }

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
