const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  console.log('[1] 현재 상태 스크린샷...');
  await page.screenshot({ path: 'C:\\temp\\pa-current-1.png' });

  console.log('[2] ESC 키로 패널 닫기...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'C:\\temp\\pa-after-escape.png' });

  console.log('[3] 페이지 어딘가 클릭하여 포커스 이동...');
  // 캔버스 영역 클릭 (플로우 다이어그램 영역)
  await page.mouse.click(600, 400);
  await page.waitForTimeout(500);

  console.log('[4] Ctrl+S로 저장 시도...');
  await page.keyboard.down('Control');
  await page.keyboard.press('s');
  await page.keyboard.up('Control');
  await page.waitForTimeout(5000);

  await page.screenshot({ path: 'C:\\temp\\pa-after-ctrl-s.png' });

  var currentUrl = page.url();
  console.log('[5] URL 확인:', currentUrl);

  if (currentUrl.includes('/flows/new')) {
    console.log('   아직 저장되지 않음. Save 버튼 직접 클릭 시도...');

    // Save 버튼 클릭 (약 x=775, y=68)
    await page.mouse.click(775, 68);
    console.log('   Save 좌표 클릭됨');
    await page.waitForTimeout(10000);

    currentUrl = page.url();
    console.log('   재확인 URL:', currentUrl);
  }

  // 플로우 저장 후 상태 확인
  await page.screenshot({ path: 'C:\\temp\\pa-final-save-attempt.png' });

  // 저장 성공 여부
  if (!currentUrl.includes('/flows/new')) {
    var flowIdMatch = currentUrl.match(/flows\/([a-f0-9-]+)/);
    if (flowIdMatch) {
      console.log('[성공] 플로우 저장됨! ID:', flowIdMatch[1]);
    }
  } else {
    console.log('[실패] 플로우가 저장되지 않음');

    // 왜 저장이 안 되는지 분석
    var pageText = await page.evaluate(function() {
      return document.body.innerText.substring(0, 500);
    });
    console.log('   페이지 내용 일부:', pageText.substring(0, 300));
  }

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
