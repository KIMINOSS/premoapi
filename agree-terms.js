const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const allPages = context.pages();
  
  for (const p of allPages) {
    const url = p.url();
    if (url.includes('login') || url.includes('signup') || url.includes('microsoft')) {
      console.log('[1] 체크박스 선택...');
      
      // 모든 체크박스 클릭
      const checkboxes = await p.locator('input[type="checkbox"], [role="checkbox"]').all();
      console.log('   체크박스 수:', checkboxes.length);
      
      for (const cb of checkboxes) {
        if (await cb.isVisible()) {
          await cb.click();
          console.log('   ✓ 체크박스 클릭됨');
        }
      }
      
      // 라디오 버튼도 확인
      const radios = await p.locator('input[type="radio"], [role="radio"]').all();
      for (const r of radios) {
        if (await r.isVisible()) {
          await r.click();
        }
      }
      
      await p.waitForTimeout(500);
      
      // 동의 버튼 클릭
      console.log('[2] 동의 버튼 클릭...');
      const agreeBtn = await p.locator('button:has-text("동의"), input[value="동의"], button:has-text("Agree")').first();
      if (await agreeBtn.isVisible()) {
        await agreeBtn.click();
        console.log('   ✓ 동의 클릭됨');
      }
      
      await p.waitForTimeout(3000);
      await p.screenshot({ path: '.playwright-mcp/after-agree.png' });
    }
  }
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
