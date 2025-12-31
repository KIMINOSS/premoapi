const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    await dialog.dismiss().catch(function() {});
  });

  console.log('[1] 현재 URL 확인...');
  var currentUrl = page.url();
  console.log('   URL:', currentUrl);

  console.log('[2] 뒤로 가기...');
  await page.goBack();
  await page.waitForTimeout(5000);

  currentUrl = page.url();
  console.log('   새 URL:', currentUrl);

  await page.screenshot({ path: 'C:\\temp\\pa-go-back.png' });

  // 플로우 에디터인지 확인
  if (currentUrl.includes('/flows/') || currentUrl.includes('newFlowName')) {
    console.log('[3] 플로우 에디터로 복귀');

    // 페이지 상태 확인
    var pageState = await page.evaluate(function() {
      return {
        title: document.title,
        hasTrigger: document.body.innerText.indexOf('When a new email') >= 0,
        hasSave: document.body.innerText.indexOf('Save') >= 0
      };
    });

    console.log('   페이지 상태:', pageState);
  } else {
    // Create 페이지로 직접 이동
    console.log('[3] 플로우 에디터가 아님. Create 페이지로 이동...');

    await page.goto('https://make.powerautomate.com/environments/Default-ef30448f-b0ea-4625-99b6-991583884a18/flows/new?newFlowName=PREMO-Gmail-Auth&trigger=%2Fproviders%2FMicrosoft.PowerApps%2Fapis%2Fshared_office365%2FapiOperations%2FOnNewEmailV3&v3=true');
    await page.waitForTimeout(8000);

    currentUrl = page.url();
    console.log('   이동 후 URL:', currentUrl);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-returned.png' });

  // 트리거 설정 확인
  console.log('[4] 트리거 설정 복원 확인...');

  var hasTrigger = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      trigger: text.indexOf('When a new email arrives') >= 0,
      fromFilter: text.indexOf('onboarding@resend.dev') >= 0
    };
  });

  console.log('   트리거:', hasTrigger);

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
