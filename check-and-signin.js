const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 로딩 대기
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: '.playwright-mcp/after-loading.png' });
  
  // 현재 상태 확인
  console.log('[1] 현재 상태 확인...');
  const pageContent = await page.content();
  
  if (pageContent.includes('Sign in')) {
    console.log('   Sign in 버튼 발견');
    const signIn = await page.locator('button:has-text("Sign in")').first();
    if (await signIn.isVisible()) {
      await signIn.click();
      console.log('   ✓ Sign in 클릭됨');
      await page.waitForTimeout(5000);
    }
  }
  
  if (pageContent.includes('Add new connection') || pageContent.includes('Add new')) {
    console.log('   Add new connection 발견');
    const addNew = await page.locator('text=Add new').first();
    if (await addNew.isVisible()) {
      await addNew.click();
      console.log('   ✓ Add new 클릭됨');
      await page.waitForTimeout(5000);
    }
  }
  
  // 연결 드롭다운 확인
  const dropdown = await page.locator('[role="combobox"], select, [class*="dropdown"]').first();
  if (await dropdown.isVisible()) {
    console.log('   드롭다운 발견');
    await dropdown.click();
    await page.waitForTimeout(1000);
  }
  
  // 팝업 확인
  const allPages = context.pages();
  console.log('   페이지 수:', allPages.length);
  for (const p of allPages) {
    console.log('   -', p.url().substring(0, 60));
  }
  
  await page.screenshot({ path: '.playwright-mcp/signin-result.png' });
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
