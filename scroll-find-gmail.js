const { chromium } = require('playwright');

async function main() {
  console.log('🔗 Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] 트리거 목록 스크롤...');
  
  // 트리거 목록 찾기 및 스크롤
  const triggerList = await page.locator('[role="listbox"], [role="list"], .ms-List').first();
  
  if (await triggerList.isVisible().catch(() => false)) {
    // 스크롤 다운
    await triggerList.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(500);
  }
  
  // 모든 트리거 옵션 수집
  const triggers = await page.evaluate(() => {
    const results = [];
    const items = document.querySelectorAll('[role="option"], [role="listitem"], .ms-List-cell');
    items.forEach(item => {
      const text = (item.textContent || '').trim();
      if (text.length < 100) {
        results.push(text.substring(0, 60));
      }
    });
    return results;
  });
  
  console.log('   발견된 트리거들:');
  triggers.forEach((t, i) => console.log(`   [${i}] ${t}`));
  
  // Gmail 또는 email 관련 트리거 찾기
  console.log('\n[2] Gmail/Email 트리거 검색...');
  
  const gmailTrigger = await page.locator('[role="option"], [role="listitem"], button, div').filter({ 
    hasText: /Gmail|새.*메일|new.*email|이메일.*도착|email.*arrives/i 
  }).first();
  
  if (await gmailTrigger.isVisible().catch(() => false)) {
    console.log('   ✓ Gmail/Email 트리거 발견');
    await gmailTrigger.click();
    await page.waitForTimeout(1000);
  } else {
    console.log('   Gmail 트리거 없음 - Cancel 후 Automated flow 선택 필요');
    
    // Cancel 클릭
    const cancelBtn = await page.locator('button').filter({ hasText: /Cancel|취소/ }).first();
    if (await cancelBtn.isVisible().catch(() => false)) {
      await cancelBtn.click();
      console.log('   ✓ Cancel 클릭됨');
      await page.waitForTimeout(1000);
    }
  }
  
  await page.screenshot({ path: 'C:\\\\temp\\\\pa-scroll-result.png' });
  console.log('   완료');
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
