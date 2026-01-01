const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 200
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('1. Power Automate 접속...');
  await page.goto('https://make.powerautomate.com');
  
  console.log('2. Microsoft 로그인...');
  await page.waitForSelector('input[type="email"]', { timeout: 30000 });
  await page.fill('input[type="email"]', 'minho.kim@grupopremo.com');
  await page.click('input[type="submit"]');
  
  await page.waitForSelector('input[type="password"]', { timeout: 30000 });
  await page.fill('input[type="password"]', process.env.PA_PASSWORD);
  await page.click('input[type="submit"]');
  
  try {
    await page.waitForSelector('input[type="submit"]', { timeout: 5000 });
    await page.click('input[type="submit"]');
  } catch (e) {}
  
  console.log('3. 대시보드 로딩...');
  await page.waitForTimeout(10000);
  
  console.log('4. 플로우 생성 페이지...');
  await page.goto('https://make.powerautomate.com/create');
  await page.waitForTimeout(8000);
  
  console.log('===========================================');
  console.log('브라우저가 열려있습니다.');
  console.log('');
  console.log('다음을 수동으로 완료해주세요:');
  console.log('1. "Automated cloud flow" 클릭');
  console.log('2. 플로우 이름: Resend-Email-Forward');
  console.log('3. Gmail 검색 → "When a new email arrives" 선택');
  console.log('4. Gmail 계정 연결 (koghminho@gmail.com)');
  console.log('5. + New step → Outlook "Send an email" 추가');
  console.log('6. Save 클릭');
  console.log('');
  console.log('완료 후 터미널에서 Ctrl+C를 누르세요.');
  console.log('===========================================');
  
  // 5분간 브라우저 열어둠
  await page.waitForTimeout(300000);
  
  await browser.close();
})();
