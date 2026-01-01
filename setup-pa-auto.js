const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome',
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // ===== 1. Microsoft 로그인 =====
  console.log('1. Power Automate 접속...');
  await page.goto('https://make.powerautomate.com');
  
  console.log('2. Microsoft 로그인...');
  await page.waitForSelector('input[type="email"]', { timeout: 60000 });
  await page.fill('input[type="email"]', 'minho.kim@grupopremo.com');
  await page.click('input[type="submit"]');
  
  await page.waitForSelector('input[type="password"]', { timeout: 60000 });
  await page.fill('input[type="password"]', process.env.PA_PASSWORD);
  await page.click('input[type="submit"]');
  
  // Stay signed in 처리
  await page.waitForTimeout(3000);
  try {
    const staySignedIn = page.locator('input[type="submit"][value="Yes"], input[type="submit"][value="예"], #idSIButton9');
    if (await staySignedIn.isVisible({ timeout: 5000 })) {
      await staySignedIn.click();
    }
  } catch (e) {}
  
  console.log('3. 대시보드 로딩 대기...');
  await page.waitForTimeout(15000);
  
  // ===== 2. 플로우 생성 =====
  console.log('4. 플로우 생성 페이지 이동...');
  await page.goto('https://make.powerautomate.com/create');
  await page.waitForTimeout(10000);
  
  // Automated cloud flow 클릭
  console.log('5. Automated cloud flow 선택...');
  try {
    await page.click('[data-automation-id="automation-cloud-flow-tile"]');
  } catch (e) {
    try {
      await page.click('text=Automated cloud flow');
    } catch (e2) {
      await page.click('text=자동화된 클라우드 흐름');
    }
  }
  await page.waitForTimeout(5000);
  
  // ===== 3. 플로우 이름 입력 =====
  console.log('6. 플로우 이름 설정...');
  try {
    const nameInput = page.locator('input[aria-label*="name"], input[aria-label*="이름"], input[placeholder*="name"]').first();
    await nameInput.fill('Resend-Email-Forward');
  } catch (e) {
    console.log('이름 입력 필드 못찾음');
  }
  
  // ===== 4. Gmail 트리거 검색 및 선택 =====
  console.log('7. Gmail 트리거 검색...');
  await page.waitForTimeout(2000);
  
  try {
    const searchBox = page.locator('input[type="text"][placeholder*="earch"], input[type="text"][placeholder*="검색"]').first();
    await searchBox.fill('Gmail when new email');
    await page.waitForTimeout(3000);
    
    // Gmail 트리거 선택
    await page.click('text=/When a new email arrives|새 이메일이 도착/i');
  } catch (e) {
    console.log('Gmail 트리거 검색 실패:', e.message);
  }
  
  await page.waitForTimeout(3000);
  
  // Create 버튼 클릭
  console.log('8. Create 버튼 클릭...');
  try {
    await page.click('button:has-text("Create"), button:has-text("만들기")');
  } catch (e) {}
  
  await page.waitForTimeout(8000);
  
  // ===== 5. Gmail 연결 =====
  console.log('9. Gmail 연결 시도...');
  
  // Sign in 또는 연결 버튼 찾기
  try {
    const signInBtn = page.locator('button:has-text("Sign in"), button:has-text("로그인"), a:has-text("Sign in")').first();
    if (await signInBtn.isVisible({ timeout: 5000 })) {
      
      // 팝업 대기하면서 클릭
      const [popup] = await Promise.all([
        context.waitForEvent('page', { timeout: 30000 }),
        signInBtn.click()
      ]);
      
      console.log('10. Gmail 로그인 팝업 처리...');
      await popup.waitForLoadState();
      
      // Google 이메일 입력
      await popup.waitForSelector('input[type="email"]', { timeout: 30000 });
      await popup.fill('input[type="email"]', 'koghminho@gmail.com');
      await popup.click('button:has-text("Next"), button:has-text("다음"), #identifierNext');
      
      await popup.waitForTimeout(3000);
      
      // Google 비밀번호 입력
      await popup.waitForSelector('input[type="password"]', { timeout: 30000 });
      await popup.fill('input[type="password"]', process.env.GMAIL_PASSWORD);
      await popup.click('button:has-text("Next"), button:has-text("다음"), #passwordNext');
      
      await popup.waitForTimeout(5000);
      
      // 권한 허용
      try {
        await popup.click('button:has-text("Allow"), button:has-text("허용"), button:has-text("Continue")');
        await popup.waitForTimeout(3000);
        await popup.click('button:has-text("Allow"), button:has-text("허용")');
      } catch (e) {}
      
      console.log('11. Gmail 연결 완료');
    }
  } catch (e) {
    console.log('Gmail 연결 실패:', e.message);
  }
  
  await page.waitForTimeout(5000);
  
  // ===== 6. Outlook 액션 추가 =====
  console.log('12. Outlook 액션 추가...');
  try {
    await page.click('button:has-text("New step"), button:has-text("새 단계"), text=+ New step');
    await page.waitForTimeout(3000);
    
    const actionSearch = page.locator('input[placeholder*="earch"], input[placeholder*="검색"]').first();
    await actionSearch.fill('Office 365 Outlook Send');
    await page.waitForTimeout(3000);
    
    await page.click('text=/Send an email|전자 메일 보내기/i');
    await page.waitForTimeout(3000);
  } catch (e) {
    console.log('Outlook 액션 추가 실패:', e.message);
  }
  
  // ===== 7. 저장 =====
  console.log('13. 플로우 저장...');
  try {
    await page.click('button:has-text("Save"), button:has-text("저장")');
  } catch (e) {}
  
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-final-result.png' });
  
  console.log('=== 완료 ===');
  console.log('스크린샷: pa-final-result.png');
  
  // 브라우저 열어둠
  await page.waitForTimeout(60000);
  await browser.close();
})();
