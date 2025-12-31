const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    await dialog.dismiss().catch(function() {});
  });

  await page.screenshot({ path: 'C:\\temp\\pa-check-1.png' });

  console.log('[1] 현재 페이지 상태...');
  var currentUrl = page.url();
  console.log('   URL:', currentUrl);

  console.log('[2] 페이지 내 주요 요소 확인...');

  var pageState = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasInitVar: text.indexOf('Initialize variable') >= 0,
      hasTrigger: text.indexOf('When a new email') >= 0,
      hasSave: text.indexOf('Save') >= 0,
      hasTest: text.indexOf('Test') >= 0,
      errorMsg: text.indexOf('error') >= 0 || text.indexOf('Error') >= 0 ? 'error present' : 'no error'
    };
  });

  console.log('   페이지 상태:', pageState);

  console.log('[3] Save 버튼 좌표 찾기...');

  var saveBtn = await page.evaluate(function() {
    var buttons = document.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var text = btn.innerText || '';
      var rect = btn.getBoundingClientRect();
      if (text.indexOf('Save') >= 0 && rect.y < 150 && rect.width > 40) {
        return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2), text: text.trim() };
      }
    }
    return null;
  });

  console.log('   Save 버튼:', saveBtn);

  if (saveBtn) {
    console.log('[4] Save 버튼 클릭...');
    await page.mouse.click(saveBtn.x, saveBtn.y);
    console.log('   클릭됨!');

    // 저장 완료 대기
    console.log('   저장 대기 (15초)...');
    await page.waitForTimeout(15000);

    var newUrl = page.url();
    console.log('[5] 새 URL:', newUrl);

    if (!newUrl.includes('/flows/new')) {
      var flowIdMatch = newUrl.match(/flows\/([a-f0-9-]+)/);
      if (flowIdMatch) {
        console.log('[성공] 플로우 저장됨! ID:', flowIdMatch[1]);
      }
    } else {
      // URL 변경 대기
      try {
        await page.waitForURL(/flows\/[a-f0-9-]+(?!.*new)/, { timeout: 30000 });
        newUrl = page.url();
        console.log('   URL 변경됨:', newUrl);
        var flowIdMatch = newUrl.match(/flows\/([a-f0-9-]+)/);
        if (flowIdMatch) {
          console.log('[성공] 플로우 저장됨! ID:', flowIdMatch[1]);
        }
      } catch (e) {
        console.log('   URL 변경 타임아웃. 다른 오류 확인...');

        // 오류 메시지 확인
        var errors = await page.evaluate(function() {
          var errs = [];
          document.querySelectorAll('[class*="error"], [class*="Error"], [role="alert"]').forEach(function(el) {
            var text = el.innerText.trim();
            if (text && text.length < 300) errs.push(text);
          });
          return errs;
        });

        if (errors.length > 0) {
          console.log('   오류:', errors);
        }
      }
    }
  } else {
    console.log('   Save 버튼을 찾지 못함');
  }

  await page.screenshot({ path: 'C:\\temp\\pa-check-final.png' });

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
