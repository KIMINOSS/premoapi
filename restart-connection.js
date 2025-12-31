const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('URL:', page.url());
  
  // 1. 트리거 카드 클릭
  console.log('[1] 트리거 클릭...');
  const trigger = await page.locator('text=When a new email arrives').first();
  if (await trigger.isVisible()) {
    await trigger.click();
    await page.waitForTimeout(1500);
  }
  
  // 2. Change connection 클릭
  console.log('[2] Change connection...');
  const changeConn = await page.locator('text=Change connection').first();
  if (await changeConn.isVisible()) {
    await changeConn.click();
    await page.waitForTimeout(1500);
  }
  
  // 3. Add new 클릭
  console.log('[3] Add new...');
  const addNew = await page.locator('text=Add new').first();
  if (await addNew.isVisible()) {
    await addNew.click();
    await page.waitForTimeout(1500);
  }
  
  // 4. Sign in 클릭
  console.log('[4] Sign in...');
  const signIn = await page.locator('button:has-text("Sign in")').first();
  if (await signIn.isVisible()) {
    await signIn.click();
    await page.waitForTimeout(5000);
  }
  
  // 5. 팝업 확인
  const allPages = context.pages();
  console.log('   페이지 수:', allPages.length);
  
  for (const p of allPages) {
    const url = p.url();
    console.log('   -', url.substring(0, 50));
    
    if (url.includes('login')) {
      // 다른 계정 선택
      const other = await p.locator('text=다른 계정으로 로그인').first();
      if (await other.isVisible()) {
        await other.click();
        await p.waitForTimeout(2000);
      }
      
      // 이메일 입력
      const email = await p.locator('input[type="email"]').first();
      if (await email.isVisible()) {
        await email.fill('minho.kim@grupopremo.com');
        const next = await p.locator('input[type="submit"]').first();
        await next.click();
        console.log('   ✓ 이메일 입력 및 Next');
      }
      
      await p.waitForTimeout(3000);
      await p.screenshot({ path: '.playwright-mcp/login-step.png' });
    }
  }
  
  await page.screenshot({ path: '.playwright-mcp/connection-step.png' });
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
