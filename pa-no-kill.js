/**
 * PA 플로우 Gmail 연결 - Edge 닫지 않음
 * 별도 임시 프로필 사용
 */
const { chromium } = require('playwright');
const path = require('path');
const os = require('os');

async function main() {
  console.log('🔧 PA Gmail 연결 (기존 Edge 유지)...\n');

  // 임시 프로필 사용 (기존 Edge 안 닫음)
  const tempProfileDir = path.join(os.tmpdir(), 'pa-edge-profile');

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
    // 1. PA 로그인 페이지
    console.log('[1] Power Automate 이동...');
    await page.goto('https://make.powerautomate.com', { timeout: 60000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-nk1.png' });

    const url = page.url();
    console.log(`   URL: ${url}`);

    // 로그인 필요 여부 확인
    if (url.includes('login') || url.includes('microsoftonline')) {
      console.log('\n⚠️ Microsoft 로그인 필요');
      console.log('   새 브라우저라 로그인 세션 없음');
      console.log('\n📌 해결 방법:');
      console.log('   1. 기존 Edge에서 직접 PA 플로우 수정');
      console.log('   2. 또는 잠시 기존 Edge 닫고 자동화 진행');

      // 로그인 시도
      console.log('\n[2] 로그인 시도...');

      // 이메일 입력 확인
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await emailInput.fill('authpremoapi@gmail.com');
        await page.waitForTimeout(1000);

        const nextBtn = page.locator('input[type="submit"], button:has-text("Next")').first();
        if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(3000);
        }
      }

      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-nk2.png' });
    } else {
      console.log('   PA 페이지 접근 가능');

      // My flows로 이동
      console.log('[2] My flows...');
      await page.goto('https://make.powerautomate.com/manage/flows', { timeout: 60000 });
      await page.waitForTimeout(5000);

      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-nk2.png' });

      // 플로우 찾기
      console.log('[3] 플로우 검색...');
      const flows = ['PREMO-Auth-Forward', 'PREMO-Email', 'PREMO-Gmail'];

      for (const flowName of flows) {
        const flow = page.locator(`text=${flowName}`).first();
        if (await flow.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log(`   발견: ${flowName}`);
        }
      }

      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-nk3.png' });
    }

    console.log('\n✅ 스크린샷 저장됨');
    console.log('   pa-nk1.png ~ pa-nk3.png');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-nk-error.png' });
  }

  console.log('\n⏳ 브라우저 120초 유지...');
  await page.waitForTimeout(120000);
  await browser.close();
}

main();
