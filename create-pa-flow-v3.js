const { chromium } = require('playwright');

const CONFIG = {
  MS_EMAIL: 'minho.kim@grupopremo.com',
  MS_PASSWORD: 'Alshtm***REMOVED***!@',
  FLOW_NAME: 'PREMO-Email-Auth',
  RESEND_SENDER: 'onboarding@resend.dev'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function screenshot(page, name) {
  await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-' + name + '.png' });
  console.log('   📸 ' + name);
}

async function main() {
  console.log('🚀 Power Automate 플로우 생성 v3');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Power Automate 접속
    console.log('\n[1] Power Automate 접속...');
    await page.goto('https://make.powerautomate.com');
    await sleep(5000);
    await screenshot(page, '01-initial');
    
    // 로그인 처리
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('[1] 로그인 중...');
      await emailInput.fill(CONFIG.MS_EMAIL);
      await page.click('input[type="submit"]');
      await sleep(3000);
      
      await page.fill('input[type="password"]', CONFIG.MS_PASSWORD);
      await page.click('input[type="submit"]');
      await sleep(3000);
      
      // Stay signed in
      try {
        await page.click('#idSIButton9', { timeout: 3000 });
      } catch(e) {}
      await sleep(5000);
    }
    
    await screenshot(page, '02-logged-in');
    console.log('[1] ✓ 완료');
    
    // 2. Create 페이지
    console.log('[2] Create 페이지...');
    await page.goto('https://make.powerautomate.com/create');
    await sleep(5000);
    await screenshot(page, '03-create-page');
    
    // 3. Automated cloud flow 카드 클릭
    console.log('[3] Automated cloud flow 선택...');
    
    let clicked = false;
    
    // 방법 1: 텍스트로 찾기
    const cards = await page.locator('[class*="Card"], [class*="tile"], [role="button"]').all();
    for (const card of cards) {
      const text = await card.textContent().catch(() => '');
      if (text.includes('Automated cloud flow') || text.includes('Automated')) {
        await card.click();
        clicked = true;
        console.log('   방법1 성공: 카드 클릭');
        break;
      }
    }
    
    // 방법 2: h3 태그 찾기
    if (!clicked) {
      const h3s = await page.locator('h3, h4, [class*="title"]').all();
      for (const h3 of h3s) {
        const text = await h3.textContent().catch(() => '');
        if (text.includes('Automated')) {
          await h3.click();
          clicked = true;
          console.log('   방법2 성공: 제목 클릭');
          break;
        }
      }
    }
    
    // 방법 3: 직접 URL 이동
    if (!clicked) {
      console.log('   카드 클릭 실패 - URL로 직접 이동');
      await page.goto('https://make.powerautomate.com/flows/new?fromBlank=true&triggerCategory=automated');
      await sleep(5000);
    }
    
    await sleep(3000);
    await screenshot(page, '04-after-click');
    
    // 4. 플로우 이름 입력
    console.log('[4] 플로우 설정...');
    await sleep(2000);
    
    const inputs = await page.locator('input:visible').all();
    console.log('   발견된 입력 필드: ' + inputs.length);
    
    for (const input of inputs) {
      const ph = await input.getAttribute('placeholder');
      const al = await input.getAttribute('aria-label');
      
      if ((ph && (ph.toLowerCase().includes('name') || ph.toLowerCase().includes('flow'))) ||
          (al && (al.toLowerCase().includes('name') || al.toLowerCase().includes('flow')))) {
        await input.fill(CONFIG.FLOW_NAME);
        console.log('[4] ✓ 플로우 이름 입력');
        break;
      }
    }
    
    await screenshot(page, '05-name-entered');
    
    // 5. 트리거 검색
    console.log('[5] 트리거 검색...');
    
    const searchInputs = await page.locator('input:visible').all();
    for (const input of searchInputs) {
      const ph = await input.getAttribute('placeholder');
      if (ph && ph.toLowerCase().includes('search')) {
        await input.fill('Gmail when new email');
        await sleep(3000);
        console.log('[5] ✓ 검색어 입력');
        break;
      }
    }
    
    await screenshot(page, '06-search');
    
    // Gmail 트리거 선택
    await sleep(2000);
    const gmailOptions = await page.locator('[class*="item"], [role="option"], [class*="result"]').all();
    for (const opt of gmailOptions) {
      const text = await opt.textContent().catch(() => '');
      if (text.toLowerCase().includes('gmail') || text.toLowerCase().includes('email')) {
        await opt.click();
        console.log('[5] ✓ Gmail 트리거 선택');
        break;
      }
    }
    
    await sleep(2000);
    await screenshot(page, '07-trigger-selected');
    
    // 6. Create 버튼
    console.log('[6] Create...');
    const allButtons = await page.locator('button:visible').all();
    for (const btn of allButtons) {
      const text = await btn.textContent();
      if (text && (text.trim() === 'Create' || text.includes('Create') || text.includes('만들기'))) {
        await btn.click();
        console.log('[6] ✓ Create 클릭');
        break;
      }
    }
    
    await sleep(10000);
    await screenshot(page, '08-flow-created');
    
    // 7. 저장
    console.log('[7] 저장...');
    const saveBtns = await page.locator('button:visible').all();
    for (const btn of saveBtns) {
      const text = await btn.textContent();
      if (text && (text.trim() === 'Save' || text.includes('Save') || text.includes('저장'))) {
        await btn.click();
        console.log('[7] ✓ 저장');
        break;
      }
    }
    
    await sleep(5000);
    await screenshot(page, '09-saved');
    
    console.log('\n════════════════════════════════════════');
    console.log('✅ 플로우 생성 프로세스 완료!');
    console.log('════════════════════════════════════════');
    
  } catch (error) {
    console.error('\n❌ 오류:', error.message);
    await screenshot(page, 'error');
  }
  
  console.log('\n브라우저 유지 중 (90초)...');
  await sleep(90000);
  await browser.close();
}

main();
