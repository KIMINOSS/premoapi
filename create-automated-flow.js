const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:\\\\temp\\\\pa-home.png' });
  
  console.log('[1] 만들기 메뉴로 이동...');
  
  // + 만들기 또는 Create 클릭
  const createMenu = await page.locator('a, button, [role="link"]').filter({ 
    hasText: /\+ 만들기|\+ Create|만들기|Create/ 
  }).first();
  
  if (await createMenu.isVisible().catch(() => false)) {
    await createMenu.click();
    console.log('   ✓ 만들기 클릭됨');
    await page.waitForTimeout(2000);
  }
  
  await page.screenshot({ path: 'C:\\\\temp\\\\pa-create-menu2.png' });
  
  console.log('[2] 자동화된 클라우드 흐름 선택...');
  
  // Automated cloud flow 찾기
  const automatedFlow = await page.locator('a, button, [role="link"], [role="menuitem"], div').filter({ 
    hasText: /Automated cloud flow|자동화된 클라우드|Automated/ 
  }).first();
  
  if (await automatedFlow.isVisible().catch(() => false)) {
    await automatedFlow.click();
    console.log('   ✓ Automated cloud flow 선택됨');
    await page.waitForTimeout(2000);
  } else {
    console.log('   페이지 요소 확인...');
    const allText = await page.evaluate(() => {
      const divs = document.querySelectorAll('h2, h3, a, button');
      return Array.from(divs).map(d => d.textContent?.substring(0, 50)).filter(t => t).slice(0, 20);
    });
    console.log('   텍스트:', JSON.stringify(allText));
  }
  
  await page.screenshot({ path: 'C:\\\\temp\\\\pa-automated-select.png' });
  console.log('   완료');
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
