const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    await dialog.dismiss().catch(function() {});
  });

  console.log('[1] 트리거 카드 클릭하여 설정 열기...');

  var triggerText = page.locator('text=When a new email arrives').first();
  var isVisible = await triggerText.isVisible().catch(function() { return false; });

  if (isVisible) {
    await triggerText.click();
    await page.waitForTimeout(1500);
  }

  console.log('[2] From 필터 설정...');

  var showAllBtn = page.locator('button:has-text("Show all")');
  isVisible = await showAllBtn.isVisible().catch(function() { return false; });
  if (isVisible) {
    await showAllBtn.click();
    await page.waitForTimeout(1000);
  }

  var fromInput = await page.evaluate(function() {
    var labels = document.querySelectorAll('label, span, div');
    for (var i = 0; i < labels.length; i++) {
      var text = labels[i].innerText.trim();
      if (text === 'From' || text === 'From *') {
        var rect = labels[i].getBoundingClientRect();
        var inputs = document.querySelectorAll('input');
        for (var j = 0; j < inputs.length; j++) {
          var inputRect = inputs[j].getBoundingClientRect();
          if (Math.abs(inputRect.y - rect.y) < 50 && inputRect.y >= rect.y) {
            return { x: inputRect.x + inputRect.width / 2, y: inputRect.y + inputRect.height / 2 };
          }
        }
      }
    }
    return null;
  });

  if (fromInput) {
    await page.mouse.click(fromInput.x, fromInput.y);
    await page.keyboard.type('onboarding@resend.dev');
    console.log('   From 필터 입력됨');
    await page.waitForTimeout(1000);
  }

  console.log('[3] ESC로 패널 닫기...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  console.log('[4] Insert action 버튼 찾기...');

  var insertBtn = await page.evaluate(function() {
    var buttons = document.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      var ariaLabel = buttons[i].getAttribute('aria-label') || '';
      var rect = buttons[i].getBoundingClientRect();
      if (ariaLabel.indexOf('Insert') >= 0 && ariaLabel.indexOf('action') >= 0 && rect.y > 200 && rect.y < 400) {
        return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) };
      }
    }
    return null;
  });

  console.log('   Insert 버튼:', insertBtn);

  if (insertBtn) {
    await page.mouse.click(insertBtn.x, insertBtn.y);
    console.log('   Insert 클릭됨');
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-insert-menu.png' });

  console.log('[5] Add an action 클릭...');

  var addActionBtn = page.locator('text=Add an action').first();
  isVisible = await addActionBtn.isVisible().catch(function() { return false; });
  if (isVisible) {
    await addActionBtn.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-action-search.png' });

  console.log('[6] 검색 필드 확인...');

  var searchInput = page.locator('input[placeholder*="Search"]').first();
  isVisible = await searchInput.isVisible().catch(function() { return false; });

  if (isVisible) {
    await searchInput.click();
    await searchInput.fill('');
    await page.waitForTimeout(200);
    await page.keyboard.type('Compose', { delay: 50 });
    console.log('   Compose 검색됨');
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-compose-results.png' });

  console.log('[7] Compose 선택...');

  var composeItem = await page.evaluate(function() {
    var items = document.querySelectorAll('[role="row"], [role="option"], [role="listitem"], div');
    for (var i = 0; i < items.length; i++) {
      var text = items[i].innerText || '';
      var rect = items[i].getBoundingClientRect();
      if (text.indexOf('Compose') >= 0 && text.indexOf('Data Operations') >= 0 && rect.y > 250 && rect.y < 600 && rect.height > 30 && rect.height < 100) {
        return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2), text: text.substring(0, 80) };
      }
    }
    // 단순히 Compose만 있는 항목
    for (var j = 0; j < items.length; j++) {
      var text2 = items[j].innerText || '';
      var rect2 = items[j].getBoundingClientRect();
      if (text2 === 'Compose' && rect2.y > 250 && rect2.y < 600) {
        return { x: Math.round(rect2.x + rect2.width / 2), y: Math.round(rect2.y + rect2.height / 2), text: text2 };
      }
    }
    return null;
  });

  console.log('   Compose 항목:', composeItem);

  if (composeItem) {
    await page.mouse.click(composeItem.x, composeItem.y);
    console.log('   Compose 선택됨');
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-compose-selected.png' });

  console.log('[8] 플로우 저장...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  var saveBtn = await page.evaluate(function() {
    var buttons = document.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      var text = buttons[i].innerText || '';
      var rect = buttons[i].getBoundingClientRect();
      if (text.indexOf('Save') >= 0 && rect.y < 100 && rect.y > 30) {
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

  await page.screenshot({ path: 'C:\\temp\\pa-flow-saved.png' });

  if (!currentUrl.includes('/flows/new')) {
    var flowIdMatch = currentUrl.match(/flows\/([a-f0-9-]+)/);
    if (flowIdMatch) {
      console.log('[성공] 플로우 저장 완료! ID:', flowIdMatch[1]);
    }
  }

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
