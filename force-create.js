const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 1. 다이얼로그가 있는지 확인
  console.log('[1] 다이얼로그 확인...');
  
  // 먼저 Gmail 옵션 확실히 선택
  console.log('[2] Gmail 옵션 선택...');
  const gmailRadio = await page.locator('[role="radio"][aria-checked="false"]').first();
  if (await gmailRadio.isVisible()) {
    await gmailRadio.click();
    console.log('   ✓ Gmail 라디오 클릭됨');
  }
  
  await page.waitForTimeout(500);
  
  // 2. Create 버튼에 포커스 후 클릭
  console.log('[3] Create 버튼 포커스 및 클릭...');
  const createBtn = await page.getByRole('button', { name: 'Create', exact: true });
  
  if (await createBtn.isVisible()) {
    await createBtn.focus();
    await page.waitForTimeout(200);
    await createBtn.click();
    console.log('   ✓ Create 클릭됨');
  }
  
  // 3. 또는 Enter 키 전송
  await page.keyboard.press('Enter');
  console.log('   Enter 키 전송됨');
  
  await page.waitForTimeout(10000);
  console.log('URL:', page.url());
  
  await page.screenshot({ path: '.playwright-mcp/force-create-result.png' });
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
