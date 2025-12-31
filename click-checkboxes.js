const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const allPages = context.pages();
  
  // 회원가입 페이지 찾기
  const signupPage = allPages.find(p => p.url().includes('signup'));
  if (!signupPage) {
    console.log('회원가입 페이지 없음');
    await browser.close();
    return;
  }
  
  console.log('[1] 체크박스 클릭...');
  
  // JavaScript로 직접 체크박스 클릭
  await signupPage.evaluate(() => {
    // 모든 체크박스/라디오 버튼 요소 찾기
    const circles = document.querySelectorAll('[role="checkbox"], [role="radio"], input[type="checkbox"], input[type="radio"], .checkbox, [aria-checked]');
    circles.forEach((el, i) => {
      el.click();
      console.log('Clicked:', i);
    });
  });
  
  await signupPage.waitForTimeout(500);
  
  // 또는 li 요소 클릭
  const items = await signupPage.locator('li, [role="listitem"]').all();
  console.log('   목록 아이템 수:', items.length);
  for (const item of items) {
    const text = await item.textContent();
    if (text && (text.includes('개인 정보') || text.includes('Microsoft에서'))) {
      await item.click();
      console.log('   ✓ 항목 클릭:', text.substring(0, 20));
      await signupPage.waitForTimeout(300);
    }
  }
  
  await signupPage.screenshot({ path: '.playwright-mcp/after-clicks.png' });
  
  // 동의 버튼 상태 확인
  console.log('[2] 동의 버튼 확인...');
  const agreeBtn = await signupPage.locator('button').filter({ hasText: '동의' }).first();
  const isDisabled = await agreeBtn.isDisabled().catch(() => true);
  console.log('   버튼 비활성화:', isDisabled);
  
  if (!isDisabled) {
    await agreeBtn.click();
    console.log('   ✓ 동의 클릭됨');
    await signupPage.waitForTimeout(3000);
    await signupPage.screenshot({ path: '.playwright-mcp/after-agree.png' });
  }
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
