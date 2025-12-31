const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] 다이얼로그 내 Create 버튼 클릭...');
  
  // 다이얼로그 내 파란색 Create 버튼 (primary button)
  const createBtn = await page.locator('button.ms-Button--primary:has-text("Create"), button[class*="primary"]:has-text("Create")').first();
  
  if (await createBtn.isVisible()) {
    await createBtn.click();
    console.log('   ✓ Create 버튼 클릭됨');
  } else {
    // 대안: 모든 버튼 중 Create 텍스트 찾기
    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text && text.trim() === 'Create') {
        await btn.click();
        console.log('   ✓ Create 버튼 클릭됨 (대안)');
        break;
      }
    }
  }
  
  await page.waitForTimeout(8000);
  console.log('[2] 플로우 에디터 로딩 대기...');
  console.log('현재 URL:', page.url());
  
  await page.screenshot({ path: '.playwright-mcp/flow-editor.png' });
  console.log('📸 스크린샷 저장');
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
