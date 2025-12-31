const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const signupPage = context.pages().find(p => p.url().includes('signup'));
  
  console.log('[1] 체크박스 강제 클릭...');
  
  // input 요소 찾기 및 클릭
  const inputs = await signupPage.locator('input').all();
  console.log('   input 수:', inputs.length);
  
  for (const inp of inputs) {
    const type = await inp.getAttribute('type');
    if (type === 'checkbox') {
      await inp.check({ force: true });
      console.log('   ✓ checkbox input 체크됨');
    }
  }
  
  // 또는 label/span 내부의 indicator 클릭
  const indicators = await signupPage.locator('[class*="Indicator"], [class*="indicator"], [class*="check"]').all();
  console.log('   indicator 수:', indicators.length);
  
  for (const ind of indicators) {
    if (await ind.isVisible()) {
      await ind.click({ force: true });
      console.log('   ✓ indicator 클릭됨');
    }
  }
  
  await signupPage.waitForTimeout(500);
  await signupPage.screenshot({ path: '.playwright-mcp/force-check.png' });
  
  // 동의 버튼
  const agreeBtn = await signupPage.locator('button').filter({ hasText: '동의' }).first();
  const isDisabled = await agreeBtn.isDisabled().catch(() => true);
  console.log('[2] 버튼 비활성화:', isDisabled);
  
  if (!isDisabled) {
    await agreeBtn.click();
    console.log('   ✓ 동의 클릭됨');
    await signupPage.waitForTimeout(3000);
  }
  
  await signupPage.screenshot({ path: '.playwright-mcp/final-check.png' });
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
