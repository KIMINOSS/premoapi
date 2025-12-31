const { chromium } = require('playwright');

async function main() {
  console.log('Edge 연결...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  page.on('dialog', async function(dialog) {
    await dialog.dismiss().catch(function() {});
  });

  console.log('[1] ESC로 현재 패널 닫기...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'C:\\temp\\pa-closed-panel.png' });

  console.log('[2] + 버튼 aria-label로 찾기...');

  var insertBtn = page.locator('button[aria-label*="Insert a new action"]');
  var isVisible = await insertBtn.isVisible().catch(function() { return false; });

  if (isVisible) {
    console.log('   + 버튼 발견! 클릭...');
    await insertBtn.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'C:\\temp\\pa-insert-clicked2.png' });

    // 메뉴가 열렸는지 확인
    var menuText = await page.evaluate(function() {
      return document.body.innerText.substring(0, 500);
    });

    console.log('   메뉴 내용:', menuText.substring(0, 200));

    // Add an action 버튼 클릭
    console.log('[3] Add an action 클릭...');
    var addActionLink = page.locator('text=Add an action').first();
    isVisible = await addActionLink.isVisible().catch(function() { return false; });

    if (isVisible) {
      await addActionLink.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'C:\\temp\\pa-action-panel.png' });

    // 검색 패널이 열렸는지 확인
    console.log('[4] 검색 필드 찾기...');

    var searchField = page.locator('input[placeholder*="Search"]').first();
    isVisible = await searchField.isVisible().catch(function() { return false; });

    if (isVisible) {
      console.log('   검색 필드 발견!');
      await searchField.click();
      await page.waitForTimeout(300);

      // 한 글자씩 입력
      console.log('[5] "Data Operations" 검색...');
      await page.keyboard.type('Data Operations', { delay: 100 });
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'C:\\temp\\pa-data-ops-search.png' });

      // 검색 결과 클릭
      console.log('[6] Data Operations 클릭...');

      var dataOpsItem = page.locator('text=Data Operations').first();
      isVisible = await dataOpsItem.isVisible().catch(function() { return false; });

      if (isVisible) {
        await dataOpsItem.click();
        console.log('   Data Operations 클릭됨');
        await page.waitForTimeout(2000);
      }

      await page.screenshot({ path: 'C:\\temp\\pa-data-ops-selected.png' });

      // Compose 선택
      console.log('[7] Compose 선택...');

      var composeBtn = page.locator('text=Compose').first();
      isVisible = await composeBtn.isVisible().catch(function() { return false; });

      if (isVisible) {
        await composeBtn.click();
        console.log('   Compose 클릭됨');
        await page.waitForTimeout(3000);
      }

      await page.screenshot({ path: 'C:\\temp\\pa-compose-final.png' });
    }
  } else {
    console.log('   + 버튼 미발견. 페이지 스크롤 시도...');
  }

  console.log('[8] 액션 추가 확인...');

  var hasAction = await page.evaluate(function() {
    var text = document.body.innerText;
    return {
      hasCompose: text.indexOf('Compose') >= 0 && (text.indexOf('Inputs') >= 0 || text.indexOf('Input') >= 0),
      stillNeedsAction: text.indexOf('should contain at least one trigger and one action') >= 0
    };
  });

  console.log('   결과:', hasAction);

  if (!hasAction.stillNeedsAction) {
    console.log('[9] 플로우 저장...');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await page.keyboard.down('Control');
    await page.keyboard.press('s');
    await page.keyboard.up('Control');

    await page.waitForTimeout(15000);

    console.log('   최종 URL:', page.url());
  }

  await page.screenshot({ path: 'C:\\temp\\pa-direct-add-final.png' });

  await browser.close();
}

main().catch(function(e) { console.error('오류:', e.message); });
