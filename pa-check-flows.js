/**
 * PA My Flows 확인 및 플로우 생성/수정
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
    console.log('⚠️ Edge 프로필 충돌 - 기존 Edge 닫고 다시 실행 필요');
    process.exit(1);
  }

  const page = context.pages()[0] || await context.newPage();

  try {
    // 1. My flows 페이지
    console.log('[1] My flows 이동...');
    await page.goto('https://make.powerautomate.com/manage/flows', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pch1.png' });

    // 2. 기존 플로우 확인
    console.log('[2] 기존 플로우 검색...');
    const flowNames = ['PREMO-Gmail-Forward', 'PREMO-Auth-Forward', 'PREMO-Gmail', 'PREMO-Email'];
    let foundFlow = null;

    for (const name of flowNames) {
      const flow = page.locator(`text=${name}`).first();
      if (await flow.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`   ✓ 발견: ${name}`);
        foundFlow = name;
        break;
      }
    }

    if (!foundFlow) {
      console.log('   기존 PREMO 플로우 없음 - 새로 생성 필요');

      // 3. Create 페이지로 이동
      console.log('[3] Create 페이지...');
      await page.goto('https://make.powerautomate.com/create', { timeout: 60000 });
      await page.waitForTimeout(5000);
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pch2.png' });

      // 4. Automated cloud flow 선택
      console.log('[4] Automated cloud flow...');
      const autoFlow = page.locator('text=Automated cloud flow').first();
      if (await autoFlow.isVisible({ timeout: 10000 }).catch(() => false)) {
        await autoFlow.click();
        await page.waitForTimeout(4000);
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pch3.png' });

      // 5. 플로우 이름
      console.log('[5] 플로우 이름: PREMO-Gmail-Forward...');
      const nameInput = page.locator('input[placeholder*="name"], input[aria-label*="name"]').first();
      if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nameInput.fill('PREMO-Gmail-Forward');
      } else {
        const firstInput = page.locator('input').first();
        if (await firstInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstInput.fill('PREMO-Gmail-Forward');
        }
      }

      // 6. Gmail 검색
      console.log('[6] Gmail 트리거 검색...');
      const searchBox = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
      if (await searchBox.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchBox.fill('Gmail');
        await page.waitForTimeout(3000);
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pch4.png' });

      // 7. Gmail 선택
      console.log('[7] Gmail 커넥터...');
      const gmailOption = page.locator('[aria-label*="Gmail"], img[alt*="Gmail"], text=Gmail').first();
      if (await gmailOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await gmailOption.click();
        await page.waitForTimeout(2000);
      }

      // 8. When a new email arrives
      console.log('[8] When a new email arrives...');
      const trigger = page.locator('text=/When a new email arrives/i').first();
      if (await trigger.isVisible({ timeout: 5000 }).catch(() => false)) {
        await trigger.click();
        await page.waitForTimeout(2000);
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pch5.png' });

      // 9. Create 버튼
      console.log('[9] Create 버튼...');
      const createBtn = page.locator('button:has-text("Create")').last();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        const disabled = await createBtn.isDisabled();
        if (!disabled) {
          await createBtn.click();
          console.log('   Create 클릭됨');
          await page.waitForTimeout(10000);
        } else {
          console.log('   Create 버튼 비활성화 - 트리거 선택 필요');
        }
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pch6.png' });

    } else {
      // 기존 플로우 편집
      console.log(`[3] ${foundFlow} 편집...`);
      const flowLink = page.locator(`text=${foundFlow}`).first();
      await flowLink.click();
      await page.waitForTimeout(3000);

      // Edit 버튼
      const editBtn = page.locator('button:has-text("Edit")').first();
      if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(5000);
      }
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pch-edit.png' });
    }

    console.log('\n📌 현재 상태 저장됨');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pch-error.png' });
  }

  console.log('\n⏳ 브라우저 300초 유지...');
  await page.waitForTimeout(300000);
  await context.close();
}

main();
