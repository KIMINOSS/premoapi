const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    executablePath: '/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('1. Power Automate 접속...');
  await page.goto('https://make.powerautomate.com');
  
  console.log('2. Microsoft 로그인...');
  await page.waitForSelector('input[type="email"]', { timeout: 60000 });
  await page.fill('input[type="email"]', 'minho.kim@grupopremo.com');
  await page.click('input[type="submit"]');
  
  await page.waitForSelector('input[type="password"]', { timeout: 60000 });
  await page.fill('input[type="password"]', 'Alshtm***REMOVED***!@');
  await page.click('input[type="submit"]');
  
  await page.waitForTimeout(3000);
  try { await page.click('#idSIButton9'); } catch (e) {}
  
  console.log('3. 대시보드 로딩...');
  await page.waitForTimeout(15000);
  
  console.log('4. 플로우 생성...');
  await page.goto('https://make.powerautomate.com/create');
  await page.waitForTimeout(10000);
  
  console.log('5. Automated cloud flow...');
  await page.click('text=Automated cloud flow').catch(() => page.click('text=자동화된 클라우드 흐름'));
  await page.waitForTimeout(5000);
  
  console.log('6. 이름 설정...');
  await page.locator('input').first().fill('Resend-Email-Forward').catch(() => {});
  
  console.log('7. Gmail 검색...');
  await page.locator('input[placeholder*="earch"]').fill('Gmail').catch(() => {});
  await page.waitForTimeout(3000);
  await page.click('text=When a new email').catch(() => {});
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Create")').catch(() => page.click('button:has-text("만들기")'));
  await page.waitForTimeout(8000);
  
  console.log('8. Gmail 연결...');
  const [popup] = await Promise.all([
    context.waitForEvent('page', { timeout: 30000 }).catch(() => null),
    page.click('text=Sign in').catch(() => {})
  ]);
  
  if (popup) {
    await popup.waitForLoadState();
    await popup.fill('input[type="email"]', 'koghminho@gmail.com');
    await popup.click('#identifierNext');
    await popup.waitForTimeout(3000);
    await popup.fill('input[type="password"]', 'wns***REMOVED***8392!@');
    await popup.click('#passwordNext');
    await popup.waitForTimeout(5000);
    await popup.click('button:has-text("Allow")').catch(() => {});
  }
  
  console.log('9. Outlook 추가...');
  await page.click('text=New step').catch(() => {});
  await page.waitForTimeout(2000);
  await page.locator('input[placeholder*="earch"]').fill('Outlook Send').catch(() => {});
  await page.waitForTimeout(2000);
  await page.click('text=Send an email').catch(() => {});
  
  console.log('10. 저장...');
  await page.click('button:has-text("Save")').catch(() => {});
  await page.waitForTimeout(5000);
  
  console.log('=== 완료 ===');
  await page.waitForTimeout(120000);
  await browser.close();
})();
