const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  console.log('[1] From 레이블 근처 입력 필드 찾기...');

  // From 레이블 위치: y=553
  // 그 근처의 입력 필드를 찾아 클릭
  var fromInputInfo = await page.evaluate(function() {
    var labels = document.querySelectorAll('label, span, div');
    var fromLabel = null;

    for (var i = 0; i < labels.length; i++) {
      var text = labels[i].innerText.trim();
      if (text === 'From' || text === 'From *') {
        fromLabel = labels[i];
        break;
      }
    }

    if (!fromLabel) return null;

    var labelRect = fromLabel.getBoundingClientRect();

    // From 레이블 아래 또는 옆에 있는 입력 필드 찾기
    var inputs = document.querySelectorAll('input, [contenteditable], [role="textbox"]');
    var nearestInput = null;
    var minDist = 9999;

    inputs.forEach(function(inp) {
      var rect = inp.getBoundingClientRect();
      // 레이블 아래에 있고, x 좌표가 비슷한 입력 필드
      if (rect.y >= labelRect.y && rect.y < labelRect.y + 100) {
        var dist = Math.abs(rect.x - labelRect.x) + Math.abs(rect.y - labelRect.y);
        if (dist < minDist) {
          minDist = dist;
          nearestInput = {
            x: Math.round(rect.x + rect.width / 2),
            y: Math.round(rect.y + rect.height / 2),
            tag: inp.tagName,
            id: inp.id || '',
            placeholder: inp.placeholder || ''
          };
        }
      }
    });

    return nearestInput;
  });

  console.log('   From 입력 필드:', fromInputInfo);

  if (fromInputInfo) {
    console.log('[2] From 필드 클릭...');
    await page.mouse.click(fromInputInfo.x, fromInputInfo.y);
    await page.waitForTimeout(500);

    console.log('[3] 이메일 주소 입력: onboarding@resend.dev');
    await page.keyboard.type('onboarding@resend.dev');
    await page.waitForTimeout(1000);
  } else {
    // 대안: From 레이블 y=553 기준으로 아래쪽 입력 필드 좌표 추정
    console.log('[2] 대안: 추정 좌표로 클릭 (From 레이블 y=553 기준)...');

    // 일반적으로 입력 필드는 레이블 아래 약 30-50px에 위치
    await page.mouse.click(300, 580);
    await page.waitForTimeout(500);

    console.log('[3] 이메일 주소 입력: onboarding@resend.dev');
    await page.keyboard.type('onboarding@resend.dev');
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: 'C:\\temp\\pa-from-filled.png' });

  console.log('[4] 입력 확인...');

  // 입력값 확인
  var inputValue = await page.evaluate(function() {
    var inputs = document.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].value.indexOf('resend') >= 0 || inputs[i].value.indexOf('onboarding') >= 0) {
        return inputs[i].value;
      }
    }
    return null;
  });

  console.log('   입력된 값:', inputValue);

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
