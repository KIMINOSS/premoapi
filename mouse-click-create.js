const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 1. 버튼 상태 확인
  console.log('[1] Create 버튼 상태 확인...');
  const btnState = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.trim() === 'Create') {
        return {
          disabled: btn.disabled,
          ariaDisabled: btn.getAttribute('aria-disabled'),
          className: btn.className,
          visible: btn.offsetParent !== null
        };
      }
    }
    return null;
  });
  console.log('   버튼 상태:', JSON.stringify(btnState));
  
  // 2. 마우스 직접 이동 및 클릭
  console.log('[2] 마우스 이동 및 클릭 (1016, 607)...');
  await page.mouse.move(1016, 607);
  await page.waitForTimeout(300);
  await page.mouse.down();
  await page.waitForTimeout(100);
  await page.mouse.up();
  console.log('   ✓ 마우스 클릭 완료');
  
  await page.waitForTimeout(5000);
  
  // 3. URL 변경 확인
  const url = page.url();
  console.log('URL:', url);
  
  // 4. 페이지 변경 대기
  if (url.includes('/create')) {
    console.log('[3] 추가 대기...');
    await page.waitForTimeout(5000);
    console.log('최종 URL:', page.url());
  }
  
  await page.screenshot({ path: '.playwright-mcp/mouse-click-result.png' });
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
