const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const signupPage = context.pages().find(p => p.url().includes('signup'));
  
  if (!signupPage) {
    console.log('페이지 없음');
    await browser.close();
    return;
  }
  
  console.log('[1] fui-Checkbox 클릭...');
  
  // fui-Checkbox 클래스 요소 클릭
  const checkboxes = await signupPage.locator('.fui-Checkbox').all();
  console.log('   체크박스 수:', checkboxes.length);
  
  for (let i = 0; i < checkboxes.length; i++) {
    await checkboxes[i].click();
    console.log('   ✓ 체크박스', i + 1, '클릭됨');
    await signupPage.waitForTimeout(300);
  }
  
  await signupPage.screenshot({ path: '.playwright-mcp/checkbox-clicked.png' });
  
  // 동의 버튼 확인 및 클릭
  console.log('[2] 동의 버튼...');
  await signupPage.waitForTimeout(500);
  
  const agreeBtn = await signupPage.locator('button').filter({ hasText: '동의' }).first();
  const isDisabled = await agreeBtn.isDisabled().catch(() => true);
  console.log('   버튼 비활성화:', isDisabled);
  
  if (!isDisabled) {
    await agreeBtn.click();
    console.log('   ✓ 동의 클릭됨');
    await signupPage.waitForTimeout(3000);
    await signupPage.screenshot({ path: '.playwright-mcp/signup-next-step.png' });
  }
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
