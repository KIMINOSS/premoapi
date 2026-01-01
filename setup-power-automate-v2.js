const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('1. Power Automate 접속...');
  await page.goto('https://make.powerautomate.com');
  
  // Microsoft 로그인
  console.log('2. Microsoft 로그인...');
  await page.waitForSelector('input[type="email"]', { timeout: 30000 });
  await page.fill('input[type="email"]', 'minho.kim@grupopremo.com');
  await page.click('input[type="submit"]');
  
  await page.waitForSelector('input[type="password"]', { timeout: 30000 });
  await page.fill('input[type="password"]', process.env.PA_PASSWORD);
  await page.click('input[type="submit"]');
  
  // "로그인 상태 유지" 팝업 처리
  try {
    await page.waitForSelector('input[type="submit"]', { timeout: 5000 });
    await page.click('input[type="submit"]');
  } catch (e) {
    console.log('추가 팝업 없음');
  }
  
  console.log('3. Power Automate 대시보드 로딩 대기 (15초)...');
  await page.waitForTimeout(15000);
  
  // 스크린샷 저장
  await page.screenshot({ path: '/home/kogh/.playwright-mcp/power-automate-dashboard.png' });
  console.log('스크린샷 저장: power-automate-dashboard.png');
  
  // 직접 플로우 생성 URL로 이동
  console.log('4. 플로우 생성 페이지로 이동...');
  await page.goto('https://make.powerautomate.com/create');
  await page.waitForTimeout(10000);
  
  await page.screenshot({ path: '/home/kogh/.playwright-mcp/power-automate-create.png' });
  console.log('스크린샷 저장: power-automate-create.png');
  
  // "Automated cloud flow" 찾기
  console.log('5. Automated cloud flow 선택...');
  const automatedFlow = await page.locator('text=/Automated|자동화/i').first();
  if (await automatedFlow.isVisible()) {
    await automatedFlow.click();
    await page.waitForTimeout(3000);
  }
  
  await page.screenshot({ path: '/home/kogh/.playwright-mcp/power-automate-step5.png' });
  
  console.log('6. Gmail 커넥터 검색...');
  // 검색창 찾기
  const searchInput = await page.locator('input[type="text"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('Gmail');
    await page.waitForTimeout(2000);
  }
  
  await page.screenshot({ path: '/home/kogh/.playwright-mcp/power-automate-gmail.png' });
  
  console.log('완료. 브라우저를 30초간 열어둡니다...');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();
