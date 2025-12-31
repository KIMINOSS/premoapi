const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] Gmail 검색...');
  
  // 검색 필드에 Gmail 입력
  var searchInput = page.locator('input[placeholder*="Search all triggers"]');
  await searchInput.fill('');
  await searchInput.fill('Gmail');
  await page.waitForTimeout(2000);
  
  console.log('[2] Gmail 트리거 선택...');
  
  // When a new email arrives - Gmail 선택
  var gmailTrigger = page.locator('div').filter({ hasText: /^When a new email arrivesGmail$/ }).first();
  var isVisible = await gmailTrigger.isVisible().catch(function() { return false; });
  
  if (isVisible) {
    await gmailTrigger.click();
    console.log('   Gmail 트리거 선택됨');
    await page.waitForTimeout(1000);
  } else {
    // 텍스트로 찾기
    var gmail = page.getByText('When a new email arrives').first();
    await gmail.click();
    console.log('   Gmail 텍스트 클릭됨');
    await page.waitForTimeout(1000);
  }
  
  await page.screenshot({ path: 'C:\\temp\\pa-gmail-reselect.png' });
  
  console.log('[3] Create 버튼 클릭 (버튼 2)...');
  
  // 버튼 2가 대화상자 내 Create 버튼
  var createBtns = page.getByRole('button', { name: 'Create' });
  var btn2 = createBtns.nth(2);
  await btn2.click();
  console.log('   Create 버튼 클릭됨');
  
  await page.waitForTimeout(8000);
  await page.screenshot({ path: 'C:\\temp\\pa-flow-editor-final.png' });
  
  var currentUrl = page.url();
  console.log('[4] 현재 URL:', currentUrl);
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
