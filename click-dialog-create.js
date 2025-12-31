const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] 대화상자 내 버튼들 분석...');
  
  // 모든 버튼의 bounding box 가져오기
  var btns = await page.evaluate(function() {
    var results = [];
    var buttons = document.querySelectorAll('button');
    buttons.forEach(function(btn, i) {
      var rect = btn.getBoundingClientRect();
      var text = btn.textContent.trim();
      // Skip, Create, Cancel 버튼만 수집
      if (text === 'Skip' || text === 'Create' || text === 'Cancel') {
        results.push({
          index: i,
          text: text,
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2),
          width: rect.width,
          height: rect.height
        });
      }
    });
    return results;
  });
  
  console.log('   버튼들:', JSON.stringify(btns, null, 2));
  
  // Create 버튼 찾아서 클릭
  var createBtn = btns.find(function(b) { return b.text === 'Create'; });
  
  if (createBtn) {
    console.log('[2] Create 버튼 좌표 클릭:', createBtn.x, createBtn.y);
    await page.mouse.click(createBtn.x, createBtn.y);
    console.log('   클릭됨');
    
    await page.waitForTimeout(8000);
  }
  
  await page.screenshot({ path: 'C:\\temp\\pa-dialog-create.png' });
  
  var currentUrl = page.url();
  console.log('[3] 현재 URL:', currentUrl);
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
