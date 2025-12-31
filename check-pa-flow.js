/**
 * Power Automate 플로우 상태 확인 및 스크린샷
 */
const { chromium } = require('playwright');

const FLOW_URL = 'https://make.powerautomate.com/environments/Default-3f6aef3c-3e2a-4d71-8e86-1f14f6b82a9d/flows/514fa3b0-89d6-4dec-a58a-4849e8ada79d';

async function main() {
  console.log('🔍 Power Automate 플로우 상태 확인...');

  const userDataDir = 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data';

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'msedge',
    args: ['--start-maximized']
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    // 플로우 페이지로 이동
    await page.goto(FLOW_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);

    // 스크린샷 저장
    await page.screenshot({ path: 'C:\\Users\\koghm\\pa-flow-status.png', fullPage: true });
    console.log('📸 스크린샷 저장: pa-flow-status.png');

    // Run History 클릭해서 실행 기록 확인
    const runHistoryTab = page.locator('text=/Run history|28-day run history/i').first();
    if (await runHistoryTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await runHistoryTab.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'C:\\Users\\koghm\\pa-run-history.png', fullPage: true });
      console.log('📸 실행 기록 스크린샷: pa-run-history.png');
    }

    // Edit 클릭해서 플로우 구조 확인
    const editBtn = page.locator('button:has-text("Edit")').first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(8000);
      await page.screenshot({ path: 'C:\\Users\\koghm\\pa-flow-design.png', fullPage: true });
      console.log('📸 플로우 디자인 스크린샷: pa-flow-design.png');

      // 플로우에 있는 모든 액션 카드 확인
      const cards = await page.locator('[class*="card"], [class*="node"], [class*="action"]').all();
      console.log(`\n플로우 액션 수: ${cards.length}`);

      // 텍스트 내용 출력
      for (let i = 0; i < Math.min(cards.length, 10); i++) {
        const text = await cards[i].textContent().catch(() => '');
        if (text && text.trim()) {
          console.log(`  ${i + 1}. ${text.substring(0, 100).trim()}`);
        }
      }
    }

    console.log('\n✅ 확인 완료');

  } catch (error) {
    console.error('❌ 오류:', error.message);
  }

  await page.waitForTimeout(5000);
  await context.close();
}

main();
