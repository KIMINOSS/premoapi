const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] Create 버튼 위치 확인...');
  
  // 대화상자 내 Create 버튼 좌표 찾기
  var btnInfo = await page.evaluate(function() {
    var buttons = document.querySelectorAll('button');
    var results = [];
    
    for (var i = 0; i < buttons.length; i++) {
      var text = buttons[i].textContent.trim();
      var rect = buttons[i].getBoundingClientRect();
      
      if (text.includes('Create') || text.includes('만들기')) {
        results.push({
          text: text,
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
          width: rect.width,
          height: rect.height,
          disabled: buttons[i].disabled
        });
      }
    }
    return results;
  });
  
  console.log('   버튼 정보:', JSON.stringify(btnInfo, null, 2));
  
  // Create 버튼 클릭 (대화상자 내부 버튼)
  if (btnInfo.length > 0) {
    // 대화상자 내부 버튼은 보통 마지막 또는 두 번째
    var createBtn = btnInfo.find(function(b) { 
      return b.text === 'Create' && !b.disabled && b.y > 700; 
    });
    
    if (createBtn) {
      console.log('[2] 좌표로 클릭: (' + createBtn.x + ', ' + createBtn.y + ')');
      await page.mouse.click(createBtn.x, createBtn.y);
      await page.waitForTimeout(6000);
    }
  }
  
  await page.screenshot({ path: 'C:\\temp\\pa-coord-click.png' });
  
  var currentUrl = page.url();
  console.log('[3] 현재 URL:', currentUrl);
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
