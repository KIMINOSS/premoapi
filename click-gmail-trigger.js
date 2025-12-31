const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] Gmail 트리거 클릭...');
  
  // Gmail 트리거 찾기 및 클릭
  const gmailTrigger = await page.locator('div, button, [role="option"]').filter({ 
    hasText: /When a new email arrives.*Gmail|Gmail.*When a new email/ 
  }).first();
  
  var isVisible = await gmailTrigger.isVisible().catch(function() { return false; });
  
  if (isVisible) {
    await gmailTrigger.click();
    console.log('   Gmail 트리거 클릭됨');
    await page.waitForTimeout(1500);
  } else {
    // 텍스트로 직접 찾기
    const gmail = await page.getByText('Gmail', { exact: false }).first();
    var gmailVisible = await gmail.isVisible().catch(function() { return false; });
    if (gmailVisible) {
      await gmail.click();
      console.log('   Gmail 텍스트 클릭됨');
      await page.waitForTimeout(1500);
    }
  }
  
  await page.screenshot({ path: 'C:\\temp\\pa-gmail-clicked.png' });
  
  console.log('[2] Create 버튼 확인...');
  
  const createBtn = await page.locator('button').filter({ hasText: /^Create$/ }).first();
  var btnVisible = await createBtn.isVisible().catch(function() { return false; });
  
  if (btnVisible) {
    var isDisabled = await createBtn.isDisabled().catch(function() { return true; });
    console.log('   Create 버튼 비활성화:', isDisabled);
    
    if (!isDisabled) {
      await createBtn.click();
      console.log('   Create 클릭됨');
      await page.waitForTimeout(4000);
      await page.screenshot({ path: 'C:\\temp\\pa-flow-editor.png' });
    }
  }
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
