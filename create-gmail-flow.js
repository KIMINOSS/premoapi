const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] 만들기 메뉴 클릭...');
  
  // 만들기 버튼 찾기 (+ 만들기 또는 Create)
  const createBtn = await page.locator('button, [role="button"], a').filter({ hasText: /만들기|Create|\+/ }).first();
  
  if (await createBtn.isVisible()) {
    await createBtn.click();
    console.log('   ✓ 만들기 클릭됨');
    await page.waitForTimeout(2000);
  } else {
    // 왼쪽 사이드바에서 찾기
    const sidebarCreate = await page.locator('nav a, nav button').filter({ hasText: /만들기|Create/ }).first();
    if (await sidebarCreate.isVisible()) {
      await sidebarCreate.click();
      console.log('   ✓ 사이드바 만들기 클릭됨');
      await page.waitForTimeout(2000);
    }
  }
  
  await page.screenshot({ path: 'C:\\\\temp\\\\pa-create-menu.png' });
  console.log('   스크린샷 저장됨');
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
