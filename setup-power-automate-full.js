const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 200
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // ===== Microsoft 로그인 =====
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
  
  // ===== 플로우 생성 =====
  console.log('4. 플로우 생성 시작...');
  await page.goto('https://make.powerautomate.com/create');
  await page.waitForTimeout(8000);
  
  // Automated cloud flow 클릭
  try {
    const autoFlow = page.locator('[data-testid="automated-cloud-flow"]');
    if (await autoFlow.isVisible({ timeout: 5000 })) {
      await autoFlow.click();
    } else {
      // 대안 셀렉터
      await page.click('text=/Automated cloud flow|자동화된 클라우드 흐름/i');
    }
  } catch (e) {
    console.log('Automated flow 버튼 찾기 실패, 직접 URL 시도');
    await page.goto('https://make.powerautomate.com/flows/new');
  }
  
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-step4.png' });
  
  // ===== 플로우 이름 및 트리거 설정 =====
  console.log('5. 플로우 이름 설정...');
  
  // 이름 입력 필드 찾기
  const nameInput = page.locator('input[placeholder*="name"], input[placeholder*="이름"]').first();
  if (await nameInput.isVisible({ timeout: 5000 })) {
    await nameInput.fill('Resend-Email-Forward');
  }
  
  // Gmail 트리거 검색
  console.log('6. Gmail 트리거 검색...');
  const searchTrigger = page.locator('input[placeholder*="Search"], input[placeholder*="검색"]').first();
  if (await searchTrigger.isVisible({ timeout: 5000 })) {
    await searchTrigger.fill('Gmail');
    await page.waitForTimeout(2000);
    
    // "When a new email arrives" 선택
    try {
      await page.click('text=/When a new email arrives|새 전자 메일|새 이메일/i');
    } catch (e) {
      console.log('Gmail 트리거 선택 실패');
    }
  }
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-step6.png' });
  
  // 만들기/Create 버튼
  try {
    await page.click('text=/^Create$|^만들기$/');
  } catch (e) {}
  
  await page.waitForTimeout(5000);
  
  // ===== Gmail 연결 =====
  console.log('7. Gmail 계정 연결...');
  
  // Gmail 로그인 팝업 처리
  const [popup] = await Promise.race([
    Promise.all([
      page.waitForEvent('popup', { timeout: 10000 })
    ]),
    page.waitForTimeout(10000).then(() => [null])
  ]);
  
  if (popup) {
    console.log('Gmail 로그인 팝업 감지...');
    await popup.waitForLoadState();
    
    // Google 로그인
    try {
      await popup.waitForSelector('input[type="email"]', { timeout: 10000 });
      await popup.fill('input[type="email"]', 'koghminho@gmail.com');
      await popup.click('button:has-text("Next"), button:has-text("다음")');
      
      await popup.waitForSelector('input[type="password"]', { timeout: 10000 });
      await popup.fill('input[type="password"]', process.env.GMAIL_PASSWORD);
      await popup.click('button:has-text("Next"), button:has-text("다음")');
      
      await popup.waitForTimeout(5000);
      
      // 권한 허용
      try {
        await popup.click('button:has-text("Allow"), button:has-text("허용")');
      } catch (e) {}
      
    } catch (e) {
      console.log('Gmail 로그인 팝업 처리 실패:', e.message);
    }
  }
  
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-step7.png' });
  
  // ===== 플로우 설정 계속 =====
  console.log('8. 플로우 액션 추가...');
  
  // 새 단계 추가
  try {
    await page.click('text=/New step|새 단계|\\+ Add/i');
    await page.waitForTimeout(2000);
    
    // Outlook 검색
    const actionSearch = page.locator('input[placeholder*="Search"], input[placeholder*="검색"]').first();
    if (await actionSearch.isVisible({ timeout: 3000 })) {
      await actionSearch.fill('Outlook Send');
      await page.waitForTimeout(2000);
      await page.click('text=/Send an email|전자 메일 보내기/i');
    }
  } catch (e) {
    console.log('액션 추가 실패:', e.message);
  }
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-step8.png' });
  
  console.log('9. 플로우 저장...');
  try {
    await page.click('text=/^Save$|^저장$/');
  } catch (e) {}
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-final.png' });
  
  console.log('=== 완료 ===');
  console.log('브라우저를 60초간 열어둡니다. 수동으로 완료해주세요.');
  await page.waitForTimeout(60000);
  
  await browser.close();
})();
