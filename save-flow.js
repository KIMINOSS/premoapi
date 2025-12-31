const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  await page.screenshot({ path: 'C:\\temp\\pa-before-save.png' });

  console.log('[1] Save 버튼 클릭...');

  var saveBtn = page.getByRole('button', { name: 'Save' });
  var isVisible = await saveBtn.isVisible().catch(function() { return false; });

  if (isVisible) {
    await saveBtn.click();
    console.log('   Save 버튼 클릭됨');
    await page.waitForTimeout(5000);
  } else {
    // 대안: Save 텍스트가 있는 버튼
    var saveBtnAlt = page.locator('button:has-text("Save")').first();
    isVisible = await saveBtnAlt.isVisible().catch(function() { return false; });

    if (isVisible) {
      await saveBtnAlt.click();
      console.log('   Save 버튼 (대안) 클릭됨');
      await page.waitForTimeout(5000);
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-after-save.png' });

  console.log('[2] 저장 결과 확인...');

  // 성공/오류 메시지 확인
  var messages = await page.evaluate(function() {
    var result = { success: [], error: [] };

    // 성공 메시지
    document.querySelectorAll('[class*="success"], [class*="Success"], [role="alert"]').forEach(function(el) {
      var text = el.innerText.trim();
      if (text && text.length < 200) result.success.push(text);
    });

    // 오류 메시지
    document.querySelectorAll('[class*="error"], [class*="Error"]').forEach(function(el) {
      var text = el.innerText.trim();
      if (text && text.length < 200) result.error.push(text);
    });

    return result;
  });

  if (messages.success.length > 0) {
    console.log('   성공 메시지:', messages.success);
  }
  if (messages.error.length > 0) {
    console.log('   오류 메시지:', messages.error);
  }

  console.log('[3] 현재 URL 확인...');
  var currentUrl = page.url();
  console.log('   URL:', currentUrl);

  // 플로우 ID 추출
  var flowIdMatch = currentUrl.match(/flows\/([a-f0-9-]+)/);
  if (flowIdMatch) {
    console.log('   플로우 ID:', flowIdMatch[1]);
  }

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
