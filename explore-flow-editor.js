const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  console.log('[1] 현재 플로우 에디터 상태...');
  await page.screenshot({ path: 'C:\\temp\\pa-flow-state-1.png' });

  console.log('[2] 페이지 내 모든 텍스트 요소 분석...');

  // 주요 UI 요소 분석
  var uiElements = await page.evaluate(function() {
    var result = {
      headings: [],
      labels: [],
      buttons: []
    };

    // 제목/헤딩
    document.querySelectorAll('h1, h2, h3, h4, [role="heading"]').forEach(function(h) {
      var text = h.innerText.trim();
      if (text) result.headings.push(text.substring(0, 50));
    });

    // 레이블
    document.querySelectorAll('label, [class*="label"], [class*="Label"]').forEach(function(l) {
      var text = l.innerText.trim();
      if (text && text.length < 50) result.labels.push(text);
    });

    // 버튼
    document.querySelectorAll('button').forEach(function(b) {
      var text = b.innerText.trim();
      var rect = b.getBoundingClientRect();
      if (text && rect.width > 30) {
        result.buttons.push({ text: text.substring(0, 30), y: Math.round(rect.y) });
      }
    });

    return result;
  });

  console.log('   헤딩:', uiElements.headings.slice(0, 10));
  console.log('   레이블:', uiElements.labels.slice(0, 15));
  console.log('   버튼:', uiElements.buttons.slice(0, 15));

  // 연결 설정 필요 여부 확인
  console.log('[3] 연결 설정 확인...');

  var connectionPrompt = await page.locator('text=Sign in').first().isVisible().catch(function() { return false; });
  var addConnection = await page.locator('text=Add new connection').first().isVisible().catch(function() { return false; });
  var createConnection = await page.locator('text=Create').first().isVisible().catch(function() { return false; });

  console.log('   Sign in 버튼:', connectionPrompt);
  console.log('   Add new connection:', addConnection);
  console.log('   Create 버튼:', createConnection);

  // 트리거 설정 영역 찾기
  console.log('[4] 트리거 설정 영역 탐색...');

  // Folder, From, Subject 등 필터 필드 찾기
  var filterFields = await page.evaluate(function() {
    var fields = [];
    var allText = document.body.innerText;

    // Office 365 Outlook 트리거 설정 필드 이름들
    var fieldNames = ['Folder', 'From', 'Subject', 'To', 'Include Attachments', 'Importance'];
    fieldNames.forEach(function(name) {
      if (allText.indexOf(name) >= 0) {
        fields.push(name);
      }
    });

    return fields;
  });

  console.log('   발견된 필터 필드:', filterFields);

  await page.screenshot({ path: 'C:\\temp\\pa-flow-state-2.png' });

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
