const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] Create 버튼 직접 좌표 클릭...');
  
  // 스크린샷에서 보이는 Create 버튼 위치 (대략 1010, 765)
  await page.mouse.click(1010, 765);
  console.log('   (1010, 765) 클릭됨');
  
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'C:\\temp\\pa-direct-click.png' });
  
  var currentUrl = page.url();
  console.log('[2] 현재 URL:', currentUrl);
  
  // 페이지 내용 확인
  var hasGmailConfig = await page.evaluate(function() {
    return document.body.innerText.includes('Gmail') && 
           (document.body.innerText.includes('Sign in') || 
            document.body.innerText.includes('connection') ||
            document.body.innerText.includes('When a new email'));
  });
  console.log('[3] Gmail 설정 페이지:', hasGmailConfig);
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
