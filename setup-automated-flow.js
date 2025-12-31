const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:\\\\temp\\\\pa-auto-dialog.png' });
  
  console.log('[1] 흐름 이름 입력...');
  
  // Flow name 입력 필드 찾기
  const nameInput = await page.locator('input[type="text"]').first();
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill('');
    await nameInput.fill('PREMO-Gmail-Auth');
    console.log('   ✓ 이름 입력됨');
  }
  
  await page.waitForTimeout(500);
  
  console.log('[2] Gmail 트리거 검색...');
  
  // 트리거 검색 필드 찾기 (두 번째 input 또는 placeholder에 search가 있는 것)
  const inputs = await page.locator('input').all();
  console.log('   input 필드 수:', inputs.length);
  
  for (let i = 0; i < inputs.length; i++) {
    const placeholder = await inputs[i].getAttribute('placeholder').catch(() => '');
    const ariaLabel = await inputs[i].getAttribute('aria-label').catch(() => '');
    console.log(`   [${i}] placeholder: "${placeholder}", aria-label: "${ariaLabel}"`);
    
    if (placeholder.toLowerCase().includes('search') || 
        placeholder.includes('검색') ||
        ariaLabel.toLowerCase().includes('search') ||
        ariaLabel.includes('trigger')) {
      await inputs[i].fill('Gmail');
      console.log('   ✓ Gmail 검색 입력됨');
      await page.waitForTimeout(2000);
      break;
    }
  }
  
  await page.screenshot({ path: 'C:\\\\temp\\\\pa-gmail-trigger.png' });
  
  console.log('[3] Gmail 트리거 선택...');
  
  // Gmail 관련 옵션 찾기
  const gmailOptions = await page.locator('[role="option"], [role="listitem"], button, div').filter({ 
    hasText: /Gmail|When a new email|새 전자 메일/ 
  }).all();
  
  console.log('   Gmail 옵션 수:', gmailOptions.length);
  
  if (gmailOptions.length > 0) {
    // 첫 번째 Gmail 옵션 클릭
    await gmailOptions[0].click();
    console.log('   ✓ Gmail 옵션 클릭됨');
    await page.waitForTimeout(1500);
  }
  
  await page.screenshot({ path: 'C:\\\\temp\\\\pa-gmail-selected.png' });
  
  console.log('[4] 만들기 버튼 클릭...');
  
  const createBtn = await page.locator('button').filter({ hasText: /Create|만들기/ }).first();
  if (await createBtn.isVisible().catch(() => false)) {
    const isDisabled = await createBtn.isDisabled().catch(() => true);
    console.log('   버튼 비활성화:', isDisabled);
    
    if (!isDisabled) {
      await createBtn.click();
      console.log('   ✓ 만들기 클릭됨');
      await page.waitForTimeout(3000);
    }
  }
  
  await page.screenshot({ path: 'C:\\\\temp\\\\pa-flow-created.png' });
  console.log('   완료');
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
