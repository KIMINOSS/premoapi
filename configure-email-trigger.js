const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  console.log('[1] 플로우 에디터 로딩 대기...');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:\\temp\\pa-editor-initial.png' });

  console.log('[2] 현재 페이지 상태 확인...');
  var pageTitle = await page.title();
  console.log('   페이지 제목:', pageTitle);

  // 트리거 카드 찾기
  console.log('[3] 트리거 카드 클릭하여 설정 열기...');

  // "When a new email arrives (V3)" 텍스트가 있는 요소 찾기
  var triggerCard = page.locator('text=When a new email arrives').first();
  var isVisible = await triggerCard.isVisible().catch(function() { return false; });

  if (isVisible) {
    await triggerCard.click();
    console.log('   트리거 카드 클릭됨');
    await page.waitForTimeout(2000);
  } else {
    console.log('   트리거 카드를 텍스트로 찾지 못함. 대안 시도...');

    // 첫 번째 플로우 단계/카드 클릭
    var firstStep = page.locator('[class*="flow-card"], [class*="FlowCard"], [class*="operation"], [data-automation-id*="trigger"]').first();
    isVisible = await firstStep.isVisible().catch(function() { return false; });

    if (isVisible) {
      await firstStep.click();
      console.log('   첫 번째 단계 클릭됨');
      await page.waitForTimeout(2000);
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-trigger-settings.png' });

  // 설정 패널 확인
  console.log('[4] 설정 패널 내용 확인...');

  var settingsPanel = await page.evaluate(function() {
    var panels = document.querySelectorAll('[class*="panel"], [class*="Panel"], [class*="pane"], [class*="Pane"]');
    var result = [];
    panels.forEach(function(p) {
      var rect = p.getBoundingClientRect();
      if (rect.width > 200) {
        result.push({
          className: (p.className || '').substring(0, 100),
          innerText: (p.innerText || '').substring(0, 300)
        });
      }
    });
    return result;
  });

  console.log('   패널 수:', settingsPanel.length);

  // 입력 필드 확인
  var inputs = await page.evaluate(function() {
    var inputElements = document.querySelectorAll('input, select, [role="combobox"]');
    var result = [];
    inputElements.forEach(function(inp) {
      var label = inp.getAttribute('aria-label') || inp.getAttribute('placeholder') || inp.getAttribute('name') || '';
      var rect = inp.getBoundingClientRect();
      if (rect.width > 50 && label) {
        result.push({
          type: inp.tagName,
          label: label.substring(0, 50),
          x: Math.round(rect.x),
          y: Math.round(rect.y)
        });
      }
    });
    return result;
  });

  console.log('   입력 필드들:', JSON.stringify(inputs, null, 2));

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
