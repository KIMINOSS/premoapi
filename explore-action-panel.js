const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    await dialog.dismiss().catch(function() {});
  });

  await page.screenshot({ path: 'C:\\temp\\pa-explore-1.png' });

  console.log('[1] 현재 패널 전체 구조 분석...');

  var panelContent = await page.evaluate(function() {
    // 메인 컨텐츠 영역의 모든 텍스트
    return document.body.innerText.substring(0, 2000);
  });

  console.log('   패널 내용 (일부):');
  console.log(panelContent.substring(0, 800));

  console.log('\n[2] 탭/카테고리 버튼 찾기...');

  var tabs = await page.evaluate(function() {
    var results = [];
    var tabElements = document.querySelectorAll('[role="tab"], [class*="tab"], [class*="Tab"], button');

    tabElements.forEach(function(tab) {
      var text = tab.innerText || tab.getAttribute('aria-label') || '';
      var rect = tab.getBoundingClientRect();
      // 화면에 보이고 적절한 크기인 탭
      if (rect.y > 200 && rect.y < 500 && rect.width > 30 && rect.width < 200 && text.length > 0 && text.length < 50) {
        results.push({
          text: text.trim(),
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2)
        });
      }
    });

    return results.slice(0, 15);
  });

  console.log('   탭들:');
  tabs.forEach(function(t, i) {
    console.log('   [' + i + '] "' + t.text + '" (x=' + t.x + ', y=' + t.y + ')');
  });

  // "Runtime" 또는 "Built-in" 탭 찾기
  var runtimeTab = tabs.find(function(t) {
    return t.text.indexOf('Runtime') >= 0 || t.text.indexOf('Built-in') >= 0 || t.text.indexOf('Built') >= 0;
  });

  if (runtimeTab) {
    console.log('[3] Runtime/Built-in 탭 클릭...');
    await page.mouse.click(runtimeTab.x, runtimeTab.y);
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'C:\\temp\\pa-runtime-tab.png' });

    // Data Operations 카테고리 찾기
    console.log('[4] Data Operations 카테고리 찾기...');

    var dataOpsCategory = await page.evaluate(function() {
      var elements = document.querySelectorAll('*');
      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        var text = el.innerText || '';
        var rect = el.getBoundingClientRect();
        if (text.indexOf('Data Operations') >= 0 && rect.y > 200 && rect.y < 700 && rect.height < 60) {
          return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2), text: text.substring(0, 50) };
        }
      }
      return null;
    });

    console.log('   Data Operations:', dataOpsCategory);

    if (dataOpsCategory) {
      await page.mouse.click(dataOpsCategory.x, dataOpsCategory.y);
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'C:\\temp\\pa-data-ops-cat.png' });

      // Compose 액션 찾기
      console.log('[5] Compose 액션 찾기...');

      var composeAction = await page.evaluate(function() {
        var elements = document.querySelectorAll('*');
        for (var i = 0; i < elements.length; i++) {
          var el = elements[i];
          var text = el.innerText || '';
          var rect = el.getBoundingClientRect();
          // "Compose"가 단독으로 또는 설명과 함께 있는 항목
          if (text.trim() === 'Compose' || (text.indexOf('Compose') >= 0 && text.length < 100)) {
            if (rect.y > 250 && rect.y < 700 && rect.height > 20 && rect.height < 80) {
              return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2), text: text.substring(0, 60) };
            }
          }
        }
        return null;
      });

      console.log('   Compose:', composeAction);

      if (composeAction) {
        await page.mouse.click(composeAction.x, composeAction.y);
        console.log('   Compose 클릭됨!');
        await page.waitForTimeout(3000);
      }
    }
  } else {
    console.log('[3] Runtime/Built-in 탭 없음. 다른 방법 시도...');
  }

  await page.screenshot({ path: 'C:\\temp\\pa-explore-final.png' });

  // 최종 상태 확인
  console.log('[6] 최종 상태...');
  var finalState = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasCompose: text.indexOf('Compose') >= 0 && text.indexOf('Inputs') >= 0,
      stillNeedsAction: text.indexOf('should contain at least one trigger and one action') >= 0
    };
  });

  console.log('   상태:', finalState);

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
