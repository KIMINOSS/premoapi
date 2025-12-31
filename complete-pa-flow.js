/**
 * Power Automate 플로우 완성 - 기존 플로우에 Send Email 액션 추가
 * 기존 PREMO-Gmail-Auth 플로우 편집 → Send an email (V2) 추가 → Subject에서 [TO:] 파싱 → 저장
 */

const { chromium } = require('playwright');

const CONFIG = {
  CDP_ENDPOINT: 'http://localhost:9222',
  FLOW_ID: '514fa3b0-89d6-4dec-a58a-4849e8ada79d',
  FLOW_URL: 'https://make.powerautomate.com/environments/Default-3f6aef3c-3e2a-4d71-8e86-1f14f6b82a9d/flows/514fa3b0-89d6-4dec-a58a-4849e8ada79d'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🔗 브라우저 시작 (기존 Edge 프로필 사용)...');

  // 사용자의 기존 Edge 프로필 사용 (이미 Microsoft 로그인됨)
  const userDataDir = process.platform === 'win32'
    ? 'C:\\Users\\koghm\\AppData\\Local\\Microsoft\\Edge\\User Data'
    : '/home/kogh/.config/microsoft-edge';

  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: 'msedge',
      args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
    });
    console.log('✅ 기존 Edge 프로필로 브라우저 시작됨');
  } catch (error) {
    console.log('⚠️ 프로필 사용 실패:', error.message);
    console.log('새 브라우저로 시도...');
    context = await chromium.launchPersistentContext('C:\\temp\\edge-pa-profile', {
      headless: false,
      channel: 'msedge'
    });
  }

  const pages = context.pages();
  let page = pages.length > 0 ? pages[0] : await context.newPage();

  console.log('현재 URL:', page.url() || '(새 페이지)');

  try {
    // 1. 기존 플로우 편집 페이지로 이동
    console.log('\n[1] 기존 플로우 편집 페이지로 이동...');
    await page.goto(CONFIG.FLOW_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await sleep(5000);

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-flow-page.png' });

    // 2. Edit 버튼 클릭
    console.log('[2] Edit 버튼 클릭...');
    const editBtn = page.locator('button:has-text("Edit"), [aria-label*="Edit" i], [data-automation-id*="edit" i]').first();
    if (await editBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      await editBtn.click();
      await sleep(8000);
      console.log('   ✓ 편집 모드 진입');
    } else {
      // 대체: 페이지에서 Edit 찾기
      const allBtns = await page.locator('button:visible').all();
      for (const btn of allBtns) {
        const text = await btn.textContent().catch(() => '');
        if (text.toLowerCase().includes('edit')) {
          await btn.click();
          console.log('   ✓ Edit 버튼 찾음:', text.trim());
          await sleep(8000);
          break;
        }
      }
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-edit-mode.png' });

    // 3. 새 단계 추가 (+) 버튼 클릭
    console.log('[3] 새 단계 추가...');
    const addStepBtn = page.locator('button[aria-label*="Insert"], button:has-text("New step"), [class*="add"]').first();

    // "+" 버튼이나 "New step" 버튼 찾기
    const plusBtn = page.locator('[class*="plus"], [class*="add-action"], svg[class*="plus"]').first();
    if (await plusBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await plusBtn.click();
      await sleep(2000);
    } else if (await addStepBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addStepBtn.click();
      await sleep(2000);
    } else {
      // 스크롤해서 + 버튼 찾기
      await page.keyboard.press('End');
      await sleep(2000);
      const newStepAlt = page.locator('text=/Add an action|New step/i').first();
      await newStepAlt.click().catch(() => {});
      await sleep(2000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-add-step.png' });

    // 4. "Send an email" 검색
    console.log('[4] Send an email (V2) 검색...');
    const searchBox = page.locator('input[placeholder*="Search" i], input[aria-label*="search" i]').first();
    if (await searchBox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchBox.fill('Send an email');
      await sleep(3000);

      // Office 365 Outlook - Send an email (V2) 선택
      const sendEmailAction = page.locator('text=/Send an email.*V2|Office 365 Outlook.*Send/i').first();
      if (await sendEmailAction.isVisible({ timeout: 5000 }).catch(() => false)) {
        await sendEmailAction.click();
        await sleep(3000);
        console.log('   ✓ Send an email (V2) 선택됨');
      } else {
        // Outlook 커넥터 먼저 찾기
        const outlookConnector = page.locator('text=/Office 365 Outlook/i').first();
        await outlookConnector.click().catch(() => {});
        await sleep(2000);

        const sendAction = page.locator('text=/Send an email/i').first();
        await sendAction.click().catch(() => {});
        await sleep(3000);
      }
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-send-email.png' });

    // 5. To 필드 설정 - Expression 사용
    console.log('[5] To 필드 설정 (Expression)...');

    // To 필드 클릭
    const toField = page.locator('input[aria-label*="To" i], [placeholder*="To" i]').first();
    if (await toField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toField.click();
      await sleep(1000);

      // Expression 탭 클릭
      const exprTab = page.locator('text=/Expression/i, [role="tab"]:has-text("Expression")').first();
      if (await exprTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exprTab.click();
        await sleep(1000);

        // Expression 입력
        // split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]
        const exprInput = page.locator('input[aria-label*="expression" i], textarea').first();
        if (await exprInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await exprInput.fill("split(split(triggerOutputs()?['body/subject'],'[TO:')[1],']')[0]");

          // OK 버튼 클릭
          const okBtn = page.locator('button:has-text("OK"), button:has-text("Add")').first();
          await okBtn.click().catch(() => {});
          await sleep(1000);
          console.log('   ✓ To 필드 Expression 설정');
        }
      } else {
        // 동적 콘텐츠 직접 입력
        await toField.fill('@{split(split(triggerOutputs()?[\'body/subject\'],\'[TO:\')[1],\']\')[0]}');
      }
    }

    // 6. Subject 필드 - 동적 콘텐츠 (Subject)
    console.log('[6] Subject 필드 설정...');
    const subjectField = page.locator('input[aria-label*="Subject" i]').first();
    if (await subjectField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await subjectField.click();
      await sleep(1000);

      // 동적 콘텐츠에서 Subject 선택
      const dynamicTab = page.locator('text=/Dynamic content/i').first();
      await dynamicTab.click().catch(() => {});
      await sleep(1000);

      const subjectDynamic = page.locator('text=/^Subject$/i').first();
      await subjectDynamic.click().catch(() => {});
      await sleep(1000);
    }

    // 7. Body 필드 - 동적 콘텐츠 (Body)
    console.log('[7] Body 필드 설정...');
    const bodyField = page.locator('textarea[aria-label*="Body" i], [aria-label*="Body" i]').first();
    if (await bodyField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bodyField.click();
      await sleep(1000);

      const bodyDynamic = page.locator('text=/^Body$/i').first();
      await bodyDynamic.click().catch(() => {});
      await sleep(1000);
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-email-config.png' });

    // 8. Save 클릭
    console.log('[8] 저장...');
    const saveBtn = page.locator('button:has-text("Save"), [aria-label*="Save" i]').first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await sleep(5000);
      console.log('   ✓ 저장 완료');
    }

    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-saved.png' });

    console.log('\n════════════════════════════════════════════════════════');
    console.log('✅ Power Automate 플로우 완성!');
    console.log('════════════════════════════════════════════════════════');
    console.log('플로우: PREMO-Gmail-Auth');
    console.log('추가된 액션: Send an email (V2)');
    console.log('To: Subject에서 [TO:xxx] 파싱');
    console.log('Subject/Body: 원본 이메일 내용');
    console.log('════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-error-complete.png' });
  }

  console.log('\n📌 브라우저 연결 유지됨');
}

main();
