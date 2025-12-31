const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  await page.screenshot({ path: 'C:\\temp\\pa-final-check.png' });

  console.log('[1] 현재 URL:', page.url());

  console.log('[2] 페이지 상태 분석...');

  var pageState = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasTrigger: text.indexOf('When a new email arrives') >= 0,
      hasCompose: text.indexOf('Compose') >= 0,
      hasFromFilter: text.indexOf('onboarding@resend.dev') >= 0,
      hasError: text.indexOf('error') >= 0 || text.indexOf('Error') >= 0,
      hasWarning: text.indexOf('should contain at least') >= 0,
      actionCount: (text.match(/step|action/gi) || []).length
    };
  });

  console.log('   상태:', pageState);

  console.log('[3] 플로우 구조 확인...');

  var flowStructure = await page.evaluate(function() {
    var cards = document.querySelectorAll('[class*="card"], [class*="Card"], [class*="operation"], [class*="Operation"]');
    var result = [];

    cards.forEach(function(card) {
      var text = card.innerText || '';
      var rect = card.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 30 && text.length < 200) {
        result.push({
          text: text.substring(0, 60).replace(/\n/g, ' '),
          y: Math.round(rect.y)
        });
      }
    });

    return result.sort(function(a, b) { return a.y - b.y; }).slice(0, 10);
  });

  console.log('   플로우 카드들:');
  flowStructure.forEach(function(card) {
    console.log('   - ' + card.text + ' (y=' + card.y + ')');
  });

  // 저장이 안 되는 이유 확인
  if (pageState.hasWarning) {
    console.log('[4] 경고: 플로우에 트리거와 액션이 모두 필요합니다');
  }

  // 현재 열린 패널/대화상자 확인
  console.log('[5] 열린 패널 확인...');

  var openPanels = await page.evaluate(function() {
    var panels = document.querySelectorAll('[role="dialog"], [class*="panel"], [class*="Panel"]');
    var result = [];

    panels.forEach(function(p) {
      var rect = p.getBoundingClientRect();
      if (rect.width > 200 && rect.height > 100) {
        result.push({
          text: (p.innerText || '').substring(0, 100),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
    });

    return result.slice(0, 5);
  });

  console.log('   열린 패널:', openPanels.length > 0 ? openPanels[0].text.substring(0, 80) : '없음');

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
