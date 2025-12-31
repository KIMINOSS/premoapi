const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] "When a new email arrives" 클릭...');
  
  // Gmail/Email 트리거 클릭
  const emailTrigger = await page.locator('button, [role="option"], [role="listitem"], div').filter({ 
    hasText: /When a new email arrives/ 
  }).first();
  
  const isVisible = await emailTrigger.isVisible().catch(function() { return false; });
  if (isVisible) {
    await emailTrigger.click();
    console.log('   트리거 클릭됨');
    await page.waitForTimeout(1500);
  }
  
  await page.screenshot({ path: 'C:\\temp\\pa-email-trigger-clicked.png' });
  
  console.log('[2] Create 버튼 확인...');
  
  const createBtn = await page.locator('button').filter({ hasText: /^Create$/ }).first();
  const btnVisible = await createBtn.isVisible().catch(function() { return false; });
  
  if (btnVisible) {
    const isDisabled = await createBtn.isDisabled().catch(function() { return true; });
    console.log('   Create 버튼 비활성화:', isDisabled);
    
    if (!isDisabled) {
      await createBtn.click();
      console.log('   Create 클릭됨');
      await page.waitForTimeout(3000);
    }
  }
  
  await page.screenshot({ path: 'C:\\temp\\pa-after-create-click.png' });
  console.log('   완료');
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
