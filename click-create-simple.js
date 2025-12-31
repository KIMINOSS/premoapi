const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 모든 버튼 출력
  console.log('[1] 버튼 목록:');
  const buttons = await page.locator('button').all();
  for (let i = 0; i < Math.min(buttons.length, 20); i++) {
    const text = await buttons[i].textContent();
    const visible = await buttons[i].isVisible();
    if (visible && text.trim()) {
      console.log('   [' + i + ']', text.trim().substring(0, 30));
    }
  }
  
  // Create 버튼 직접 클릭 (index 기반)
  console.log('[2] Create 버튼 클릭 시도...');
  const result = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const btn of btns) {
      const text = btn.textContent || '';
      if (text.includes('Create') && !text.includes('Creating')) {
        btn.click();
        return 'clicked: ' + text.trim();
      }
    }
    return 'not found';
  });
  console.log('   결과:', result);
  
  await page.waitForTimeout(8000);
  console.log('URL:', page.url());
  
  await page.screenshot({ path: '.playwright-mcp/create-result.png' });
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
