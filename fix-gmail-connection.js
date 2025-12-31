const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  console.log('✅ 연결 성공');
  
  const context = browser.contexts()[0];
  const pages = context.pages();
  let page = pages.find(p => p.url().includes('powerautomate')) || pages[0];
  
  console.log('URL:', page.url());
  
  // My flows 페이지로 이동
  if (!page.url().includes('flows')) {
    await page.goto('https://make.powerautomate.com/environments/Default-ef30448f-b0ea-4625-99b6-991583884a18/flows');
    await page.waitForTimeout(3000);
  }
  
  // PREMO 플로우 찾기 및 클릭
  console.log('[1] PREMO 플로우 찾기...');
  const flowLink = await page.locator('a:has-text("PREMO")').first();
  if (await flowLink.isVisible()) {
    await flowLink.click();
    await page.waitForTimeout(2000);
    console.log('   ✓ 플로우 클릭됨');
  }
  
  // Edit 버튼 클릭
  console.log('[2] Edit 클릭...');
  const editBtn = await page.locator('button:has-text("Edit")').first();
  if (await editBtn.isVisible()) {
    await editBtn.click();
    await page.waitForTimeout(3000);
    console.log('   ✓ Edit 클릭됨');
  }
  
  // Gmail 트리거 클릭
  console.log('[3] Gmail 트리거 클릭...');
  const gmailCard = await page.locator('[data-automation-id="card"]').first();
  if (await gmailCard.isVisible()) {
    await gmailCard.click();
    await page.waitForTimeout(2000);
  }
  
  // Sign in 또는 Change connection 클릭
  console.log('[4] 연결 설정...');
  const signInBtn = await page.locator('button:has-text("Sign in"), a:has-text("Change connection"), a:has-text("Add new connection")').first();
  if (await signInBtn.isVisible()) {
    await signInBtn.click();
    console.log('   ✓ 연결 버튼 클릭됨');
    await page.waitForTimeout(5000);
  }
  
  // 스크린샷
  await page.screenshot({ path: '.playwright-mcp/gmail-fix.png' });
  console.log('📸 스크린샷 저장');
  
  console.log('\n✅ Gmail 연결 설정 진행 중');
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
