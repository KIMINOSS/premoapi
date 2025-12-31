/**
 * PREMO 이메일 릴레이 시스템 - Google Apps Script
 * Gmail에서 [TO:수신자@email.com] 태그를 파싱하여 실제 수신자에게 전달
 *
 * 설정 방법:
 * 1. script.google.com 접속
 * 2. 새 프로젝트 생성
 * 3. 이 코드 붙여넣기
 * 4. 트리거 설정: forwardEmailsWithToTag, 시간 기반, 1분마다
 */

// 설정
const CONFIG = {
  RELAY_EMAIL: 'authpremoapi@gmail.com',  // 릴레이 이메일 주소
  SEARCH_QUERY: 'in:inbox subject:"[TO:" is:unread',  // 검색 조건
  PROCESSED_LABEL: 'PREMO-Forwarded',  // 처리 완료 라벨
  ERROR_LABEL: 'PREMO-Error',  // 에러 라벨
  LOG_SHEET_NAME: 'PREMO-Email-Log',  // 로그 시트 이름
  MAX_THREADS: 10  // 한 번에 처리할 최대 스레드 수
};

/**
 * 메인 함수 - [TO:] 태그가 있는 이메일 전달
 */
function forwardEmailsWithToTag() {
  try {
    // 라벨 생성 (없으면)
    ensureLabelsExist();

    // 미읽음 이메일 검색
    const threads = GmailApp.search(CONFIG.SEARCH_QUERY, 0, CONFIG.MAX_THREADS);

    if (threads.length === 0) {
      console.log('처리할 이메일 없음');
      return;
    }

    console.log(`${threads.length}개 스레드 발견`);

    const processedLabel = GmailApp.getUserLabelByName(CONFIG.PROCESSED_LABEL);
    const errorLabel = GmailApp.getUserLabelByName(CONFIG.ERROR_LABEL);

    threads.forEach((thread, index) => {
      try {
        const message = thread.getMessages()[0];
        const subject = message.getSubject();
        const body = message.getBody();
        const plainBody = message.getPlainBody();
        const from = message.getFrom();
        const date = message.getDate();

        console.log(`[${index + 1}] 처리 중: ${subject}`);

        // [TO:수신자@email.com] 패턴 추출
        const toMatch = subject.match(/\[TO:([^\]]+)\]/);

        if (!toMatch) {
          console.log('  → [TO:] 태그 없음, 스킵');
          return;
        }

        const actualRecipient = toMatch[1].trim();
        const cleanSubject = subject.replace(/\[TO:[^\]]+\]\s*/, '').trim();

        // 이메일 유효성 검사
        if (!isValidEmail(actualRecipient)) {
          console.log(`  → 유효하지 않은 이메일: ${actualRecipient}`);
          thread.addLabel(errorLabel);
          logToSheet('ERROR', from, actualRecipient, cleanSubject, '유효하지 않은 이메일 주소');
          message.markRead();
          return;
        }

        console.log(`  → 수신자: ${actualRecipient}`);
        console.log(`  → 정제된 제목: ${cleanSubject}`);

        // 첨부파일 처리
        const attachments = message.getAttachments();

        // 이메일 전송
        GmailApp.sendEmail(actualRecipient, cleanSubject, plainBody, {
          htmlBody: body,
          attachments: attachments,
          name: 'PREMO Relay',
          replyTo: from
        });

        console.log('  ✓ 전송 완료');

        // 처리 완료 마킹
        message.markRead();
        message.star();
        thread.addLabel(processedLabel);

        // 로그 기록
        logToSheet('SUCCESS', from, actualRecipient, cleanSubject, '전송 완료');

      } catch (msgError) {
        console.error(`  ✗ 메시지 처리 오류: ${msgError.message}`);
        thread.addLabel(errorLabel);
        logToSheet('ERROR', '', '', '', msgError.message);
      }
    });

    console.log('처리 완료');

  } catch (error) {
    console.error(`전체 오류: ${error.message}`);
    logToSheet('CRITICAL', '', '', '', error.message);
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
 * 라벨 생성 (없으면)
 */
function ensureLabelsExist() {
  [CONFIG.PROCESSED_LABEL, CONFIG.ERROR_LABEL].forEach(labelName => {
    let label = GmailApp.getUserLabelByName(labelName);
    if (!label) {
      label = GmailApp.createLabel(labelName);
      console.log(`라벨 생성됨: ${labelName}`);
    }
  });
}

/**
 * 스프레드시트에 로그 기록
 */
function logToSheet(status, from, to, subject, message) {
  try {
    let spreadsheet;

    // 기존 스프레드시트 찾기
    const files = DriveApp.getFilesByName(CONFIG.LOG_SHEET_NAME);

    if (files.hasNext()) {
      spreadsheet = SpreadsheetApp.open(files.next());
    } else {
      // 새 스프레드시트 생성
      spreadsheet = SpreadsheetApp.create(CONFIG.LOG_SHEET_NAME);
      const sheet = spreadsheet.getActiveSheet();
      sheet.appendRow(['Timestamp', 'Status', 'From', 'To', 'Subject', 'Message']);
      sheet.setFrozenRows(1);
    }

    const sheet = spreadsheet.getActiveSheet();
    sheet.appendRow([
      new Date().toISOString(),
      status,
      from,
      to,
      subject,
      message
    ]);

  } catch (logError) {
    console.error(`로그 기록 실패: ${logError.message}`);
  }
}

/**
 * 트리거 설정 함수 (최초 1회 실행)
 */
function setupTrigger() {
  // 기존 트리거 제거
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'forwardEmailsWithToTag') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 새 트리거 생성 (1분마다)
  ScriptApp.newTrigger('forwardEmailsWithToTag')
    .timeBased()
    .everyMinutes(1)
    .create();

  console.log('트리거 설정 완료: 1분마다 실행');
}

/**
 * 테스트 함수
 */
function testEmailRelay() {
  console.log('=== PREMO 이메일 릴레이 테스트 ===');
  console.log(`릴레이 이메일: ${CONFIG.RELAY_EMAIL}`);
  console.log(`검색 쿼리: ${CONFIG.SEARCH_QUERY}`);

  // 테스트 검색
  const threads = GmailApp.search(CONFIG.SEARCH_QUERY, 0, 5);
  console.log(`발견된 스레드: ${threads.length}개`);

  threads.forEach((thread, i) => {
    const msg = thread.getMessages()[0];
    console.log(`[${i + 1}] ${msg.getSubject()}`);
  });
}

/**
 * 수동 전달 함수 (특정 이메일 ID로)
 */
function manualForward(messageId, recipientEmail) {
  const message = GmailApp.getMessageById(messageId);
  if (!message) {
    console.log('메시지를 찾을 수 없음');
    return;
  }

  GmailApp.sendEmail(recipientEmail, message.getSubject(), message.getPlainBody(), {
    htmlBody: message.getBody(),
    attachments: message.getAttachments(),
    name: 'PREMO Relay'
  });

  console.log(`수동 전달 완료: ${recipientEmail}`);
}
