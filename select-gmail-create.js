const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 1. Gmail 트리거 (V2) 선택
  console.log('[1] Gmail 트리거 선택...');
  const gmailV2 = await page.locator('text=When a new email arrives').first();
  if (await gmailV2.isVisible()) {
    await gmailV2.click();
    console.log('   ✓ Gmail 트리거 선택됨');
    await page.waitForTimeout(1000);
  }
  
  await page.screenshot({ path: '.playwright-mcp/gmail-selected.png' });
  
  // 2. Create 버튼 클릭
  console.log('[2] Create 버튼 클릭...');
  
  // 페이지 내 모든 요소에서 Create 찾기
  const clicked = await page.evaluate(() => {
    // 모든 클릭 가능한 요소 검색
    const elements = document.querySelectorAll('button, span, div[role="button"]');
    for (const el of elements) {
      const text = el.textContent || '';
      const trimmed = text.trim();
      if (trimmed === 'Create') {
        console.log('Found:', el.tagName, el.className);
        el.click();
        return 'clicked';
      }
    }
    return 'not found';
  });
  
  console.log('   결과:', clicked);
  await page.waitForTimeout(10000);
  
  const newUrl = page.url();
  console.log('새 URL:', newUrl);
  
  if (newUrl.includes('/flows/') && !newUrl.includes('/create')) {
    console.log('✅ 플로우 생성됨!');
  }
  
  await page.screenshot({ path: '.playwright-mcp/after-create-final.png' });
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
