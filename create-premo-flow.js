const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const pages = context.pages();
  let page = pages.find(p => p.url().includes('powerautomate')) || pages[0];
  
  console.log('[1] Create 페이지 이동...');
  await page.goto('https://make.powerautomate.com/environments/Default-ef30448f-b0ea-4625-99b6-991583884a18/create');
  await page.waitForTimeout(3000);
  
  console.log('[2] Automated cloud flow 클릭...');
  await page.locator('text=Automated cloud flow').first().click();
  await page.waitForTimeout(2000);
  
  console.log('[3] 플로우 이름 입력...');
  await page.locator('input[placeholder*="Flow name"], input[placeholder*="name"]').first().fill('PREMO-Gmail-Auth');
  
  console.log('[4] Gmail 트리거 검색...');
  await page.locator('input[placeholder*="Search"], input[placeholder*="trigger"]').first().fill('Gmail');
  await page.waitForTimeout(2000);
  
  // Gmail 트리거 선택
  const gmailTrigger = await page.locator('text=When a new email arrives').first();
  if (await gmailTrigger.isVisible()) {
    await gmailTrigger.click();
    console.log('   ✓ Gmail 트리거 선택됨');
  }
  
  console.log('[5] Create 클릭...');
  await page.waitForTimeout(1000);
  const createBtn = await page.locator('button:has-text("Create")').first();
  if (await createBtn.isVisible()) {
    await createBtn.click();
    await page.waitForTimeout(5000);
    console.log('   ✓ Create 클릭됨');
  }
  
  // 스크린샷
  await page.screenshot({ path: '.playwright-mcp/premo-flow-create.png' });
  console.log('📸 스크린샷 저장');
  
  console.log('\n✅ 플로우 생성 진행 중');
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
