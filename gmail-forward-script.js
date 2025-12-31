/**
 * Gmail Apps Script - 이메일 자동 전달
 *
 * 이 스크립트를 Google Apps Script (https://script.google.com)에 붙여넣으세요.
 *
 * 기능:
 * 1. onboarding@resend.dev에서 온 이메일 감지
 * 2. Subject에서 [TO:xxx@domain.com] 파싱
 * 3. 해당 주소로 이메일 자동 전달
 *
 * 설정 방법:
 * 1. https://script.google.com 접속
 * 2. 새 프로젝트 생성
 * 3. 아래 코드 붙여넣기
 * 4. 트리거 설정: processEmails → 시간 기반 → 5분마다
 */

// 설정
const CONFIG = {
  SENDER_EMAIL: 'onboarding@resend.dev',
  LABEL_NAME: 'PREMO-Forwarded',
  LABEL_PENDING: 'PREMO-Pending'
};

/**
 * 메인 함수 - 이메일 처리
 */
function processEmails() {
  // 처리되지 않은 이메일 검색
  const query = 'from:' + CONFIG.SENDER_EMAIL + ' subject:[TO: is:unread';
  const threads = GmailApp.search(query, 0, 10);

  if (threads.length === 0) {
    Logger.log('처리할 이메일 없음');
    return;
  }

  // 라벨 생성/가져오기
  let forwardedLabel = GmailApp.getUserLabelByName(CONFIG.LABEL_NAME);
  if (!forwardedLabel) {
    forwardedLabel = GmailApp.createLabel(CONFIG.LABEL_NAME);
  }

  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(message => {
      if (message.isUnread()) {
        processMessage(message, forwardedLabel);
      }
    });
  });
}

/**
 * 개별 메시지 처리
 */
function processMessage(message, label) {
  const subject = message.getSubject();
  const body = message.getBody();
  const plainBody = message.getPlainBody();

  // Subject에서 [TO:xxx] 추출
  const toMatch = subject.match(/\[TO:([^\]]+)\]/);
  if (!toMatch) {
    Logger.log('TO 주소를 찾을 수 없음: ' + subject);
    return;
  }

  const recipientEmail = toMatch[1].trim();
  Logger.log('수신자: ' + recipientEmail);

  // 이메일 유효성 검사
  if (!isValidEmail(recipientEmail)) {
    Logger.log('잘못된 이메일 형식: ' + recipientEmail);
    return;
  }

  try {
    // 새 Subject (TO 태그 제거)
    const newSubject = subject.replace(/\[TO:[^\]]+\]\s*/, '');

    // 이메일 전달
    GmailApp.sendEmail(recipientEmail, newSubject, plainBody, {
      htmlBody: body,
      name: 'PREMO API',
      replyTo: 'noreply@grupopremo.com'
    });

    Logger.log('✅ 이메일 전달 성공: ' + recipientEmail);

    // 읽음 표시 및 라벨 적용
    message.markRead();
    message.getThread().addLabel(label);

  } catch (error) {
    Logger.log('❌ 이메일 전달 실패: ' + error.message);
  }
}

/**
 * 이메일 유효성 검사
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 수동 테스트용 함수
 */
function testForward() {
  // 테스트 이메일 전송
  const testSubject = '[TO:test@example.com] [PREMO API] 테스트 이메일';
  const testBody = '<h1>테스트</h1><p>이것은 테스트 이메일입니다.</p>';

  const toMatch = testSubject.match(/\[TO:([^\]]+)\]/);
  if (toMatch) {
    Logger.log('추출된 수신자: ' + toMatch[1]);
  }
}

/**
 * 트리거 설정 (한 번만 실행)
 */
function setupTrigger() {
  // 기존 트리거 제거
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 새 트리거 생성 (5분마다)
  ScriptApp.newTrigger('processEmails')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log('✅ 트리거 설정 완료: 5분마다 processEmails 실행');
}
