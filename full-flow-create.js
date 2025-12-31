const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 1. Create 페이지에서 Automated cloud flow 카드 클릭
  console.log('[1] Automated cloud flow 선택...');
  await page.goto('https://make.powerautomate.com/environments/Default-ef30448f-b0ea-4625-99b6-991583884a18/create');
  await page.waitForTimeout(3000);
  
  const automatedCard = await page.locator('text=Automated cloud flow').first();
  await automatedCard.click();
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: '.playwright-mcp/step1-dialog.png' });
  
  // 2. 플로우 이름 입력
  console.log('[2] 플로우 이름 입력...');
  const nameInput = await page.locator('input[placeholder*="name"], input[placeholder*="Name"]').first();
  await nameInput.clear();
  await nameInput.fill('PREMO-Gmail-Auth');
  
  // 3. Gmail 트리거 검색 및 선택
  console.log('[3] Gmail 트리거 검색...');
  const searchInput = await page.locator('input[placeholder*="trigger"], input[placeholder*="Search"]').last();
  await searchInput.fill('Gmail when new email');
  await page.waitForTimeout(2000);
  
  // Gmail 옵션 클릭
  const gmailOption = await page.locator('[role="option"]:has-text("Gmail"), [class*="option"]:has-text("Gmail")').first();
  if (await gmailOption.isVisible()) {
    await gmailOption.click();
    console.log('   ✓ Gmail 선택됨');
  } else {
    // 대안: 텍스트로 찾기
    await page.locator('text=When a new email arrives').first().click();
  }
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '.playwright-mcp/step2-selected.png' });
  
  // 4. Create 버튼 클릭 (다이얼로그 내)
  console.log('[4] Create 버튼 클릭...');
  
  // 다이얼로그 footer의 Create 버튼
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button, span');
    for (const el of buttons) {
      if (el.textContent === 'Create' || el.textContent === ' Create') {
        el.click();
        return;
      }
    }
  });
  
  await page.waitForTimeout(10000);
  console.log('URL:', page.url());
  
  await page.screenshot({ path: '.playwright-mcp/step3-created.png' });
  console.log('📸 스크린샷 저장 완료');
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
