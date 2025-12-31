const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    await dialog.dismiss().catch(function() {});
  });

  console.log('[1] 패널 강제 닫기 (여러 방법 시도)...');

  // 방법 1: 왼쪽 끝 클릭
  await page.mouse.click(50, 350);
  await page.waitForTimeout(500);

  // 방법 2: ESC 여러 번
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 방법 3: X 버튼 또는 닫기 버튼 찾기
  var closeBtn = await page.evaluate(function() {
    var buttons = document.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      var ariaLabel = buttons[i].getAttribute('aria-label') || '';
      var text = buttons[i].innerText || '';
      if (ariaLabel.indexOf('Close') >= 0 || ariaLabel.indexOf('close') >= 0 || text === 'X' || text === '×') {
        var rect = buttons[i].getBoundingClientRect();
        return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) };
      }
    }
    return null;
  });

  if (closeBtn) {
    console.log('   닫기 버튼 발견:', closeBtn);
    await page.mouse.click(closeBtn.x, closeBtn.y);
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-force-close-1.png' });

  console.log('[2] 패널 상태 확인...');

  var panelStillOpen = await page.evaluate(function() {
    // "Parameters" 탭이 보이면 패널이 열려있음
    var text = document.body.innerText;
    return text.indexOf('Parameters\nSettings\nCode view') >= 0;
  });

  console.log('   패널 열림:', panelStillOpen);

  if (panelStillOpen) {
    // 방법 4: 패널 외부 (매우 왼쪽) 클릭
    console.log('   패널 외부 클릭...');
    await page.mouse.click(10, 400);
    await page.waitForTimeout(500);

    // Back 버튼 누르기
    var backBtn = page.locator('text=Back').first();
    var isVisible = await backBtn.isVisible().catch(function() { return false; });
    if (isVisible) {
      // Back 버튼은 누르지 말고, 그 근처 클릭
      console.log('   Back 영역 근처 클릭...');
      await page.mouse.click(70, 120);
      await page.waitForTimeout(500);
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-force-close-2.png' });

  console.log('[3] + 버튼 찾기 및 클릭...');

  var plusBtn = await page.evaluate(function() {
    var buttons = document.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      var ariaLabel = buttons[i].getAttribute('aria-label') || '';
      if (ariaLabel.indexOf('Insert a new action') >= 0) {
        var rect = buttons[i].getBoundingClientRect();
        return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2), label: ariaLabel };
      }
    }
    return null;
  });

  console.log('   + 버튼:', plusBtn);

  if (plusBtn) {
    // force: true 옵션으로 클릭
    await page.mouse.click(plusBtn.x, plusBtn.y, { force: true });
    console.log('   + 버튼 클릭됨');
    await page.waitForTimeout(2000);
  } else {
    // 좌표로 직접 클릭 (515, 232)
    console.log('   좌표로 클릭 (515, 232)...');
    await page.mouse.click(515, 232, { force: true });
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-plus-result.png' });

  console.log('[4] 결과 확인...');

  var menuOpened = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasAddAction: text.indexOf('Add an action') >= 0,
      hasSearch: document.querySelector('input[placeholder*="Search"]') !== null,
      hasRuntime: text.indexOf('Runtime') >= 0 || text.indexOf('Built-in') >= 0
    };
  });

  console.log('   메뉴 상태:', menuOpened);

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
