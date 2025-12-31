const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] Office 365 Outlook 트리거 선택...');
  
  // "When a new email arrives (V3)" - Office 365 Outlook 클릭
  var outlookTrigger = page.locator('[role="row"], [role="option"], div').filter({ 
    hasText: /When a new email arrives \(V3\).*Office 365 Outlook/ 
  }).first();
  
  var isVisible = await outlookTrigger.isVisible().catch(function() { return false; });
  if (isVisible) {
    await outlookTrigger.click();
    console.log('   Office 365 Outlook 트리거 클릭됨');
    await page.waitForTimeout(1000);
  } else {
    // 텍스트로 찾기
    var v3Trigger = page.getByText('When a new email arrives (V3)').first();
    await v3Trigger.click();
    console.log('   V3 트리거 클릭됨');
    await page.waitForTimeout(1000);
  }
  
  await page.screenshot({ path: 'C:\\temp\\pa-outlook-selected.png' });
  
  console.log('[2] Create 버튼 클릭...');
  
  // 좌표로 직접 Create 버튼 클릭 (대략 1010, 765)
  await page.mouse.click(1009, 764);
  console.log('   Create 좌표 클릭됨');
  
  await page.waitForTimeout(8000);
  await page.screenshot({ path: 'C:\\temp\\pa-outlook-created.png' });
  
  var currentUrl = page.url();
  console.log('[3] 현재 URL:', currentUrl);
  
  var isFlowEditor = currentUrl.includes('flows/') || currentUrl.includes('/edit');
  console.log('   플로우 에디터:', isFlowEditor);
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
