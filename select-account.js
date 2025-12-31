const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const allPages = context.pages();
  
  for (const p of allPages) {
    const url = p.url();
    if (url.includes('login.live.com') || url.includes('login.microsoftonline.com')) {
      console.log('[1] 계정 선택...');
      
      // koghminho@naver.com 계정 클릭
      const account = await p.locator('text=koghminho@naver.com').first();
      if (await account.isVisible()) {
        await account.click();
        console.log('   ✓ 계정 클릭됨');
        await p.waitForTimeout(5000);
      }
      
      // 비밀번호 입력 필요 시
      const pwdInput = await p.locator('input[type="password"]').first();
      if (await pwdInput.isVisible()) {
        console.log('   비밀번호 입력 필요');
      }
      
      // Stay signed in
      const yesBtn = await p.locator('button:has-text("예"), button:has-text("Yes")').first();
      if (await yesBtn.isVisible()) {
        await yesBtn.click();
        console.log('   ✓ 예 클릭됨');
      }
      
      await p.screenshot({ path: '.playwright-mcp/account-selected.png' });
    }
  }
  
  // 메인 페이지 확인
  await allPages[0].waitForTimeout(3000);
  await allPages[0].screenshot({ path: '.playwright-mcp/final-state.png' });
  
  console.log('📸 완료');
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
