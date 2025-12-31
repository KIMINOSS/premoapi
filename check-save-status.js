const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  await page.screenshot({ path: 'C:\\temp\\pa-save-status.png' });

  console.log('[1] 현재 페이지 상태 분석...');

  // 현재 보이는 모든 대화상자/모달 확인
  var dialogs = await page.evaluate(function() {
    var result = [];
    document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="Modal"], [class*="Dialog"]').forEach(function(d) {
      var rect = d.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 100) {
        result.push({
          role: d.getAttribute('role'),
          text: d.innerText.substring(0, 200)
        });
      }
    });
    return result;
  });

  console.log('   대화상자:', dialogs.length > 0 ? dialogs : '없음');

  // 로딩 상태 확인
  var isLoading = await page.evaluate(function() {
    var spinners = document.querySelectorAll('[class*="spinner"], [class*="Spinner"], [class*="loading"], [class*="Loading"]');
    return spinners.length > 0;
  });

  console.log('   로딩 중:', isLoading);

  // 토스트/알림 메시지 확인
  var toasts = await page.evaluate(function() {
    var result = [];
    document.querySelectorAll('[class*="toast"], [class*="Toast"], [class*="notification"], [class*="Notification"], [role="status"]').forEach(function(t) {
      var text = t.innerText.trim();
      if (text) result.push(text);
    });
    return result;
  });

  console.log('   알림 메시지:', toasts.length > 0 ? toasts : '없음');

  console.log('[2] 버튼 상태 확인...');

  var buttons = await page.evaluate(function() {
    var result = [];
    document.querySelectorAll('button').forEach(function(b) {
      var text = b.innerText.trim();
      var rect = b.getBoundingClientRect();
      if (text && rect.y > 0 && rect.y < 200 && rect.width > 50) {
        result.push({ text: text.substring(0, 30), disabled: b.disabled });
      }
    });
    return result;
  });

  console.log('   상단 버튼들:', buttons);

  console.log('[3] Save 버튼 다시 시도...');

  // Save 버튼 위치 찾기
  var saveBtnPos = await page.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].innerText.indexOf('Save') >= 0) {
        var rect = btns[i].getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: btns[i].innerText.trim() };
      }
    }
    return null;
  });

  if (saveBtnPos) {
    console.log('   Save 버튼 위치:', saveBtnPos);
    await page.mouse.click(saveBtnPos.x, saveBtnPos.y);
    console.log('   클릭됨!');
    await page.waitForTimeout(8000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-after-save-retry.png' });

  // URL 재확인
  var currentUrl = page.url();
  console.log('[4] 현재 URL:', currentUrl);

  var flowIdMatch = currentUrl.match(/flows\/([a-f0-9-]+)/);
  if (flowIdMatch && !currentUrl.includes('/new')) {
    console.log('   플로우 저장 성공! ID:', flowIdMatch[1]);
  }

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
