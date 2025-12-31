/**
 * PA 플로우 확인 및 테스트
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🔍 PA 플로우 확인...\n');

  const userDataDir = 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data';

  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: 'msedge',
      args: ['--start-maximized'],
      viewport: { width: 1400, height: 900 }
    });
  } catch (err) {
    console.log('⚠️ Edge 프로필 충돌');
    process.exit(1);
  }

  const page = context.pages()[0] || await context.newPage();

  try {
    // My flows 페이지 이동
    console.log('[1] My flows 이동...');
    await page.goto('https://make.powerautomate.com/manage/flows', { timeout: 60000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pvf1.png' });

    // 플로우 목록 확인
    console.log('[2] 플로우 목록 확인...');
    const flowNames = ['PREMO-Gmail-Relay', 'PREMO-Gmail-Forward', 'PREMO-Gmail', 'PREMO-Gmail-Auth'];

    for (const name of flowNames) {
      const flow = page.locator(`text=${name}`).first();
      if (await flow.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`   ✓ ${name} 존재`);
      }
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pvf2.png' });

    console.log('\n📌 플로우 목록 캡처됨');

  } catch (error) {
    console.error('❌ 오류:', error.message);
  }

  console.log('\n⏳ 브라우저 60초 유지...');
  await page.waitForTimeout(60000);
  await context.close();
}

main();
