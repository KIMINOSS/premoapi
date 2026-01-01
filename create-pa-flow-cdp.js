/**
 * Power Automate 플로우 생성 - CDP 연결 방식
 * 열려있는 Edge 브라우저에 연결하여 작업
 */

const { chromium } = require('playwright');

const CONFIG = {
  CDP_ENDPOINT: 'http://localhost:9222',
  FLOW_NAME: 'PREMO-Email-Auth',
  RESEND_SENDER: 'onboarding@resend.dev',
  MS_EMAIL: 'minho.kim@grupopremo.com',
  MS_PASSWORD: process.env.PA_PASSWORD
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🔗 열려있는 Edge 브라우저에 연결 중...');
  console.log('   CDP Endpoint:', CONFIG.CDP_ENDPOINT);
  
  let browser;
  try {
    browser = await chromium.connectOverCDP(CONFIG.CDP_ENDPOINT);
    console.log('✅ 브라우저 연결 성공!');
  } catch (error) {
    console.error('❌ 브라우저 연결 실패:', error.message);
    console.log('\n💡 Edge를 원격 디버깅 모드로 실행하세요:');
    console.log('   msedge --remote-debugging-port=9222');
    return;
  }
  
  const contexts = browser.contexts();
  console.log('   컨텍스트 수:', contexts.length);
  
  if (contexts.length === 0) {
    console.error('❌ 열린 컨텍스트가 없습니다.');
    return;
  }
  
  const context = contexts[0];
  const pages = context.pages();
  console.log('   페이지 수:', pages.length);
  
  // Power Automate 탭 찾기 또는 첫 번째 탭 사용
  let page = pages.find(p => p.url().includes('powerautomate.com')) || pages[0];
  console.log('   현재 URL:', page.url());
  
  try {
    // Power Automate로 이동 (필요시)
    if (!page.url().includes('powerautomate.com')) {
      console.log('\n[1] Power Automate 접속...');
      await page.goto('https://make.powerautomate.com');
      await page.waitForLoadState('networkidle');
      await sleep(3000);
    }
    
    // 로그인 확인
    const needLogin = await page.locator('input[type="email"]').isVisible({ timeout: 3000 }).catch(() => false);
    
    if (needLogin) {
      console.log('[2] 로그인 중...');
      await page.fill('input[type="email"]', CONFIG.MS_EMAIL);
      await page.click('input[type="submit"]');
      await sleep(3000);
      
      await page.fill('input[type="password"]', CONFIG.MS_PASSWORD);
      await page.click('input[type="submit"]');
      await sleep(3000);
      
      // Stay signed in
      const stayBtn = page.locator('#idSIButton9');
      if (await stayBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await stayBtn.click();
      }
      await sleep(5000);
    }
    
    console.log('[2] ✓ 로그인 상태 확인');
    
    // Create 페이지로 이동
    console.log('[3] Create 페이지 이동...');
    await page.goto('https://make.powerautomate.com/create');
    await page.waitForLoadState('networkidle');
    await sleep(5000);
    
    await page.screenshot({ path: 'pa-create-page.png' });
    
    // Automated cloud flow 선택
    console.log('[4] Automated cloud flow 선택...');
    
    // 방법 1: 카드 찾기
    const cards = await page.locator('div[class*="Card"], div[class*="tile"], button[class*="button"]').all();
    let clicked = false;
    
    for (const card of cards) {
      const text = await card.textContent().catch(() => '');
      if (text.toLowerCase().includes('automated')) {
        await card.click();
        clicked = true;
        console.log('   ✓ Automated 카드 클릭');
        break;
      }
    }
    
    // 방법 2: 직접 URL
    if (!clicked) {
      console.log('   카드 못 찾음 - 직접 URL 이동');
      await page.goto('https://make.powerautomate.com/flows/new?fromBlank=true&triggerCategory=automated');
      await sleep(5000);
    }
    
    await sleep(3000);
    await page.screenshot({ path: 'pa-after-automated.png' });
    
    // 모달/다이얼로그에서 설정
    console.log('[5] 플로우 설정...');
    await sleep(2000);
    
    // 플로우 이름 입력
    const nameInputs = await page.locator('input[type="text"]:visible').all();
    for (const input of nameInputs) {
      const ph = await input.getAttribute('placeholder') || '';
      const al = await input.getAttribute('aria-label') || '';
      if (ph.toLowerCase().includes('name') || al.toLowerCase().includes('name') || 
          ph.toLowerCase().includes('flow') || al.toLowerCase().includes('flow')) {
        await input.fill(CONFIG.FLOW_NAME);
        console.log('   ✓ 플로우 이름 입력');
        break;
      }
    }
    
    // 트리거 검색
    console.log('[6] 트리거 검색...');
    const searchInputs = await page.locator('input:visible').all();
    for (const input of searchInputs) {
      const ph = await input.getAttribute('placeholder') || '';
      if (ph.toLowerCase().includes('search')) {
        await input.fill('Gmail when new email');
        await sleep(3000);
        console.log('   ✓ 검색어 입력');
        break;
      }
    }
    
    await page.screenshot({ path: 'pa-search.png' });
    
    // Gmail 트리거 선택
    await sleep(2000);
    const results = await page.locator('[class*="item"], [class*="result"], [role="option"]').all();
    for (const result of results) {
      const text = await result.textContent().catch(() => '');
      if (text.toLowerCase().includes('gmail') && text.toLowerCase().includes('email')) {
        await result.click();
        console.log('   ✓ Gmail 트리거 선택');
        break;
      }
    }
    
    await sleep(2000);
    
    // Create 버튼 클릭
    console.log('[7] Create...');
    const buttons = await page.locator('button:visible').all();
    for (const btn of buttons) {
      const text = await btn.textContent() || '';
      if (text.trim().toLowerCase() === 'create' || text.includes('만들기')) {
        await btn.click();
        console.log('   ✓ Create 클릭');
        break;
      }
    }
    
    await sleep(10000);
    await page.screenshot({ path: 'pa-flow-created.png' });
    
    // 저장
    console.log('[8] 저장...');
    const saveBtns = await page.locator('button:visible').all();
    for (const btn of saveBtns) {
      const text = await btn.textContent() || '';
      if (text.trim().toLowerCase() === 'save' || text.includes('저장')) {
        await btn.click();
        console.log('   ✓ 저장');
        break;
      }
    }
    
    await sleep(5000);
    await page.screenshot({ path: 'pa-final.png' });
    
    console.log('\n════════════════════════════════════════');
    console.log('✅ Power Automate 플로우 설정 완료!');
    console.log('════════════════════════════════════════');
    
  } catch (error) {
    console.error('\n❌ 오류:', error.message);
    await page.screenshot({ path: 'pa-error.png' });
  }
  
  // 브라우저 연결 해제 (닫지 않음)
  console.log('\n📌 브라우저 연결 해제 (브라우저는 열린 상태 유지)');
}

main();
