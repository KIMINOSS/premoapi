const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] JavaScript로 Create 버튼 클릭...');
  
  var result = await page.evaluate(function() {
    var buttons = document.querySelectorAll('button');
    var log = [];
    
    for (var i = 0; i < buttons.length; i++) {
      var text = buttons[i].textContent.trim();
      if (text === 'Create' || text === '만들기') {
        log.push('Found: ' + text + ', disabled: ' + buttons[i].disabled);
        if (!buttons[i].disabled) {
          buttons[i].click();
          log.push('Clicked!');
          return log;
        }
      }
    }
    return log;
  });
  
  console.log('   결과:', result);
  
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'C:\\temp\\pa-js-create-click.png' });
  
  var currentUrl = page.url();
  console.log('[2] 현재 URL:', currentUrl);
  
  // 페이지 변경 확인
  var pageTitle = await page.title();
  console.log('[3] 페이지 타이틀:', pageTitle);
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
