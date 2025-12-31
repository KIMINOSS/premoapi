const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] 모든 Create 버튼 위치 확인...');
  
  var createBtns = page.getByRole('button', { name: 'Create' });
  var count = await createBtns.count();
  console.log('   Create 버튼 수:', count);
  
  // 각 버튼의 위치 확인
  for (var i = 0; i < count; i++) {
    var btn = createBtns.nth(i);
    var box = await btn.boundingBox().catch(function() { return null; });
    if (box) {
      console.log('   버튼 ' + i + ': x=' + box.x + ', y=' + box.y);
    }
  }
  
  console.log('[2] 대화상자 내 버튼 클릭 (마지막 또는 y > 700)...');
  
  // 마지막 버튼 또는 y좌표가 큰 버튼 클릭
  var lastBtn = createBtns.nth(count - 1);
  await lastBtn.click();
  console.log('   마지막 Create 버튼 클릭됨');
  
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'C:\\temp\\pa-last-create.png' });
  
  var currentUrl = page.url();
  console.log('[3] 현재 URL:', currentUrl);
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
