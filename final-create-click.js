const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] Create 버튼 찾기...');
  
  // 모든 버튼의 텍스트와 위치 출력
  const buttons = await page.locator('button').all();
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const visible = await buttons[i].isVisible();
    if (visible && text) {
      const trimmed = text.trim();
      if (trimmed === 'Create' || trimmed === 'Skip' || trimmed === 'Cancel') {
        console.log('   버튼:', trimmed);
        const box = await buttons[i].boundingBox();
        if (box) {
          console.log('   위치:', Math.round(box.x), Math.round(box.y));
        }
        if (trimmed === 'Create') {
          console.log('[2] Create 버튼 클릭!');
          await buttons[i].click({ force: true });
          break;
        }
      }
    }
  }
  
  await page.waitForTimeout(12000);
  const url = page.url();
  console.log('URL:', url);
  
  if (url.includes('/flows/') && !url.includes('/create')) {
    console.log('✅ 플로우 생성 성공!');
  }
  
  await page.screenshot({ path: '.playwright-mcp/flow-created.png' });
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
