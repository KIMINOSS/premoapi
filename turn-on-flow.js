const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    await dialog.dismiss().catch(function() {});
  });

  console.log('URL:', page.url());
  await page.screenshot({ path: 'C:\\temp\\turnon-1.png' });

  console.log('[1] 현재 플로우 상태 확인...');

  var flowState = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasCompose: text.indexOf('Compose') >= 0,
      hasTrigger: text.indexOf('When a new email arrives') >= 0,
      isOff: text.indexOf('Your flow is off') >= 0 || text.indexOf('Turn on') >= 0,
      hasTestBtn: text.indexOf('Test') >= 0
    };
  });

  console.log('   상태:', flowState);

  if (flowState.isOff) {
    console.log('[2] Turn on 버튼 찾기...');

    var turnOnBtn = await page.evaluate(function() {
      var buttons = document.querySelectorAll('button');
      for (var i = 0; i < buttons.length; i++) {
        var t = (buttons[i].innerText || '').trim();
        var ariaLabel = buttons[i].getAttribute('aria-label') || '';
        var rect = buttons[i].getBoundingClientRect();

        if ((t === 'Turn on' || ariaLabel.indexOf('Turn on') >= 0) && rect.width > 30) {
          return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2), text: t };
        }
      }
      return null;
    });

    console.log('   Turn on 버튼:', turnOnBtn);

    if (turnOnBtn) {
      await page.mouse.click(turnOnBtn.x, turnOnBtn.y);
      console.log('   Turn on 클릭됨');
      await page.waitForTimeout(5000);
    } else {
      // 상단 툴바에서 찾기
      console.log('   상단 툴바 확인...');

      var toolbarBtns = await page.evaluate(function() {
        var result = [];
        var buttons = document.querySelectorAll('button');
        buttons.forEach(function(btn) {
          var rect = btn.getBoundingClientRect();
          if (rect.y < 120 && rect.y > 30) {
            result.push({
              text: (btn.innerText || '').substring(0, 20),
              ariaLabel: (btn.getAttribute('aria-label') || '').substring(0, 30),
              x: Math.round(rect.x + rect.width / 2),
              y: Math.round(rect.y + rect.height / 2)
            });
          }
        });
        return result;
      });

      console.log('   툴바 버튼들:');
      toolbarBtns.forEach(function(b) {
        console.log('    ', b.text || b.ariaLabel, 'at', b.x, b.y);
      });
    }
  }

  await page.screenshot({ path: 'C:\\temp\\turnon-2.png' });

  console.log('[3] 최종 상태 확인...');

  var finalState = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      isOn: text.indexOf('Your flow is on') >= 0 || (text.indexOf('Turn off') >= 0 && text.indexOf('Turn on') < 0),
      isOff: text.indexOf('Your flow is off') >= 0 || text.indexOf('Turn on') >= 0,
      flowName: 'PREMO-Gmail-Auth'
    };
  });

  console.log('   최종:', finalState);
  console.log('   URL:', page.url());

  await page.screenshot({ path: 'C:\\temp\\turnon-final.png' });

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
