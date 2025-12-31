const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
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
  await page.fill('input[type="password"]', 'Alshtm***REMOVED***!@');
  await page.click('input[type="submit"]');
  
  // "로그인 상태 유지" 팝업 처리
  try {
    await page.waitForSelector('input[value="예"]', { timeout: 5000 });
    await page.click('input[value="예"]');
  } catch (e) {
    try {
      await page.waitForSelector('input[value="Yes"]', { timeout: 3000 });
      await page.click('input[value="Yes"]');
    } catch (e2) {
      console.log('로그인 상태 유지 팝업 없음');
    }
  }
  
  console.log('3. Power Automate 대시보드 대기...');
  await page.waitForTimeout(5000);
  
  // 새 플로우 만들기
  console.log('4. 새 플로우 생성...');
  
  // "만들기" 또는 "Create" 메뉴 클릭
  try {
    await page.click('text=만들기');
  } catch (e) {
    await page.click('text=Create');
  }
  
  await page.waitForTimeout(2000);
  
  // "자동화된 클라우드 흐름" 선택
  try {
    await page.click('text=자동화된 클라우드 흐름');
  } catch (e) {
    await page.click('text=Automated cloud flow');
  }
  
  await page.waitForTimeout(2000);
  
  // 플로우 이름 입력
  console.log('5. 플로우 이름 설정...');
  await page.fill('input[placeholder*="이름"]', 'Resend Email Forward');
  
  // Gmail 트리거 검색
  console.log('6. Gmail 트리거 설정...');
  await page.fill('input[placeholder*="검색"]', 'Gmail');
  await page.waitForTimeout(1000);
  await page.click('text=새 전자 메일이 도착하는 경우');
  
  await page.click('text=만들기');
  
  await page.waitForTimeout(3000);
  
  console.log('7. Gmail 연결 설정 필요 - 브라우저에서 계속 진행해주세요.');
  console.log('브라우저를 열어둡니다...');
  
  // 브라우저 열어둠 (수동 완료용)
  await page.waitForTimeout(300000); // 5분 대기
  
  await browser.close();
})();
