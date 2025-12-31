const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  await page.screenshot({ path: 'C:\\temp\\pa-before-final.png' });
  
  console.log('[1] Flow name 확인 및 입력...');
  
  var nameInput = page.locator('input').first();
  var currentValue = await nameInput.inputValue().catch(function() { return ''; });
  console.log('   현재 이름:', currentValue);
  
  if (!currentValue || currentValue.length < 3) {
    await nameInput.fill('PREMO-Gmail-Auth');
    console.log('   이름 입력됨');
  }
  
  console.log('[2] 대화상자 내 Create 버튼 정확히 클릭...');
  
  // 대화상자 영역 내에서 Create 버튼 찾기
  var dialog = page.locator('[role="dialog"], .ms-Dialog, [class*="dialog"], [class*="modal"]').first();
  var dialogVisible = await dialog.isVisible().catch(function() { return false; });
  
  if (dialogVisible) {
    var createInDialog = dialog.getByRole('button', { name: 'Create' });
    await createInDialog.click();
    console.log('   대화상자 내 Create 클릭됨');
  } else {
    // 직접 버튼 클릭
    var allCreateBtns = page.getByRole('button', { name: 'Create' });
    var count = await allCreateBtns.count();
    console.log('   Create 버튼 수:', count);
    
    // y좌표 750 근처의 버튼 클릭 (버튼 2)
    if (count >= 3) {
      await allCreateBtns.nth(2).click();
      console.log('   버튼 2 클릭됨');
    }
  }
  
  console.log('[3] 페이지 로딩 대기...');
  await page.waitForTimeout(8000);
  
  await page.screenshot({ path: 'C:\\temp\\pa-final-result.png' });
  
  var currentUrl = page.url();
  console.log('[4] 최종 URL:', currentUrl);
  
  // 플로우 에디터 확인
  var isFlowEditor = currentUrl.includes('flows/') || currentUrl.includes('edit');
  console.log('   플로우 에디터:', isFlowEditor);
  
  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
