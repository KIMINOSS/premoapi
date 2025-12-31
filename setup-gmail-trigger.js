const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:\\\\temp\\\\pa-flow-setup.png' });
  
  console.log('[1] 흐름 이름 입력...');
  
  // 이름 입력 필드 찾기
  const nameInput = await page.locator('input[type="text"], input[placeholder*="이름"], input[placeholder*="name"], input[aria-label*="이름"], input[aria-label*="name"]').first();
  
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill('');
    await nameInput.fill('PREMO-Gmail-Auth');
    console.log('   ✓ 이름 입력됨: PREMO-Gmail-Auth');
  } else {
    console.log('   이름 입력 필드 없음');
  }
  
  await page.waitForTimeout(500);
  
  console.log('[2] Gmail 트리거 검색...');
  
  // 트리거 검색 필드 찾기
  const searchInputs = await page.locator('input').all();
  for (const input of searchInputs) {
    const placeholder = await input.getAttribute('placeholder').catch(() => '');
    const ariaLabel = await input.getAttribute('aria-label').catch(() => '');
    if (placeholder.includes('검색') || placeholder.includes('Search') || 
        ariaLabel.includes('검색') || ariaLabel.includes('Search') ||
        placeholder.includes('트리거') || placeholder.includes('trigger')) {
      await input.fill('Gmail');
      console.log('   ✓ Gmail 검색됨');
      break;
    }
  }
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:\\\\temp\\\\pa-gmail-search.png' });
  
  console.log('[3] Gmail 트리거 선택...');
  
  // Gmail 관련 옵션 클릭
  const gmailOption = await page.locator('button, [role="option"], [role="listitem"], div').filter({ 
    hasText: /Gmail|새 전자 메일|new email|When a new email/ 
  }).first();
  
  if (await gmailOption.isVisible().catch(() => false)) {
    await gmailOption.click();
    console.log('   ✓ Gmail 트리거 선택됨');
    await page.waitForTimeout(2000);
  }
  
  await page.screenshot({ path: 'C:\\\\temp\\\\pa-trigger-selected.png' });
  console.log('   스크린샷 저장됨');
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
