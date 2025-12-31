const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 1. 라디오 버튼/체크박스 클릭
  console.log('[1] Gmail 트리거 라디오 버튼 클릭...');
  
  // 라디오 버튼 또는 체크박스 찾기
  const radios = await page.locator('input[type="radio"], input[type="checkbox"], [role="radio"], [role="checkbox"]').all();
  console.log('   라디오/체크박스 수:', radios.length);
  
  // 첫 번째 Gmail 관련 라디오 버튼 클릭
  for (const radio of radios) {
    const isVisible = await radio.isVisible();
    if (isVisible) {
      await radio.click();
      console.log('   ✓ 첫 번째 라디오 클릭됨');
      break;
    }
  }
  
  await page.waitForTimeout(500);
  
  // 또는 목록 아이템 직접 클릭
  console.log('[2] 목록 아이템 클릭...');
  const listItem = await page.locator('[role="option"], [role="listitem"], li').filter({ hasText: 'Gmail' }).first();
  if (await listItem.isVisible()) {
    await listItem.click();
    console.log('   ✓ Gmail 목록 아이템 클릭됨');
  }
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '.playwright-mcp/trigger-selected.png' });
  
  // 3. Create 버튼 클릭 (좌표 기반)
  console.log('[3] Create 버튼 클릭...');
  
  // 다이얼로그 하단 Create 버튼 위치 (대략적인 좌표)
  const dialogBox = await page.locator('[role="dialog"], .ms-Dialog, [class*="dialog"]').first();
  if (await dialogBox.isVisible()) {
    const box = await dialogBox.boundingBox();
    if (box) {
      // 다이얼로그 우측 하단 Create 버튼 위치
      const createX = box.x + box.width - 80;
      const createY = box.y + box.height - 30;
      await page.mouse.click(createX, createY);
      console.log('   ✓ Create 위치 클릭:', createX, createY);
    }
  }
  
  await page.waitForTimeout(10000);
  console.log('URL:', page.url());
  
  await page.screenshot({ path: '.playwright-mcp/final-result.png' });
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
