const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    await dialog.dismiss().catch(function() {});
  });

  await page.screenshot({ path: 'C:\\temp\\click-do-1.png' });

  console.log('[1] Compose 정확한 위치 찾기...');

  // Data Operation 카테고리 아래의 Compose 텍스트 정확한 위치
  var composePos = await page.evaluate(function() {
    var elements = document.querySelectorAll('*');
    var dataOpFound = false;

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var text = (el.innerText || '').trim();
      var rect = el.getBoundingClientRect();

      // "Data Operation" 다음에 나오는 "Compose" 찾기
      if (text === 'Data Operation') {
        dataOpFound = true;
      }

      // 정확히 "Compose" 텍스트만 있는 요소
      if (text === 'Compose' && rect.y > 400 && rect.y < 550 && rect.height > 10 && rect.height < 40) {
        return {
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2),
          tag: el.tagName,
          w: rect.width,
          h: rect.height
        };
      }
    }
    return null;
  });

  console.log('   Compose 위치:', composePos);

  if (composePos) {
    console.log('[2] Compose 클릭...');
    await page.mouse.click(composePos.x, composePos.y);
    await page.waitForTimeout(3000);
  } else {
    // 대안: y=469 근처 직접 클릭
    console.log('[2] 좌표로 클릭 (y=480 근처)...');

    // "Compose" 텍스트 위치 추정 (Data Operation 행에서 오른쪽 부분)
    await page.mouse.click(350, 480);
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: 'C:\\temp\\click-do-2.png' });

  console.log('[3] 결과 확인...');

  var result = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasInputs: text.indexOf('Inputs') >= 0,
      hasParameters: text.indexOf('Parameters') >= 0,
      stillNeedsAction: text.indexOf('should contain at least one trigger and one action') >= 0,
      stillSearchPanel: text.indexOf('Search for an action') >= 0
    };
  });

  console.log('   결과:', result);

  // 성공했으면 저장
  if (result.hasInputs && !result.stillNeedsAction) {
    console.log('[4] 액션 추가 성공! 저장...');

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
      console.log('   저장 완료!');
    }
  } else if (result.stillSearchPanel) {
    // 검색 패널이 여전히 열려있으면 다른 Compose 클릭 시도
    console.log('[4] 다른 Compose 위치 시도...');

    // role="option" 항목 중 Compose 포함된 것 클릭
    var optionWithCompose = await page.evaluate(function() {
      var options = document.querySelectorAll('[role="option"]');
      for (var i = 0; i < options.length; i++) {
        var text = options[i].innerText || '';
        var rect = options[i].getBoundingClientRect();
        // Data Operation과 Compose가 같이 있는 옵션
        if (text.indexOf('Data Operation') >= 0 && text.indexOf('Compose') >= 0) {
          // Compose 텍스트 위치 찾기 (옵션 내에서)
          var composeSpan = options[i].querySelector('span');
          var spans = options[i].querySelectorAll('span');
          for (var j = 0; j < spans.length; j++) {
            if (spans[j].innerText === 'Compose') {
              var r = spans[j].getBoundingClientRect();
              return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
            }
          }
          // 못 찾으면 옵션 자체 클릭
          return { x: Math.round(rect.x + 200), y: Math.round(rect.y + rect.height / 2) };
        }
      }
      return null;
    });

    if (optionWithCompose) {
      console.log('   옵션 내 Compose:', optionWithCompose);
      await page.mouse.click(optionWithCompose.x, optionWithCompose.y);
      await page.waitForTimeout(3000);
    }
  }

  await page.screenshot({ path: 'C:\\temp\\click-do-final.png' });

  // 최종 확인
  var finalState = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasInputs: text.indexOf('Inputs') >= 0,
      stillNeedsAction: text.indexOf('should contain at least one trigger and one action') >= 0
    };
  });

  console.log('[5] 최종:', finalState);

  if (!finalState.stillNeedsAction && finalState.hasInputs) {
    console.log('   액션 추가 성공!');
  }

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
