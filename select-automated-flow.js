const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] 현재 페이지 상태 확인...');
  await page.screenshot({ path: 'C:\\\\temp\\\\pa-state1.png' });
  
  // 자동화된 클라우드 흐름 선택
  console.log('[2] 자동화된 클라우드 흐름 선택...');
  
  // 다양한 선택자로 시도
  const automatedFlow = await page.locator('button, [role="button"], [role="menuitem"], a, div').filter({ 
    hasText: /자동화된 클라우드|Automated cloud|자동 클라우드/ 
  }).first();
  
  if (await automatedFlow.isVisible().catch(() => false)) {
    await automatedFlow.click();
    console.log('   ✓ 자동화된 클라우드 흐름 선택됨');
    await page.waitForTimeout(2000);
  } else {
    console.log('   자동화된 클라우드 흐름 버튼 없음, 다른 방법 시도...');
    
    // 페이지 전체에서 텍스트 검색
    const elements = await page.evaluate(() => {
      const results = [];
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const text = (el.textContent || '').trim();
        if (text.length < 100 && (text.includes('자동') || text.includes('Automated') || text.includes('cloud') || text.includes('클라우드'))) {
          results.push({
            tag: el.tagName,
            text: text.substring(0, 50),
            class: el.className?.substring(0, 30)
          });
        }
      }
      return results.slice(0, 10);
    });
    console.log('   발견된 요소:', JSON.stringify(elements, null, 2));
  }
  
  await page.screenshot({ path: 'C:\\\\temp\\\\pa-state2.png' });
  console.log('   스크린샷 저장됨');
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
