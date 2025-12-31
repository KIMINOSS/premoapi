const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  await page.screenshot({ path: 'C:\\temp\\pa-auto-setup1.png' });
  
  console.log('[1] 입력 필드 확인...');
  
  const inputs = await page.locator('input').all();
  console.log('   입력 필드 수:', inputs.length);
  
  console.log('[2] 흐름 이름 입력...');
  
  const nameInput = inputs[0];
  if (nameInput) {
    await nameInput.fill('');
    await nameInput.fill('PREMO-Gmail-Auth');
    console.log('   이름 입력됨');
  }
  
  console.log('[3] Gmail 트리거 검색...');
  
  if (inputs.length > 1) {
    await inputs[1].fill('Gmail');
    console.log('   Gmail 검색 입력됨');
    await page.waitForTimeout(2000);
  }
  
  await page.screenshot({ path: 'C:\\temp\\pa-auto-setup2.png' });
  
  console.log('[4] Gmail 트리거 옵션 확인...');
  
  const options = await page.locator('[role="option"], [role="listitem"]').all();
  console.log('   옵션 수:', options.length);
  
  for (let i = 0; i < Math.min(options.length, 10); i++) {
    const text = await options[i].textContent().catch(function() { return ''; });
    if (text) console.log('   [' + i + '] ' + text.substring(0, 60));
  }
  
  const gmailOption = await page.locator('[role="option"], [role="listitem"]').filter({ 
    hasText: /When a new email arrives|Gmail/ 
  }).first();
  
  const isVisible = await gmailOption.isVisible().catch(function() { return false; });
  if (isVisible) {
    await gmailOption.click();
    console.log('   Gmail 트리거 선택됨');
    await page.waitForTimeout(1000);
  }
  
  await page.screenshot({ path: 'C:\\temp\\pa-auto-setup3.png' });
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
