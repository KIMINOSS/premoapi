const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  await page.screenshot({ path: 'C:\\\\temp\\\\pa-current.png' });
  
  console.log('[1] 페이지 요소 분석...');
  
  // 페이지 분석
  const elements = await page.evaluate(() => {
    const results = [];
    const buttons = document.querySelectorAll('button, [role="button"]');
    buttons.forEach(btn => {
      const text = (btn.textContent || '').trim();
      if (text.length < 50) {
        results.push({
          tag: btn.tagName,
          text: text,
          disabled: btn.disabled
        });
      }
    });
    return results.slice(0, 15);
  });
  console.log('   버튼들:', JSON.stringify(elements, null, 2));
  
  console.log('[2] Gmail 트리거 검색 결과 확인...');
  
  // Gmail 관련 항목 클릭
  const gmailItems = await page.locator('[role="option"], [role="listitem"], [role="menuitem"], button').filter({ 
    hasText: /Gmail/ 
  }).all();
  
  console.log('   Gmail 항목 수:', gmailItems.length);
  
  if (gmailItems.length > 0) {
    await gmailItems[0].click();
    console.log('   ✓ Gmail 클릭됨');
    await page.waitForTimeout(2000);
  }
  
  // 만들기 버튼 클릭
  console.log('[3] 만들기 버튼 클릭...');
  
  const createBtn = await page.locator('button').filter({ hasText: /만들기|Create|확인|OK/ }).first();
  if (await createBtn.isVisible().catch(() => false)) {
    const isDisabled = await createBtn.isDisabled().catch(() => true);
    console.log('   버튼 비활성화:', isDisabled);
    
    if (!isDisabled) {
      await createBtn.click();
      console.log('   ✓ 만들기 클릭됨');
      await page.waitForTimeout(3000);
    }
  }
  
  await page.screenshot({ path: 'C:\\\\temp\\\\pa-after-create.png' });
  console.log('   완료');
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
