const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  console.log('[1] 추가 대기 (10초)...');
  await page.waitForTimeout(10000);

  await page.screenshot({ path: 'C:\\temp\\pa-wait-10s.png' });

  var currentUrl = page.url();
  console.log('[2] 현재 URL:', currentUrl);

  if (currentUrl.includes('/flows/new')) {
    console.log('   아직 저장되지 않음. URL 변경 대기...');

    // URL 변경 대기
    try {
      await page.waitForURL(/flows\/[a-f0-9-]+(?!.*new)/, { timeout: 20000 });
      currentUrl = page.url();
      console.log('   URL 변경됨:', currentUrl);
    } catch (e) {
      console.log('   URL 변경 타임아웃');
    }
  }

  // 최종 상태 확인
  await page.screenshot({ path: 'C:\\temp\\pa-final-state.png' });

  console.log('[3] 최종 상태 분석...');

  // 오류 메시지 확인
  var errors = await page.evaluate(function() {
    var result = [];
    document.querySelectorAll('[class*="error"], [class*="Error"], [class*="warning"], [class*="Warning"]').forEach(function(el) {
      var text = el.innerText.trim();
      if (text && text.length < 300) result.push(text);
    });
    return result;
  });

  if (errors.length > 0) {
    console.log('   오류/경고:', errors);
  }

  // 성공 메시지 확인
  var success = await page.evaluate(function() {
    var result = [];
    document.querySelectorAll('[class*="success"], [class*="Success"]').forEach(function(el) {
      var text = el.innerText.trim();
      if (text) result.push(text);
    });
    return result;
  });

  if (success.length > 0) {
    console.log('   성공:', success);
  }

  // 현재 플로우 상태
  var flowStatus = await page.evaluate(function() {
    var statusEl = document.querySelector('[class*="status"], [class*="Status"]');
    if (statusEl) return statusEl.innerText;

    // 페이지 제목에서 상태 확인
    return document.title;
  });

  console.log('   플로우 상태:', flowStatus);

  // 플로우 ID 확인
  var flowIdMatch = currentUrl.match(/flows\/([a-f0-9-]+)/);
  if (flowIdMatch && !currentUrl.includes('new')) {
    console.log('   [성공] 플로우 ID:', flowIdMatch[1]);
  }

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
