const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  // 대화상자 자동 처리
  page.on('dialog', async function(dialog) {
    console.log('   대화상자 발생:', dialog.message());
    await dialog.dismiss().catch(function() {});
  });

  await page.screenshot({ path: 'C:\\temp\\pa-step1.png' });

  console.log('[1] 현재 페이지 상태...');
  var currentUrl = page.url();
  console.log('   URL:', currentUrl);

  console.log('[2] ESC로 패널 닫기...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  console.log('[3] 트리거 카드 아래 + 버튼 영역 찾기...');

  // New designer에서 + 버튼은 보통 트리거 카드 바로 아래에 있음
  var plusBtn = await page.evaluate(function() {
    // 모든 버튼 중 + 아이콘 또는 "New step" 텍스트가 있는 것
    var buttons = document.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var text = btn.innerText || '';
      var ariaLabel = btn.getAttribute('aria-label') || '';
      var rect = btn.getBoundingClientRect();

      // y > 350 (트리거 아래), 화면 내에 있는 버튼
      if (rect.y > 350 && rect.y < 600 && rect.width > 20) {
        if (text === '+' || text === '＋' || ariaLabel.indexOf('Add') >= 0 || ariaLabel.indexOf('New') >= 0 || ariaLabel.indexOf('Insert') >= 0) {
          return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2), label: ariaLabel || text };
        }
      }
    }

    // svg 아이콘으로 된 + 버튼 찾기
    var svgs = document.querySelectorAll('svg');
    for (var j = 0; j < svgs.length; j++) {
      var svg = svgs[j];
      var parent = svg.closest('button');
      if (parent) {
        var rect = parent.getBoundingClientRect();
        if (rect.y > 350 && rect.y < 600 && rect.width < 50) {
          return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2), label: 'svg button' };
        }
      }
    }

    return null;
  });

  console.log('   + 버튼:', plusBtn);

  if (plusBtn) {
    await page.mouse.click(plusBtn.x, plusBtn.y);
    console.log('   + 버튼 클릭됨');
    await page.waitForTimeout(2000);
  } else {
    // 트리거 카드 아래 중앙 영역 클릭
    console.log('   + 버튼을 찾지 못함. 트리거 아래 영역 클릭 (500, 450)...');
    await page.mouse.click(500, 450);
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-step2-after-plus.png' });

  console.log('[4] Add an action 버튼/메뉴 확인...');

  // "Add an action" 또는 액션 목록 패널 확인
  var hasActionMenu = await page.evaluate(function() {
    var text = document.body.innerText;
    return text.indexOf('Add an action') >= 0 || text.indexOf('Search actions') >= 0 || text.indexOf('Choose an operation') >= 0;
  });

  console.log('   액션 메뉴 표시:', hasActionMenu);

  if (!hasActionMenu) {
    // "Add an action" 버튼 직접 클릭
    var addActionBtn = page.locator('text=Add an action').first();
    var isVisible = await addActionBtn.isVisible().catch(function() { return false; });

    if (isVisible) {
      await addActionBtn.click();
      console.log('   Add an action 버튼 클릭됨');
      await page.waitForTimeout(2000);
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-step3-action-menu.png' });

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
