const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    await dialog.dismiss().catch(function() {});
  });

  await page.screenshot({ path: 'C:\\temp\\fill-1.png' });

  console.log('[1] Compose 설정 패널 확인...');

  var panelState = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasInputs: text.indexOf('Inputs') >= 0,
      hasParameters: text.indexOf('Parameters') >= 0,
      hasCompose: text.indexOf('Compose') >= 0
    };
  });

  console.log('   패널:', panelState);

  if (panelState.hasInputs) {
    console.log('[2] Inputs 필드 찾기...');

    // Inputs 라벨 근처의 입력 필드 찾기
    var inputField = await page.evaluate(function() {
      // 모든 입력 요소 찾기
      var inputs = document.querySelectorAll('input, textarea, [contenteditable="true"], [role="textbox"]');

      for (var i = 0; i < inputs.length; i++) {
        var inp = inputs[i];
        var rect = inp.getBoundingClientRect();

        // 패널 영역 내 (y > 200), 적절한 크기
        if (rect.y > 200 && rect.y < 600 && rect.width > 100) {
          var placeholder = inp.getAttribute('placeholder') || '';
          var ariaLabel = inp.getAttribute('aria-label') || '';

          // 검색창 제외
          if (placeholder.indexOf('Search') < 0) {
            return {
              x: Math.round(rect.x + 50),
              y: Math.round(rect.y + rect.height / 2),
              tag: inp.tagName,
              w: rect.width,
              h: rect.height,
              placeholder: placeholder,
              ariaLabel: ariaLabel
            };
          }
        }
      }
      return null;
    });

    console.log('   입력 필드:', inputField);

    if (inputField) {
      console.log('[3] Inputs에 값 입력...');

      await page.mouse.click(inputField.x, inputField.y);
      await page.waitForTimeout(500);

      // 간단한 테스트 값 입력
      await page.keyboard.type('Email received', { delay: 50 });
      console.log('   입력 완료');
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'C:\\temp\\fill-2.png' });
    } else {
      // 다른 방법: "Inputs" 라벨 아래 영역 클릭
      console.log('[3] Inputs 라벨 근처 클릭...');

      var inputsLabel = await page.evaluate(function() {
        var elements = document.querySelectorAll('*');
        for (var i = 0; i < elements.length; i++) {
          var el = elements[i];
          var text = (el.innerText || '').trim();
          var rect = el.getBoundingClientRect();
          if (text === 'Inputs' && rect.y > 200 && rect.height < 40) {
            // 라벨 아래 영역
            return { x: Math.round(rect.x + 100), y: Math.round(rect.y + 50) };
          }
        }
        return null;
      });

      if (inputsLabel) {
        console.log('   Inputs 라벨 아래:', inputsLabel);
        await page.mouse.click(inputsLabel.x, inputsLabel.y);
        await page.waitForTimeout(500);
        await page.keyboard.type('Email received', { delay: 50 });
        await page.waitForTimeout(1000);
      }
    }
  }

  await page.screenshot({ path: 'C:\\temp\\fill-3.png' });

  console.log('[4] 패널 닫고 저장...');

  // ESC로 패널 닫기
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 상태 확인
  var beforeSave = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      stillNeedsAction: text.indexOf('should contain at least one trigger and one action') >= 0,
      hasCompose: text.indexOf('Compose') >= 0
    };
  });

  console.log('   저장 전 상태:', beforeSave);

  // Save 버튼 클릭
  console.log('[5] Save 클릭...');

  var saveBtn = await page.evaluate(function() {
    var buttons = document.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      var t = buttons[i].innerText || '';
      var r = buttons[i].getBoundingClientRect();
      if (t.indexOf('Save') >= 0 && r.y < 100 && r.width > 40) {
        return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
      }
    }
    return null;
  });

  if (saveBtn) {
    console.log('   Save 버튼:', saveBtn);
    await page.mouse.click(saveBtn.x, saveBtn.y);
    await page.waitForTimeout(20000);

    await page.screenshot({ path: 'C:\\temp\\fill-4.png' });

    // 저장 결과 확인
    var afterSave = await page.evaluate(function() {
      var text = document.body.innerText;
      return {
        hasError: text.indexOf('Error') >= 0 || text.indexOf('error') >= 0,
        savedSuccessfully: text.indexOf('Your flow is ready') >= 0 || text.indexOf('saved') >= 0,
        stillNeedsAction: text.indexOf('should contain at least one trigger and one action') >= 0
      };
    });

    console.log('   저장 후:', afterSave);
    console.log('   URL:', page.url());
  }

  await page.screenshot({ path: 'C:\\temp\\fill-final.png' });

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
