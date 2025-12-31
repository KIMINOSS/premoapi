const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome',
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
  try {
    await page.click('#idSIButton9');
  } catch (e) {}
  
  console.log('3. 대시보드 로딩...');
  await page.waitForTimeout(15000);
  
  console.log('4. 플로우 생성 페이지...');
  await page.goto('https://make.powerautomate.com/create');
  await page.waitForTimeout(10000);
  
  console.log('5. Automated cloud flow 선택...');
  const tiles = await page.locator('[class*="tile"], [class*="card"]').all();
  for (const tile of tiles) {
    const text = await tile.textContent();
    if (text && (text.includes('Automated') || text.includes('자동화'))) {
      await tile.click();
      break;
    }
  }
  await page.waitForTimeout(5000);
  
  console.log('6. 플로우 이름 설정...');
  const inputs = await page.locator('input[type="text"]').all();
  for (const input of inputs) {
    const placeholder = await input.getAttribute('placeholder');
    if (placeholder && (placeholder.includes('name') || placeholder.includes('이름'))) {
      await input.fill('Resend-Email-Forward');
      break;
    }
  }
  
  console.log('7. Gmail 트리거 검색...');
  await page.waitForTimeout(2000);
  const allInputs = await page.locator('input').all();
  for (const input of allInputs) {
    const ph = await input.getAttribute('placeholder');
    if (ph && (ph.toLowerCase().includes('search') || ph.includes('검색'))) {
      await input.fill('Gmail');
      await page.waitForTimeout(3000);
      break;
    }
  }
  
  // Gmail 트리거 클릭
  const gmailTrigger = page.locator('text=/When a new email|새 이메일/i').first();
  try {
    await gmailTrigger.click({ timeout: 10000 });
  } catch (e) {
    console.log('Gmail 트리거 클릭 실패');
  }
  
  await page.waitForTimeout(3000);
  
  console.log('8. Create 클릭...');
  const createBtn = page.locator('button').filter({ hasText: /^Create$|^만들기$/ }).first();
  try {
    await createBtn.click({ timeout: 5000 });
  } catch (e) {}
  
  await page.waitForTimeout(8000);
  
  console.log('9. Gmail 연결...');
  const signInBtns = await page.locator('button, a').filter({ hasText: /Sign in|로그인|연결/ }).all();
  for (const btn of signInBtns) {
    if (await btn.isVisible()) {
      const [popup] = await Promise.all([
        context.waitForEvent('page', { timeout: 30000 }).catch(() => null),
        btn.click()
      ]);
      
      if (popup) {
        console.log('10. Gmail 로그인 팝업...');
        await popup.waitForLoadState();
        
        try {
          await popup.fill('input[type="email"]', 'koghminho@gmail.com');
          await popup.click('#identifierNext');
          await popup.waitForTimeout(3000);
          
          await popup.fill('input[type="password"]', 'wns***REMOVED***8392!@');
          await popup.click('#passwordNext');
          await popup.waitForTimeout(5000);
          
          // 권한 허용
          const allowBtns = await popup.locator('button').filter({ hasText: /Allow|허용|Continue|계속/ }).all();
          for (const ab of allowBtns) {
            try { await ab.click(); } catch (e) {}
            await popup.waitForTimeout(2000);
          }
        } catch (e) {
          console.log('Gmail 팝업 처리 오류:', e.message);
        }
      }
      break;
    }
  }
  
  await page.waitForTimeout(5000);
  
  console.log('11. Outlook 액션 추가...');
  const newStepBtns = await page.locator('button').filter({ hasText: /New step|새 단계/ }).all();
  for (const btn of newStepBtns) {
    try { await btn.click(); break; } catch (e) {}
  }
  
  await page.waitForTimeout(3000);
  
  const searchInputs = await page.locator('input').all();
  for (const input of searchInputs) {
    const ph = await input.getAttribute('placeholder');
    if (ph && (ph.toLowerCase().includes('search') || ph.includes('검색'))) {
      await input.fill('Outlook Send email');
      await page.waitForTimeout(3000);
      break;
    }
  }
  
  const sendAction = page.locator('text=/Send an email|전자 메일 보내기/i').first();
  try {
    await sendAction.click({ timeout: 5000 });
  } catch (e) {}
  
  await page.waitForTimeout(3000);
  
  console.log('12. 저장...');
  const saveBtns = await page.locator('button').filter({ hasText: /^Save$|^저장$/ }).all();
  for (const btn of saveBtns) {
    try { await btn.click(); break; } catch (e) {}
  }
  
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-edge-final.png' });
  
  console.log('=== 완료 ===');
  await page.waitForTimeout(60000);
  await browser.close();
})();
