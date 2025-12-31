const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] Automated cloud flow 클릭...');
  
  // Automated cloud flow 버튼 클릭
  const automatedBtn = await page.locator('button').filter({ 
    hasText: /Automated cloud flow/ 
  }).first();
  
  if (await automatedBtn.isVisible().catch(() => false)) {
    await automatedBtn.click();
    console.log('   ✓ Automated cloud flow 클릭됨');
    await page.waitForTimeout(2500);
  }
  
  await page.screenshot({ path: 'C:\\\\temp\\\\pa-automated-dialog.png' });
  
  console.log('[2] 대화상자 확인...');
  
  // 대화상자 타이틀 확인
  const dialogTitle = await page.evaluate(() => {
    const headers = document.querySelectorAll('h1, h2, [role="heading"]');
    for (const h of headers) {
      const text = h.textContent?.trim();
      if (text && text.includes('automated') || text?.includes('cloud')) {
        return text;
      }
    }
    return null;
  });
  
  console.log('   대화상자 타이틀:', dialogTitle);
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
