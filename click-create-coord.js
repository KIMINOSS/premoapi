const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  console.log('[1] Create 링크 좌표 클릭 (808, 611)...');

  // Create 버튼/링크 클릭
  await page.mouse.click(808, 611);
  console.log('   클릭됨!');

  console.log('[2] 플로우 에디터 로딩 대기 (15초)...');
  await page.waitForTimeout(15000);

  await page.screenshot({ path: 'C:\\temp\\pa-flow-editor.png' });

  var currentUrl = page.url();
  console.log('[3] 현재 URL:', currentUrl);

  var isFlowEditor = currentUrl.includes('flows/') || currentUrl.includes('/edit');
  console.log('   플로우 에디터 진입:', isFlowEditor);

  if (isFlowEditor) {
    console.log('[4] 성공! 플로우 에디터에 진입했습니다.');

    // 페이지 내용 확인
    var pageTitle = await page.title();
    console.log('   페이지 제목:', pageTitle);
  } else {
    console.log('[4] 아직 플로우 에디터가 아님. 현재 상태 확인...');

    // 오류 메시지 확인
    var errorText = await page.evaluate(function() {
      var errors = document.querySelectorAll('[class*="error"], [class*="Error"], [role="alert"]');
      var result = [];
      errors.forEach(function(e) {
        if (e.innerText) result.push(e.innerText.substring(0, 100));
      });
      return result;
    });

    if (errorText.length > 0) {
      console.log('   오류 메시지:', errorText);
    }
  }

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
