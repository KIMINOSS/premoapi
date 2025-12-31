const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] 현재 대화상자 닫기...');
  
  // Cancel 또는 X 버튼 클릭
  const cancelBtn = await page.locator('button').filter({ hasText: /Cancel|취소/ }).first();
  if (await cancelBtn.isVisible().catch(() => false)) {
    await cancelBtn.click();
    console.log('   ✓ Cancel 클릭됨');
    await page.waitForTimeout(1500);
  }
  
  console.log('[2] Create 페이지로 이동...');
  
  // 사이드바에서 Create 클릭
  const createLink = await page.locator('nav a, [role="navigation"] a').filter({ 
    hasText: /^Create$|^만들기$|^\+ Create$/ 
  }).first();
  
  if (await createLink.isVisible().catch(() => false)) {
    await createLink.click();
    console.log('   ✓ Create 링크 클릭됨');
    await page.waitForTimeout(2000);
  } else {
    // URL로 직접 이동
    await page.goto('https://make.powerautomate.com/create');
    console.log('   ✓ Create 페이지로 직접 이동');
    await page.waitForTimeout(2000);
  }
  
  await page.screenshot({ path: 'C:\\\\temp\\\\pa-create-page.png' });
  
  console.log('[3] 페이지 요소 확인...');
  
  const elements = await page.evaluate(() => {
    const results = [];
    const items = document.querySelectorAll('h2, h3, [role="heading"], a, button');
    items.forEach(item => {
      const text = (item.textContent || '').trim();
      if (text.length > 3 && text.length < 60) {
        results.push({
          tag: item.tagName,
          text: text
        });
      }
    });
    return results.slice(0, 25);
  });
  
  console.log('   발견된 요소들:');
  elements.forEach((e, i) => console.log(`   [${i}] ${e.tag}: ${e.text}`));
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
