const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  console.log('[1] 트리거 아래 + 버튼 찾기...');

  // ESC로 현재 패널 닫기
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'C:\\temp\\pa-find-plus.png' });

  // + 버튼 또는 "Add an action" 버튼 찾기
  var plusBtnPos = await page.evaluate(function() {
    // + 아이콘이 있는 버튼 찾기
    var btns = document.querySelectorAll('button, [class*="add"], [class*="Add"]');
    for (var i = 0; i < btns.length; i++) {
      var text = btns[i].innerText || btns[i].getAttribute('aria-label') || '';
      var rect = btns[i].getBoundingClientRect();
      // 트리거 아래에 위치한 추가 버튼
      if ((text.indexOf('+') >= 0 || text.toLowerCase().indexOf('add') >= 0 || text.indexOf('action') >= 0) && rect.y > 300 && rect.y < 700) {
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: text.substring(0, 50) };
      }
    }
    return null;
  });

  console.log('   + 버튼:', plusBtnPos);

  if (!plusBtnPos) {
    // 플로우 캔버스에서 트리거 카드 아래 영역 클릭하여 액션 추가 메뉴 열기
    console.log('   + 버튼을 찾지 못함. 트리거 아래 영역 클릭...');

    // 트리거 카드 위치 찾기
    var triggerPos = await page.evaluate(function() {
      var els = document.querySelectorAll('[class*="trigger"], [class*="Trigger"], [class*="operation"], [class*="Operation"]');
      for (var i = 0; i < els.length; i++) {
        var rect = els[i].getBoundingClientRect();
        if (rect.width > 100 && rect.height > 50 && rect.y > 200) {
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height + 30 };
        }
      }
      return { x: 500, y: 450 };
    });

    await page.mouse.click(triggerPos.x, triggerPos.y);
    await page.waitForTimeout(1000);
  } else {
    await page.mouse.click(plusBtnPos.x, plusBtnPos.y);
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-after-plus-click.png' });

  console.log('[2] Add an action 메뉴 확인...');

  // "Add an action" 버튼 또는 액션 검색 필드 찾기
  var addActionBtn = page.locator('text=Add an action').first();
  var isVisible = await addActionBtn.isVisible().catch(function() { return false; });

  if (isVisible) {
    await addActionBtn.click();
    console.log('   Add an action 클릭됨');
    await page.waitForTimeout(1500);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-action-menu.png' });

  console.log('[3] 간단한 액션 검색 (Compose)...');

  // 검색 필드 찾기
  var searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
  isVisible = await searchInput.isVisible().catch(function() { return false; });

  if (isVisible) {
    await searchInput.fill('Compose');
    console.log('   "Compose" 검색됨');
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-search-compose.png' });

  console.log('[4] Compose 액션 선택...');

  // Compose 액션 클릭 (Data Operation - Compose)
  var composeAction = page.locator('text=Compose').first();
  isVisible = await composeAction.isVisible().catch(function() { return false; });

  if (isVisible) {
    await composeAction.click();
    console.log('   Compose 액션 선택됨');
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-compose-selected.png' });

  console.log('[5] Compose 입력값 설정...');

  // Compose의 Inputs 필드에 이메일 제목 입력
  var inputField = page.locator('input, textarea').filter({ hasText: /Inputs/i }).first();
  isVisible = await inputField.isVisible().catch(function() { return false; });

  if (!isVisible) {
    // 대안: placeholder로 찾기
    inputField = page.locator('[placeholder*="Enter"], [aria-label*="Inputs"]').first();
    isVisible = await inputField.isVisible().catch(function() { return false; });
  }

  if (isVisible) {
    await inputField.click();
    await inputField.fill('Email received');
    console.log('   입력값 설정됨');
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-compose-configured.png' });

  console.log('[6] 플로우 저장...');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Save 버튼 클릭
  var saveBtn = page.locator('button:has-text("Save")').first();
  await saveBtn.click();
  console.log('   Save 클릭됨');

  await page.waitForTimeout(10000);

  var currentUrl = page.url();
  console.log('[7] 최종 URL:', currentUrl);

  if (!currentUrl.includes('/flows/new')) {
    var flowIdMatch = currentUrl.match(/flows\/([a-f0-9-]+)/);
    if (flowIdMatch) {
      console.log('[성공] 플로우 저장됨! ID:', flowIdMatch[1]);
    }
  } else {
    console.log('[진행중] 아직 저장 중...');
  }

  await page.screenshot({ path: 'C:\\temp\\pa-final-result.png' });

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
