const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    await dialog.dismiss().catch(function() {});
  });

  await page.screenshot({ path: 'C:\\temp\\pa-before-select.png' });

  console.log('[1] "Initialize variable" 액션 직접 찾기...');

  // 텍스트로 직접 찾기
  var initVarItem = page.locator('text=Initialize variable').first();
  var isVisible = await initVarItem.isVisible().catch(function() { return false; });

  if (isVisible) {
    console.log('   Initialize variable 발견! 클릭...');
    await initVarItem.click();
    await page.waitForTimeout(3000);
  } else {
    console.log('   텍스트로 못 찾음. 좌표로 찾기...');

    // Initialize variable이 포함된 요소의 좌표 찾기
    var varAction = await page.evaluate(function() {
      var elements = document.querySelectorAll('*');
      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        var text = el.innerText || '';
        var rect = el.getBoundingClientRect();

        // "Initialize variable"이 정확히 포함되고, 적당한 크기인 요소
        if (text.indexOf('Initialize variable') >= 0 && text.indexOf('Show more') < 0 && rect.y > 200 && rect.y < 700 && rect.height > 30 && rect.height < 80) {
          return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2), text: text.substring(0, 50) };
        }
      }
      return null;
    });

    console.log('   좌표 결과:', varAction);

    if (varAction) {
      await page.mouse.click(varAction.x, varAction.y);
      await page.waitForTimeout(3000);
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-after-init-var.png' });

  console.log('[2] Initialize variable 설정 확인...');

  // Name, Type, Value 필드 확인
  var varSettings = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasName: text.indexOf('Name') >= 0,
      hasType: text.indexOf('Type') >= 0,
      hasValue: text.indexOf('Value') >= 0,
      hasInitVar: text.indexOf('Initialize variable') >= 0
    };
  });

  console.log('   변수 설정:', varSettings);

  if (varSettings.hasName && varSettings.hasType) {
    console.log('[3] 변수 이름 입력...');

    // Name 필드 찾기
    var nameInput = page.locator('input[aria-label*="Name"], input[placeholder*="Enter"]').first();
    isVisible = await nameInput.isVisible().catch(function() { return false; });

    if (isVisible) {
      await nameInput.fill('EmailSubject');
      console.log('   이름 입력됨: EmailSubject');
      await page.waitForTimeout(1000);
    }

    // Type 드롭다운 (기본값 String 사용)
    console.log('[4] 타입은 기본값(String) 사용...');

    // Value 필드
    var valueInput = page.locator('input[aria-label*="Value"], textarea[aria-label*="Value"]').first();
    isVisible = await valueInput.isVisible().catch(function() { return false; });

    if (isVisible) {
      await valueInput.fill('Test');
      console.log('   값 입력됨: Test');
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-var-configured.png' });

  console.log('[5] 플로우 저장 시도...');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Save 버튼 클릭
  var saveBtn = page.locator('button:has-text("Save")').first();
  await saveBtn.click();
  console.log('   Save 클릭됨');

  await page.waitForTimeout(10000);

  var currentUrl = page.url();
  console.log('[6] 최종 URL:', currentUrl);

  if (!currentUrl.includes('/flows/new')) {
    var flowIdMatch = currentUrl.match(/flows\/([a-f0-9-]+)/);
    if (flowIdMatch) {
      console.log('[성공] 플로우 저장됨! ID:', flowIdMatch[1]);
    }
  }

  await page.screenshot({ path: 'C:\\temp\\pa-final-save.png' });

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
