const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 다이얼로그 내 모든 input 필드 확인
  console.log('[1] 플로우 이름 입력...');
  const inputs = await page.locator('input').all();
  console.log('   입력 필드 수:', inputs.length);
  
  for (const input of inputs) {
    const placeholder = await input.getAttribute('placeholder');
    const value = await input.inputValue();
    console.log('   -', placeholder || '(no placeholder)', ':', value || '(empty)');
    
    if (placeholder && (placeholder.includes('name') || placeholder.includes('Name') || placeholder.includes('flow'))) {
      await input.fill('PREMO-Gmail-Auth');
      console.log('   ✓ 플로우 이름 입력됨');
    }
  }
  
  // Gmail 트리거 선택 확인
  console.log('[2] Gmail 트리거 확인...');
  const gmailOption = await page.locator('text=When a new email arrives').first();
  if (await gmailOption.isVisible()) {
    await gmailOption.click();
    console.log('   ✓ Gmail 트리거 클릭됨');
  }
  
  await page.waitForTimeout(1000);
  
  // Create 버튼 상태 확인 및 클릭
  console.log('[3] Create 버튼 클릭...');
  const createBtn = await page.locator('button').filter({ hasText: 'Create' }).last();
  const isDisabled = await createBtn.isDisabled();
  console.log('   Create 버튼 비활성화:', isDisabled);
  
  if (!isDisabled) {
    await createBtn.click({ force: true });
    console.log('   ✓ Create 클릭됨');
    await page.waitForTimeout(10000);
  } else {
    console.log('   버튼이 비활성화 상태입니다');
  }
  
  console.log('현재 URL:', page.url());
  await page.screenshot({ path: '.playwright-mcp/complete-setup.png', fullPage: true });
  console.log('📸 스크린샷 저장');
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
