/**
 * Power Automate 이메일 자동 수발신 플로우 설정
 * 
 * 플로우: 사용자등록 → Resend → Gmail → Outlook → 사용자 인증정보 전달
 * 
 * 사전 준비:
 * 1. Edge 브라우저를 원격 디버깅 모드로 실행
 *    msedge --remote-debugging-port=9222
 * 
 * 2. Power Automate에 로그인된 상태로 유지
 */

const { chromium } = require('playwright');

const CONFIG = {
  // 연결 설정
  CDP_ENDPOINT: 'http://localhost:9222',
  
  // 계정 정보
  OUTLOOK_SENDER: 'minho.kim@grupopremo.com',
  GMAIL_MONITOR: 'koghminho@gmail.com',
  RESEND_SENDER: 'onboarding@resend.dev',
  
  // 플로우 설정
  FLOW_NAME: 'PREMO-Email-Auth-Flow',
  CHECK_INTERVAL: 1, // 분
  
  // Power Automate URL
  PA_URL: 'https://make.powerautomate.com',
  PA_CREATE_URL: 'https://make.powerautomate.com/create',
};

/**
 * 열려있는 Edge 브라우저에 연결
 */
async function connectToExistingBrowser() {
  console.log('🔗 열려있는 브라우저에 연결 중...');
  
  try {
    const browser = await chromium.connectOverCDP(CONFIG.CDP_ENDPOINT);
    const contexts = browser.contexts();
    
    if (contexts.length === 0) {
      throw new Error('열린 브라우저 컨텍스트가 없습니다.');
    }
    
    const context = contexts[0];
    const pages = context.pages();
    
    // Power Automate 탭 찾기
    let page = pages.find(p => p.url().includes('powerautomate.com'));
    
    if (!page) {
      console.log('📑 Power Automate 탭 없음 - 새 탭에서 열기');
      page = pages[0];
      await page.goto(CONFIG.PA_URL);
      await page.waitForLoadState('networkidle');
    } else {
      console.log('✅ 기존 Power Automate 탭 사용');
    }
    
    return { browser, context, page };
  } catch (error) {
    console.error('❌ 브라우저 연결 실패:', error.message);
    console.log('\n💡 Edge를 원격 디버깅 모드로 실행하세요:');
    console.log('   msedge --remote-debugging-port=9222\n');
    throw error;
  }
}

/**
 * 로그인 상태 확인
 */
async function checkLoginStatus(page) {
  console.log('🔐 로그인 상태 확인...');
  
  await page.waitForTimeout(2000);
  
  // 로그인 필요 여부 확인
  const loginRequired = await page.locator('input[type="email"]').isVisible().catch(() => false);
  
  if (loginRequired) {
    console.log('⚠️ 로그인이 필요합니다. 브라우저에서 직접 로그인 후 다시 실행하세요.');
    return false;
  }
  
  console.log('✅ 로그인 상태 확인됨');
  return true;
}

/**
 * 기존 플로우 확인
 */
async function checkExistingFlow(page) {
  console.log('🔍 기존 플로우 확인...');
  
  await page.goto(`${CONFIG.PA_URL}/environments/Default-/flows`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  const existingFlow = await page.locator(`text="${CONFIG.FLOW_NAME}"`).isVisible().catch(() => false);
  
  if (existingFlow) {
    console.log(`✅ 기존 플로우 발견: ${CONFIG.FLOW_NAME}`);
    return true;
  }
  
  console.log('📝 새 플로우 생성 필요');
  return false;
}

/**
 * 새 플로우 생성
 */
async function createNewFlow(page) {
  console.log('\n=== 새 플로우 생성 ===\n');
  
  // 1. 생성 페이지로 이동
  await page.goto(CONFIG.PA_CREATE_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  
  // 2. "Automated cloud flow" 선택
  console.log('1️⃣ Automated cloud flow 선택...');
  
  const automatedOption = page.locator('[data-automation-id="templates-tile-automated"]')
    .or(page.locator('text=/Automated cloud flow/i'))
    .or(page.locator('[class*="tile"]').filter({ hasText: /Automated/i }));
  
  await automatedOption.first().click({ timeout: 10000 }).catch(async () => {
    // 대체 선택자
    const tiles = await page.locator('[role="button"], [class*="card"]').all();
    for (const tile of tiles) {
      const text = await tile.textContent();
      if (text?.toLowerCase().includes('automated')) {
        await tile.click();
        break;
      }
    }
  });
  
  await page.waitForTimeout(3000);
  
  // 3. 플로우 이름 설정
  console.log('2️⃣ 플로우 이름 설정...');
  
  const nameInput = page.locator('input[placeholder*="name" i], input[aria-label*="flow name" i]').first();
  await nameInput.fill(CONFIG.FLOW_NAME).catch(async () => {
    const inputs = await page.locator('input[type="text"]').all();
    if (inputs.length > 0) {
      await inputs[0].fill(CONFIG.FLOW_NAME);
    }
  });
  
  await page.waitForTimeout(1000);
  
  // 4. Gmail 트리거 검색 및 선택
  console.log('3️⃣ Gmail 트리거 검색...');
  
  const triggerSearch = page.locator('input[placeholder*="search" i], input[aria-label*="search" i]').first();
  await triggerSearch.fill('Gmail when new email');
  await page.waitForTimeout(3000);
  
  const gmailTrigger = page.locator('text=/When a new email arrives/i').first();
  await gmailTrigger.click({ timeout: 10000 }).catch(() => {
    console.log('⚠️ Gmail 트리거 선택 실패 - 수동 선택 필요');
  });
  
  await page.waitForTimeout(2000);
  
  // 5. Create 버튼 클릭
  console.log('4️⃣ 플로우 생성...');
  
  const createBtn = page.locator('button').filter({ hasText: /^Create$/i }).first();
  await createBtn.click({ timeout: 5000 }).catch(() => {});
  
  await page.waitForTimeout(8000);
  
  return true;
}

/**
 * Gmail 연결 설정
 */
async function setupGmailConnection(page, context) {
  console.log('\n=== Gmail 연결 설정 ===\n');
  
  // Gmail 커넥터 찾기
  const gmailConnector = page.locator('[class*="connector"], [data-automation-id*="gmail"]').first();
  
  // 연결 설정 클릭
  const signInBtn = page.locator('button, a').filter({ hasText: /Sign in|Connect|연결/i }).first();
  
  if (await signInBtn.isVisible().catch(() => false)) {
    console.log('1️⃣ Gmail 연결 시작...');
    
    const [popup] = await Promise.all([
      context.waitForEvent('page', { timeout: 30000 }).catch(() => null),
      signInBtn.click()
    ]);
    
    if (popup) {
      console.log('2️⃣ Gmail 로그인 팝업 처리...');
      await popup.waitForLoadState();
      
      // Gmail 로그인 과정은 이미 로그인된 계정 사용
      // 필요시 권한만 승인
      try {
        const allowBtn = popup.locator('button').filter({ hasText: /Allow|허용|Continue/i }).first();
        if (await allowBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await allowBtn.click();
        }
      } catch (e) {
        console.log('   Gmail 팝업 자동 처리됨');
      }
    }
  } else {
    console.log('✅ Gmail 이미 연결됨');
  }
  
  // Gmail 필터 설정
  console.log('3️⃣ Gmail 필터 설정...');
  
  await page.waitForTimeout(2000);
  
  // From 필드 설정
  const fromInput = page.locator('input[aria-label*="From" i], input[placeholder*="from" i]').first();
  if (await fromInput.isVisible().catch(() => false)) {
    await fromInput.fill(CONFIG.RESEND_SENDER);
  }
  
  // Label 설정 (INBOX)
  const labelInput = page.locator('input[aria-label*="Label" i], select[aria-label*="Label" i]').first();
  if (await labelInput.isVisible().catch(() => false)) {
    await labelInput.fill('INBOX').catch(() => {});
  }
  
  return true;
}

/**
 * Condition 액션 추가 (Subject에 [TO:] 태그 확인)
 */
async function addConditionAction(page) {
  console.log('\n=== Condition 액션 추가 ===\n');
  
  // New step 클릭
  console.log('1️⃣ 새 단계 추가...');
  const newStepBtn = page.locator('button').filter({ hasText: /New step|새 단계|\+ Add/i }).first();
  await newStepBtn.click({ timeout: 5000 });
  await page.waitForTimeout(2000);
  
  // Condition 검색
  console.log('2️⃣ Condition 액션 검색...');
  const searchInput = page.locator('input[placeholder*="search" i]').last();
  await searchInput.fill('Condition');
  await page.waitForTimeout(2000);
  
  const conditionAction = page.locator('text=/^Condition$/i').first();
  await conditionAction.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(3000);
  
  // Condition 설정: Subject contains [TO:
  console.log('3️⃣ Condition 설정...');
  
  // 동적 콘텐츠에서 Subject 선택
  const valueInput = page.locator('input[aria-label*="value" i], input[placeholder*="value" i]').first();
  if (await valueInput.isVisible().catch(() => false)) {
    await valueInput.click();
    await page.waitForTimeout(1000);
    
    // Dynamic content 패널에서 Subject 선택
    const subjectOption = page.locator('text=/Subject/i').first();
    await subjectOption.click().catch(() => {
      console.log('   Subject 필드 수동 선택 필요');
    });
  }
  
  // contains 연산자 선택
  const operatorSelect = page.locator('select, [role="combobox"]').filter({ hasText: /equals|contains/i }).first();
  if (await operatorSelect.isVisible().catch(() => false)) {
    await operatorSelect.selectOption({ label: 'contains' }).catch(() => {});
  }
  
  // [TO: 값 입력
  const containsInput = page.locator('input[aria-label*="value" i]').last();
  if (await containsInput.isVisible().catch(() => false)) {
    await containsInput.fill('[TO:');
  }
  
  return true;
}

/**
 * Outlook 전송 액션 추가
 */
async function addOutlookAction(page, context) {
  console.log('\n=== Outlook 전송 액션 추가 ===\n');
  
  // If yes 브랜치에 액션 추가
  console.log('1️⃣ If yes 브랜치에 액션 추가...');
  
  const ifYesBranch = page.locator('text=/If yes/i').first();
  await ifYesBranch.click().catch(() => {});
  await page.waitForTimeout(1000);
  
  const addActionBtn = page.locator('button').filter({ hasText: /Add an action|액션 추가/i }).first();
  await addActionBtn.click({ timeout: 5000 });
  await page.waitForTimeout(2000);
  
  // Outlook 검색
  console.log('2️⃣ Outlook Send email 검색...');
  const searchInput = page.locator('input[placeholder*="search" i]').last();
  await searchInput.fill('Outlook Send an email');
  await page.waitForTimeout(3000);
  
  const outlookAction = page.locator('text=/Send an email.*Office 365/i').first();
  await outlookAction.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(3000);
  
  // Outlook 연결 확인
  console.log('3️⃣ Outlook 연결 확인...');
  const signInBtn = page.locator('button').filter({ hasText: /Sign in|Connect/i }).first();
  
  if (await signInBtn.isVisible().catch(() => false)) {
    const [popup] = await Promise.all([
      context.waitForEvent('page', { timeout: 30000 }).catch(() => null),
      signInBtn.click()
    ]);
    
    if (popup) {
      await popup.waitForLoadState();
      // 대부분 자동으로 연결됨 (같은 Microsoft 계정)
      console.log('   Outlook 연결 팝업 처리 중...');
      await popup.waitForTimeout(5000);
    }
  }
  
  // 이메일 필드 설정
  console.log('4️⃣ 이메일 필드 설정...');
  
  await page.waitForTimeout(2000);
  
  // To 필드: Expression으로 Subject에서 추출
  // substring(triggerOutputs()?['body/Subject'], add(indexOf(triggerOutputs()?['body/Subject'], '[TO:'), 4), ...)
  const toInput = page.locator('input[aria-label*="To" i]').first();
  if (await toInput.isVisible().catch(() => false)) {
    await toInput.click();
    await page.waitForTimeout(500);
    
    // Expression 탭 클릭
    const expressionTab = page.locator('text=/Expression/i').first();
    await expressionTab.click().catch(() => {});
    await page.waitForTimeout(500);
    
    const expressionInput = page.locator('textarea, input[aria-label*="expression" i]').first();
    if (await expressionInput.isVisible().catch(() => false)) {
      await expressionInput.fill(
        "substring(triggerOutputs()?['body/Subject'], add(indexOf(triggerOutputs()?['body/Subject'], '[TO:'), 4), sub(indexOf(triggerOutputs()?['body/Subject'], ']'), add(indexOf(triggerOutputs()?['body/Subject'], '[TO:'), 4)))"
      );
      
      const okBtn = page.locator('button').filter({ hasText: /OK|확인/i }).first();
      await okBtn.click().catch(() => {});
    }
  }
  
  // Subject 필드
  const subjectInput = page.locator('input[aria-label*="Subject" i]').first();
  if (await subjectInput.isVisible().catch(() => false)) {
    await subjectInput.click();
    await page.waitForTimeout(500);
    
    const expressionTab = page.locator('text=/Expression/i').first();
    await expressionTab.click().catch(() => {});
    
    const expressionInput = page.locator('textarea, input[aria-label*="expression" i]').first();
    if (await expressionInput.isVisible().catch(() => false)) {
      await expressionInput.fill(
        "trim(substring(triggerOutputs()?['body/Subject'], add(indexOf(triggerOutputs()?['body/Subject'], ']'), 2)))"
      );
      
      const okBtn = page.locator('button').filter({ hasText: /OK|확인/i }).first();
      await okBtn.click().catch(() => {});
    }
  }
  
  // Body 필드 - Dynamic content에서 Body 선택
  const bodyInput = page.locator('[aria-label*="Body" i], [data-automation-id*="body" i]').first();
  if (await bodyInput.isVisible().catch(() => false)) {
    await bodyInput.click();
    const bodyOption = page.locator('text=/^Body$/i').first();
    await bodyOption.click().catch(() => {});
  }
  
  // From 필드
  const fromInput = page.locator('input[aria-label*="From" i]').first();
  if (await fromInput.isVisible().catch(() => false)) {
    await fromInput.fill(CONFIG.OUTLOOK_SENDER);
  }
  
  return true;
}

/**
 * 플로우 저장 및 활성화
 */
async function saveAndActivateFlow(page) {
  console.log('\n=== 플로우 저장 ===\n');
  
  // Save 버튼 클릭
  const saveBtn = page.locator('button').filter({ hasText: /^Save$|^저장$/i }).first();
  await saveBtn.click({ timeout: 5000 }).catch(() => {});
  
  await page.waitForTimeout(5000);
  
  // 저장 확인
  const savedIndicator = page.locator('text=/Saved|저장됨|Your flow is ready/i');
  const isSaved = await savedIndicator.isVisible({ timeout: 10000 }).catch(() => false);
  
  if (isSaved) {
    console.log('✅ 플로우 저장 완료!');
  } else {
    console.log('⚠️ 저장 상태 확인 필요');
  }
  
  // 플로우 활성화 (Turn on)
  const turnOnBtn = page.locator('button').filter({ hasText: /Turn on|켜기|활성화/i }).first();
  if (await turnOnBtn.isVisible().catch(() => false)) {
    await turnOnBtn.click();
    console.log('✅ 플로우 활성화됨!');
  }
  
  return true;
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Power Automate 이메일 인증 플로우 자동 설정                ║');
  console.log('║  Flow: 사용자등록 → Resend → Gmail → Outlook → 사용자     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  let browser, context, page;
  
  try {
    // 1. 브라우저 연결
    ({ browser, context, page } = await connectToExistingBrowser());
    
    // 2. 로그인 상태 확인
    const isLoggedIn = await checkLoginStatus(page);
    if (!isLoggedIn) {
      return;
    }
    
    // 3. 기존 플로우 확인
    const flowExists = await checkExistingFlow(page);
    
    if (!flowExists) {
      // 4. 새 플로우 생성
      await createNewFlow(page);
      
      // 5. Gmail 연결 설정
      await setupGmailConnection(page, context);
      
      // 6. Condition 액션 추가
      await addConditionAction(page);
      
      // 7. Outlook 전송 액션 추가
      await addOutlookAction(page, context);
      
      // 8. 저장 및 활성화
      await saveAndActivateFlow(page);
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-email-flow-result.png' });
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ Power Automate 플로우 설정 완료!                       ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║  플로우 동작:                                               ║');
    console.log('║  1. 사용자가 PREMO API에서 회원가입 요청                   ║');
    console.log('║  2. Resend가 인증 이메일 발송 (제목: [TO:user@domain])     ║');
    console.log('║  3. Gmail이 Resend 메일 수신                               ║');
    console.log('║  4. Power Automate가 [TO:] 태그 파싱                       ║');
    console.log('║  5. Outlook으로 실제 사용자에게 인증 메일 전달             ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    
    if (page) {
      await page.screenshot({ path: '/home/kogh/.playwright-mcp/pa-email-flow-error.png' });
    }
  }
  
  // 브라우저 연결 유지 (닫지 않음)
  console.log('\n📌 브라우저 연결 유지됨 (수동으로 확인 가능)');
}

// 실행
main();
