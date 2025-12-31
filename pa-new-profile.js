/**
 * PA Gmail 플로우 - 별도 Edge 프로필 사용
 * 기존 Edge 닫지 않음
 */
const { chromium } = require('playwright');
const path = require('path');
const os = require('os');

async function main() {
  console.log('🚀 PA Gmail→Outlook 플로우 (새 프로필)...\n');

  // 임시 프로필 디렉토리
  const tempProfile = path.join(os.tmpdir(), 'pa-edge-temp-' + Date.now());
  console.log(`   임시 프로필: ${tempProfile}\n`);

  const browser = await chromium.launch({
    headless: false,
    channel: 'msedge',
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  try {
    // 1. PA 페이지 이동
    console.log('[1] Power Automate...');
    await page.goto('https://make.powerautomate.com', { timeout: 60000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pn1.png' });

    const url = page.url();
    console.log(`   URL: ${url}`);

    // Microsoft 로그인 필요 여부 확인
    if (url.includes('login.microsoftonline.com') || url.includes('login.live.com')) {
      console.log('\n⚠️ Microsoft 로그인 필요');
      console.log('   새 프로필이라 로그인 세션 없음');

      // koghm@grupopremo.com 로그인 시도
      console.log('[2] 로그인 시도...');

      const emailInput = page.locator('input[type="email"], input[name="loginfmt"]').first();
      if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await emailInput.fill('koghm@grupopremo.com');
        await page.waitForTimeout(1000);

        const nextBtn = page.locator('input[type="submit"], button[type="submit"]').first();
        if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(3000);
        }
      }

      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pn2.png' });

      // 비밀번호 페이지
      const pwdInput = page.locator('input[type="password"], input[name="passwd"]').first();
      if (await pwdInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('   비밀번호 입력 필요...');
        console.log('   ⏳ 60초 대기 (수동 입력)...');
        await page.waitForTimeout(60000);
      }

      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pn3.png' });
    }

    // 로그인 후 PA 접근
    console.log('[3] PA 페이지 확인...');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`   현재 URL: ${currentUrl}`);

    if (currentUrl.includes('powerautomate.com')) {
      console.log('   ✅ PA 접근 성공');

      // Create 페이지로 이동
      await page.goto('https://make.powerautomate.com/create', { timeout: 60000 });
      await page.waitForTimeout(5000);

      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pn4.png' });

      // Automated cloud flow
      console.log('[4] Automated cloud flow...');
      const autoFlow = page.locator('text=Automated cloud flow').first();
      if (await autoFlow.isVisible({ timeout: 10000 }).catch(() => false)) {
        await autoFlow.click();
        await page.waitForTimeout(4000);
      }

      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pn5.png' });

      // ... 이후 플로우 생성 로직
      console.log('[5] 플로우 이름 입력...');
      const nameInput = page.locator('input').first();
      if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nameInput.fill('PREMO-Gmail-Forward');
      }

      // Gmail 검색
      console.log('[6] Gmail 검색...');
      const searchInputs = await page.locator('input[placeholder*="Search"], input[placeholder*="search"]').all();
      for (const input of searchInputs) {
        if (await input.isVisible().catch(() => false)) {
          await input.fill('Gmail');
          await page.waitForTimeout(2000);
          break;
        }
      }

      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pn6.png' });
    }

    console.log('\n📌 현재 상태 저장됨');
    console.log('   스크린샷: pn1.png ~ pn6.png');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pn-error.png' });
  }

  console.log('\n⏳ 브라우저 300초 유지...');
  await page.waitForTimeout(300000);
  await browser.close();
}

main();
