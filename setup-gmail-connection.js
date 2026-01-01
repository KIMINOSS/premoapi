/**
 * Gmail 연결 설정 - CDP 연결
 */

const { chromium } = require('playwright');

const CONFIG = {
  CDP_ENDPOINT: 'http://localhost:9222',
  GMAIL_EMAIL: 'koghminho@gmail.com',
  GMAIL_PASSWORD: process.env.GMAIL_PASSWORD,
  RESEND_SENDER: 'onboarding@resend.dev'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🔗 Edge 브라우저에 연결...');
  
  let browser;
  try {
    browser = await chromium.connectOverCDP(CONFIG.CDP_ENDPOINT);
    console.log('✅ 연결 성공');
  } catch (error) {
    console.error('❌ 연결 실패:', error.message);
    return;
  }
  
  const contexts = browser.contexts();
  const context = contexts[0];
  const pages = context.pages();
  let page = pages.find(p => p.url().includes('powerautomate.com')) || pages[0];
  
  console.log('현재 URL:', page.url());
  
  try {
    // 1. 트리거 카드 클릭하여 연결 설정
    console.log('\n[1] Gmail 트리거 카드 클릭...');
    
    const triggerCard = page.locator('[class*="card"], [class*="node"]').filter({ hasText: /When a new email|Gmail/i }).first();
    await triggerCard.click({ timeout: 5000 }).catch(() => {});
    await sleep(2000);
    
    await page.screenshot({ path: 'gmail-step1.png' });
    
    // 2. 연결 업데이트/설정 버튼 찾기
    console.log('[2] 연결 설정...');
    
    // "Invalid connection" 또는 "Sign in" 링크/버튼 클릭
    const connectionBtn = page.locator('a, button').filter({ hasText: /update.*connection|Sign in|Connect|연결/i }).first();
    
    if (await connectionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('   연결 버튼 발견 - 클릭...');
      
      const [popup] = await Promise.all([
        context.waitForEvent('page', { timeout: 60000 }).catch(() => null),
        connectionBtn.click()
      ]);
      
      if (popup) {
        console.log('[3] Google 로그인 팝업...');
        await popup.waitForLoadState();
        await sleep(2000);
        
        // Google 로그인 처리
        const emailInput = popup.locator('input[type="email"]');
        if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('   이메일 입력...');
          await emailInput.fill(CONFIG.GMAIL_EMAIL);
          await popup.click('#identifierNext');
          await sleep(4000);
          
          console.log('   비밀번호 입력...');
          await popup.fill('input[type="password"]', CONFIG.GMAIL_PASSWORD);
          await popup.click('#passwordNext');
          await sleep(5000);
        }
        
        // 권한 승인
        console.log('[4] 권한 승인...');
        const allowBtns = await popup.locator('button').filter({ hasText: /Allow|허용|Continue|계속|확인/i }).all();
        for (const btn of allowBtns) {
          if (await btn.isVisible().catch(() => false)) {
            await btn.click();
            console.log('   ✓ 권한 승인');
            await sleep(3000);
          }
        }
        
        await sleep(3000);
      } else {
        console.log('   팝업 없음 - 이미 연결되었을 수 있음');
      }
    } else {
      console.log('   연결 버튼 없음 - 설정 패널 확인');
      
      // 설정 패널에서 연결 드롭다운 찾기
      const connectionDropdown = page.locator('select, [role="combobox"]').filter({ hasText: /connection|연결/i }).first();
      if (await connectionDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        await connectionDropdown.click();
        await sleep(1000);
        
        // 새 연결 추가
        const addNew = page.locator('text=/Add new|새 연결 추가/i').first();
        await addNew.click().catch(() => {});
        await sleep(3000);
      }
    }
    
    await page.screenshot({ path: 'gmail-step2.png' });
    
    // 5. Gmail 필터 설정
    console.log('[5] Gmail 필터 설정...');
    
    // From 필드
    const fromInput = page.locator('input[aria-label*="From" i], input[placeholder*="from" i]').first();
    if (await fromInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fromInput.fill(CONFIG.RESEND_SENDER);
      console.log('   ✓ From: ' + CONFIG.RESEND_SENDER);
    }
    
    // Label 필드 (INBOX)
    const labelInput = page.locator('input[aria-label*="Label" i], [aria-label*="label" i]').first();
    if (await labelInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await labelInput.fill('INBOX');
      console.log('   ✓ Label: INBOX');
    }
    
    await page.screenshot({ path: 'gmail-step3.png' });
    
    // 6. 저장
    console.log('[6] 저장...');
    const saveBtn = page.locator('button').filter({ hasText: /^Save$/i }).first();
    await saveBtn.click({ timeout: 3000 }).catch(() => {});
    await sleep(5000);
    
    await page.screenshot({ path: 'gmail-complete.png' });
    
    console.log('\n════════════════════════════════════════');
    console.log('✅ Gmail 연결 설정 완료!');
    console.log('════════════════════════════════════════');
    
  } catch (error) {
    console.error('\n❌ 오류:', error.message);
    await page.screenshot({ path: 'gmail-error.png' });
  }
  
  console.log('\n📌 브라우저 연결 해제');
}

main();
