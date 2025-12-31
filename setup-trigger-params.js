const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  console.log('[1] Parameters 탭 클릭...');

  var parametersBtn = page.getByRole('button', { name: 'Parameters' });
  var isVisible = await parametersBtn.isVisible().catch(function() { return false; });

  if (isVisible) {
    await parametersBtn.click();
    console.log('   Parameters 탭 클릭됨');
    await page.waitForTimeout(1500);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-parameters-tab.png' });

  console.log('[2] Advanced parameters 클릭하여 필터 옵션 표시...');

  var advancedBtn = page.locator('text=Advanced parameters');
  isVisible = await advancedBtn.isVisible().catch(function() { return false; });

  if (isVisible) {
    await advancedBtn.click();
    console.log('   Advanced parameters 클릭됨');
    await page.waitForTimeout(1500);
  } else {
    // Show all 클릭
    var showAllBtn = page.getByRole('button', { name: 'Show all' });
    isVisible = await showAllBtn.isVisible().catch(function() { return false; });
    if (isVisible) {
      await showAllBtn.click();
      console.log('   Show all 클릭됨');
      await page.waitForTimeout(1500);
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-advanced-params.png' });

  console.log('[3] 현재 보이는 입력 필드들...');

  var allInputs = await page.evaluate(function() {
    var results = [];
    var inputs = document.querySelectorAll('input, [role="combobox"], select, textarea');
    inputs.forEach(function(inp) {
      var rect = inp.getBoundingClientRect();
      if (rect.width > 50 && rect.y > 100) {
        var label = inp.getAttribute('aria-label') || inp.getAttribute('placeholder') || '';
        var id = inp.id || '';
        results.push({
          tag: inp.tagName,
          label: label.substring(0, 60),
          id: id.substring(0, 40),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          value: (inp.value || '').substring(0, 30)
        });
      }
    });
    return results;
  });

  console.log('   입력 필드들:');
  allInputs.forEach(function(inp) {
    console.log('   - ' + inp.label + ' (y=' + inp.y + ')');
  });

  // 페이지에서 "From", "Folder" 등의 레이블 위치 찾기
  console.log('[4] From 필드 찾기...');

  var fromField = await page.evaluate(function() {
    // "From" 레이블을 가진 입력 필드 찾기
    var labels = document.querySelectorAll('label, span, div');
    for (var i = 0; i < labels.length; i++) {
      var text = labels[i].innerText.trim();
      if (text === 'From' || text === 'From *') {
        var rect = labels[i].getBoundingClientRect();
        // 근처의 입력 필드 찾기
        var parent = labels[i].closest('[class*="field"], [class*="Field"], div');
        if (parent) {
          var input = parent.querySelector('input, [role="combobox"]');
          if (input) {
            var inputRect = input.getBoundingClientRect();
            return { labelY: rect.y, inputX: inputRect.x, inputY: inputRect.y };
          }
        }
        return { labelY: rect.y, found: false };
      }
    }
    return null;
  });

  console.log('   From 필드:', fromField);

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
