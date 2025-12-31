const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  console.log('[1] 모든 버튼 상세 분석...');

  // innerText, aria-label, class 등 모든 속성 분석
  var allBtns = await page.evaluate(function() {
    var results = [];
    var buttons = document.querySelectorAll('button');
    buttons.forEach(function(btn, i) {
      var rect = btn.getBoundingClientRect();
      // 화면에 보이는 버튼만 (높이와 너비가 있고, viewport 내에 있는)
      if (rect.width > 0 && rect.height > 0 && rect.y > 0 && rect.y < 900) {
        var innerText = btn.innerText || '';
        var textContent = btn.textContent || '';
        var ariaLabel = btn.getAttribute('aria-label') || '';
        var className = btn.className || '';
        var id = btn.id || '';

        // Skip, Create, Cancel 관련 버튼 필터
        var combined = (innerText + ' ' + textContent + ' ' + ariaLabel).toLowerCase();
        if (combined.indexOf('create') >= 0 || combined.indexOf('skip') >= 0 || combined.indexOf('cancel') >= 0) {
          // "Skip to main content" 등 제외
          if (innerText.indexOf('main content') < 0 && innerText.indexOf('triggers a flow') < 0) {
            results.push({
              index: i,
              innerText: innerText.substring(0, 50),
              textContent: textContent.substring(0, 50),
              ariaLabel: ariaLabel.substring(0, 50),
              id: id,
              className: className.substring(0, 80),
              x: Math.round(rect.x + rect.width / 2),
              y: Math.round(rect.y + rect.height / 2),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            });
          }
        }
      }
    });
    return results;
  });

  console.log('   관련 버튼들:');
  allBtns.forEach(function(btn) {
    console.log('   [' + btn.index + '] innerText="' + btn.innerText + '" x=' + btn.x + ' y=' + btn.y + ' w=' + btn.width);
  });

  // Create 버튼 찾기 (innerText가 정확히 "Create"인 것)
  var createBtn = allBtns.find(function(b) {
    return b.innerText.trim() === 'Create' || b.textContent.trim() === 'Create';
  });

  if (!createBtn) {
    // 대안: "Create"를 포함하고 너비가 적당한 버튼
    createBtn = allBtns.find(function(b) {
      return b.innerText.indexOf('Create') >= 0 && b.width > 50 && b.width < 200;
    });
  }

  if (createBtn) {
    console.log('[2] Create 버튼 발견! 좌표:', createBtn.x, createBtn.y);

    // 클릭 전 상태 스크린샷
    await page.screenshot({ path: 'C:\\temp\\pa-before-create-click.png' });

    // 좌표로 클릭
    await page.mouse.click(createBtn.x, createBtn.y);
    console.log('   클릭됨!');

    // 플로우 에디터 로딩 대기
    await page.waitForTimeout(10000);

    await page.screenshot({ path: 'C:\\temp\\pa-after-create-click.png' });
  } else {
    console.log('[2] Create 버튼을 찾지 못함. 대안으로 primary 버튼 찾기...');

    // Fluent UI primary 버튼 찾기
    var primaryBtn = await page.evaluate(function() {
      var btns = document.querySelectorAll('button[class*="primary"], button[class*="Primary"]');
      for (var i = 0; i < btns.length; i++) {
        var rect = btns[i].getBoundingClientRect();
        if (rect.y > 500 && rect.y < 900 && rect.width > 50) {
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: btns[i].innerText };
        }
      }
      return null;
    });

    if (primaryBtn) {
      console.log('   Primary 버튼 발견:', primaryBtn.text, '좌표:', primaryBtn.x, primaryBtn.y);
      await page.mouse.click(primaryBtn.x, primaryBtn.y);
      console.log('   클릭됨!');
      await page.waitForTimeout(10000);
    } else {
      // 최후 수단: 알려진 좌표 (이전 분석에서 약 1009, 764)
      console.log('   최후 수단: 알려진 좌표 클릭 (1009, 764)');
      await page.mouse.click(1009, 764);
      await page.waitForTimeout(10000);
    }

    await page.screenshot({ path: 'C:\\temp\\pa-after-fallback-click.png' });
  }

  var currentUrl = page.url();
  console.log('[3] 현재 URL:', currentUrl);

  var isFlowEditor = currentUrl.includes('flows/') || currentUrl.includes('/edit');
  console.log('   플로우 에디터 진입:', isFlowEditor);

  if (isFlowEditor) {
    console.log('[4] 성공! 플로우 에디터에 진입했습니다.');
  }

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
