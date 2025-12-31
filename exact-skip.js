const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('[1] 정확한 Skip 버튼 찾기...');
  
  // 모든 버튼 중 텍스트가 정확히 "Skip"인 것 찾기
  var skipBtns = await page.locator('button').all();
  
  for (var i = 0; i < skipBtns.length; i++) {
    var text = await skipBtns[i].textContent().catch(function() { return ''; });
    if (text && text.trim() === 'Skip') {
      console.log('   Skip 버튼 발견 (index ' + i + ')');
      await skipBtns[i].click();
      console.log('   클릭됨');
      break;
    }
  }
  
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'C:\\temp\\pa-exact-skip.png' });
  
  var currentUrl = page.url();
  console.log('[2] 현재 URL:', currentUrl);
  
  // 플로우 에디터 확인
  var hasFlowEditor = currentUrl.includes('flows/') || currentUrl.includes('/edit');
  console.log('   플로우 에디터:', hasFlowEditor);
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
