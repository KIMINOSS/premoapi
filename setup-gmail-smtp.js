/**
 * Gmail SMTP 설정 도우미
 * 앱 비밀번호 생성 페이지를 열고 설정 완료 후 .env.local 업데이트
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '.env.local');
const GMAIL_USER = 'koghminho@gmail.com';

async function main() {
  console.log('🔧 Gmail SMTP 설정 시작...\n');

  // 기존 Edge 사용자 프로필로 브라우저 실행 (이미 Google 로그인 상태 가능)
  const browser = await chromium.launchPersistentContext(
    'C:\\Users\\koghm\\AppData\\Local\\Google\\Chrome\\User Data\\Default',
    {
      headless: false,
      channel: 'chrome',
      args: ['--start-maximized']
    }
  ).catch(async () => {
    // Chrome 프로필 사용 실패 시 새 브라우저
    console.log('⚠️ Chrome 프로필 사용 불가 - 새 브라우저 시작');
    return await chromium.launch({
      headless: false,
      channel: 'msedge'
    });
  });

  const page = browser.pages?.()[0] || await browser.newPage();

  try {
    // Google 앱 비밀번호 페이지로 이동
    console.log('📱 Google 앱 비밀번호 페이지 열기...');
    await page.goto('https://myaccount.google.com/apppasswords', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/gmail-app-password.png' });

    // 현재 URL 확인
    const currentUrl = page.url();
    console.log(`현재 URL: ${currentUrl}`);

    if (currentUrl.includes('signin')) {
      console.log('\n⚠️ Google 로그인이 필요합니다.');
      console.log('   브라우저에서 로그인 후 앱 비밀번호 페이지로 이동됩니다.');
      await page.waitForURL('**/apppasswords**', { timeout: 120000 });
    }

    console.log('\n========================================');
    console.log('📋 앱 비밀번호 생성 방법:');
    console.log('========================================');
    console.log('1. "앱 이름" 입력란에 "PREMO API" 입력');
    console.log('2. "만들기" 버튼 클릭');
    console.log('3. 생성된 16자리 비밀번호 복사');
    console.log('========================================');

    // 앱 이름 입력 필드 찾기
    const appNameInput = page.locator('input[type="text"]').first();
    if (await appNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await appNameInput.fill('PREMO API');
      console.log('\n✅ 앱 이름 "PREMO API" 자동 입력됨');

      // 만들기 버튼 클릭
      const createBtn = page.locator('button:has-text("만들기"), button:has-text("Create")').first();
      if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await createBtn.click();
        console.log('✅ "만들기" 버튼 클릭됨');

        // 생성된 비밀번호 대기
        await page.waitForTimeout(3000);
        await page.screenshot({ path: '/home/kogh/.playwright-mcp/gmail-password-created.png' });

        // 비밀번호 텍스트 추출 시도
        const passwordText = await page.locator('[data-value], [class*="password"], code, pre').first().textContent().catch(() => null);
        if (passwordText && passwordText.replace(/\s/g, '').length === 16) {
          const appPassword = passwordText.replace(/\s/g, '');
          console.log(`\n✅ 앱 비밀번호 생성됨: ${appPassword.substring(0, 4)}****${appPassword.substring(12)}`);

          // .env.local 업데이트
          await updateEnvFile(appPassword);
        }
      }
    }

    console.log('\n📌 브라우저가 열려있습니다. 필요시 수동으로 앱 비밀번호를 생성하세요.');
    console.log('   생성 후 아래 명령어로 .env.local에 추가하세요:');
    console.log(`   echo "GMAIL_SMTP_USER=${GMAIL_USER}" >> ${ENV_FILE}`);
    console.log(`   echo "GMAIL_SMTP_PASS=YOUR_APP_PASSWORD" >> ${ENV_FILE}`);
    console.log('   echo "USE_GMAIL_SMTP=true" >> ${ENV_FILE}');

    // 사용자 작업 대기 (2분)
    console.log('\n⏳ 2분 후 브라우저가 자동으로 닫힙니다...');
    await page.waitForTimeout(120000);

  } catch (error) {
    console.error('❌ 오류:', error.message);
    await page.screenshot({ path: '/home/kogh/.playwright-mcp/gmail-error.png' });
  } finally {
    await browser.close();
  }
}

async function updateEnvFile(appPassword) {
  try {
    let envContent = fs.existsSync(ENV_FILE)
      ? fs.readFileSync(ENV_FILE, 'utf-8')
      : '';

    // 기존 설정 제거
    envContent = envContent.replace(/GMAIL_SMTP_USER=.*\n?/g, '');
    envContent = envContent.replace(/GMAIL_SMTP_PASS=.*\n?/g, '');
    envContent = envContent.replace(/USE_GMAIL_SMTP=.*\n?/g, '');

    // 새 설정 추가
    envContent += `\n# Gmail SMTP 직접 전송\nUSE_GMAIL_SMTP=true\nGMAIL_SMTP_USER=${GMAIL_USER}\nGMAIL_SMTP_PASS=${appPassword}\n`;

    fs.writeFileSync(ENV_FILE, envContent);
    console.log('✅ .env.local 업데이트 완료');
    console.log('   USE_GMAIL_SMTP=true');
    console.log(`   GMAIL_SMTP_USER=${GMAIL_USER}`);
    console.log(`   GMAIL_SMTP_PASS=****`);
  } catch (error) {
    console.error('❌ .env.local 업데이트 실패:', error.message);
  }
}

main();
