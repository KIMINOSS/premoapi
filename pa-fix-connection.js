/**
 * PA - 기존 플로우 Gmail 연결 수정
 * Edge 종료하지 않음
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🔧 PA 플로우 Gmail 연결 수정...\n');

  const userDataDir = 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data';

  // 기존 Edge 종료하지 않고 새 컨텍스트로 연결
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'msedge',
    args: ['--start-maximized'],
    viewport: { width: 1400, height: 900 }
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. My flows로 이동
    console.log('[1] My flows 이동...');
    await page.goto('https://make.powerautomate.com/manage/flows', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/fix1.png' });

    // 2. 최근 만든 플로우 찾기
    console.log('[2] 플로우 찾기...');
    const flows = ['PREMO-Auth-Forward', 'PREMO-Email-Forward', 'PREMO-Gmail'];

    for (const flowName of flows) {
      const flow = page.locator(`text=${flowName}`).first();
      if (await flow.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`   플로우 발견: ${flowName}`);
        await flow.click();
        await page.waitForTimeout(3000);
        break;
      }
    }

    // ESC로 패널 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/fix2.png' });

    // 3. Edit 클릭
    console.log('[3] Edit...');
    const editBtn = page.locator('button:has-text("Edit")').first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(8000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/fix3.png' });

    // 4. 연결 문제 해결 - Connections 확인
    console.log('[4] 연결 문제 확인...');

    // "Fix connection" 또는 "Sign in" 버튼 찾기
    const fixConnection = page.locator('text=/Fix connection|연결 수정|Sign in|로그인/i').first();
    if (await fixConnection.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('   연결 수정 버튼 발견 - 클릭');
      await fixConnection.click();
      await page.waitForTimeout(5000);
    }

    // 트리거 카드 클릭해서 연결 상태 확인
    const triggerCard = page.locator('[class*="msla-panel-card"]').first();
    if (await triggerCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await triggerCard.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/fix4.png' });

    // 5. Gmail Sign in
    console.log('[5] Gmail Sign in...');
    const signInBtn = page.locator('button:has-text("Sign in"), [aria-label*="Sign in"]').first();
    if (await signInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('   Sign in 클릭...');
      await signInBtn.click();
      await page.waitForTimeout(8000);

      // Google 팝업 처리
      const allPages = context.pages();
      console.log(`   페이지 수: ${allPages.length}`);

      for (const p of allPages) {
        const pUrl = p.url();
        if (pUrl.includes('accounts.google.com')) {
          console.log('   Google 로그인 페이지');

          // 계정 선택 또는 입력
          const account = p.locator('div[data-email="authpremoapi@gmail.com"], text=authpremoapi@gmail.com').first();
          if (await account.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('   계정 선택: authpremoapi@gmail.com');
            await account.click();
          } else {
            const emailInput = p.locator('input[type="email"]').first();
            if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
              await emailInput.fill('authpremoapi@gmail.com');
              await p.locator('button:has-text("Next")').first().click();
            }
          }
          await page.waitForTimeout(5000);
          await p.screenshot({ path: '/home/kogh/.playwright-mcp/fix-google.png' });
        }
      }
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/fix5.png' });

    // 6. 저장
    console.log('[6] Save...');
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/fix-done.png' });

    console.log('\n✅ 연결 수정 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/fix-err.png' });
  }

  console.log('\n⏳ 브라우저 300초 유지 (수동 작업 가능)...');
  await page.waitForTimeout(300000);
  await context.close();
}

main();
