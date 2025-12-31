/**
 * PREMO 이메일 릴레이 모니터링 시스템
 * Google Apps Script + 라즈베리파이 n8n 상태 모니터링
 */

const http = require('http');
const https = require('https');
const { execFile } = require('child_process');

// 설정
const CONFIG = {
  // 라즈베리파이 n8n
  N8N_HOST: '192.168.8.231',
  N8N_PORT: 5678,
  N8N_USER: 'premo',
  N8N_PASS: 'premo2025',

  // 모니터링 간격 (초)
  CHECK_INTERVAL: 60,

  // 알림 설정
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',

  // 로그 파일
  LOG_FILE: './monitor.log'
};

// 상태 저장
let lastStatus = {
  n8n: null,
  gasScript: null,
  lastCheck: null
};

/**
 * n8n 헬스체크
 */
function checkN8n() {
  return new Promise((resolve) => {
    const auth = Buffer.from(`${CONFIG.N8N_USER}:${CONFIG.N8N_PASS}`).toString('base64');

    const options = {
      hostname: CONFIG.N8N_HOST,
      port: CONFIG.N8N_PORT,
      path: '/healthz',
      method: 'GET',
      timeout: 5000,
      headers: {
        'Authorization': `Basic ${auth}`
      }
    };

    const req = http.request(options, (res) => {
      resolve({
        status: res.statusCode === 200 ? 'healthy' : 'unhealthy',
        code: res.statusCode,
        timestamp: new Date().toISOString()
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 'offline',
        error: err.message,
        timestamp: new Date().toISOString()
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 'timeout',
        timestamp: new Date().toISOString()
      });
    });

    req.end();
  });
}

/**
 * n8n 워크플로우 실행 상태 확인
 */
function checkN8nWorkflows() {
  return new Promise((resolve) => {
    const auth = Buffer.from(`${CONFIG.N8N_USER}:${CONFIG.N8N_PASS}`).toString('base64');

    const options = {
      hostname: CONFIG.N8N_HOST,
      port: CONFIG.N8N_PORT,
      path: '/api/v1/workflows',
      method: 'GET',
      timeout: 10000,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const workflows = JSON.parse(data);
          resolve({
            total: workflows.data?.length || 0,
            active: workflows.data?.filter(w => w.active).length || 0,
            timestamp: new Date().toISOString()
          });
        } catch (e) {
          resolve({ error: 'parse_error', timestamp: new Date().toISOString() });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message, timestamp: new Date().toISOString() });
    });

    req.end();
  });
}

/**
 * 라즈베리파이 시스템 상태 확인 (execFile 사용 - 보안 강화)
 */
function checkRaspberryPi() {
  return new Promise((resolve) => {
    // execFile 사용으로 command injection 방지
    execFile('ping', ['-c', '1', '-W', '2', CONFIG.N8N_HOST], (error, stdout, stderr) => {
      if (error) {
        resolve({
          status: 'offline',
          timestamp: new Date().toISOString()
        });
      } else {
        // ping 시간 추출
        const timeMatch = stdout.match(/time=(\d+\.?\d*)/);
        resolve({
          status: 'online',
          pingMs: timeMatch ? parseFloat(timeMatch[1]) : null,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
}

/**
 * 콘솔에 상태 출력
 */
function printStatus(status) {
  console.clear();
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     🔍 PREMO 이메일 릴레이 모니터링 시스템     ║');
  console.log('╠════════════════════════════════════════════════╣');
  console.log(`║ 마지막 확인: ${status.lastCheck || 'N/A'}`.padEnd(49) + '║');
  console.log('╠════════════════════════════════════════════════╣');

  // 라즈베리파이 상태
  const piStatus = status.raspberryPi?.status === 'online' ? '🟢 온라인' : '🔴 오프라인';
  const pingMs = status.raspberryPi?.pingMs ? ` (${status.raspberryPi.pingMs}ms)` : '';
  console.log(`║ 🍓 라즈베리파이: ${piStatus}${pingMs}`.padEnd(49) + '║');

  // n8n 상태
  const n8nHealth = status.n8n?.status === 'healthy' ? '🟢 정상' :
                    status.n8n?.status === 'offline' ? '🔴 오프라인' : '🟡 비정상';
  console.log(`║ 📦 n8n 서비스: ${n8nHealth}`.padEnd(49) + '║');

  // 워크플로우 상태
  if (status.workflows) {
    const wfInfo = status.workflows.error ? '⚠️ 확인 불가' :
                   `${status.workflows.active}/${status.workflows.total} 활성`;
    console.log(`║ ⚡ 워크플로우: ${wfInfo}`.padEnd(49) + '║');
  }

  console.log('╠════════════════════════════════════════════════╣');
  console.log(`║ 📧 이메일 릴레이: ${CONFIG.N8N_HOST}:${CONFIG.N8N_PORT}`.padEnd(49) + '║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log('Ctrl+C로 종료');
}

/**
 * 텔레그램 알림 전송
 */
async function sendTelegramAlert(message) {
  if (!CONFIG.TELEGRAM_BOT_TOKEN || !CONFIG.TELEGRAM_CHAT_ID) {
    return;
  }

  const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const data = JSON.stringify({
    chat_id: CONFIG.TELEGRAM_CHAT_ID,
    text: `🚨 PREMO 알림\n\n${message}`,
    parse_mode: 'HTML'
  });

  return new Promise((resolve) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.write(data);
    req.end();
  });
}

/**
 * 상태 변화 감지 및 알림
 */
async function detectChanges(newStatus) {
  const alerts = [];

  // n8n 상태 변화
  if (lastStatus.n8n !== null && lastStatus.n8n !== newStatus.n8n?.status) {
    if (newStatus.n8n?.status === 'offline') {
      alerts.push('n8n 서비스가 오프라인 상태입니다!');
    } else if (newStatus.n8n?.status === 'healthy' && lastStatus.n8n === 'offline') {
      alerts.push('n8n 서비스가 복구되었습니다.');
    }
  }

  // 라즈베리파이 상태 변화
  if (lastStatus.raspberryPi !== null && lastStatus.raspberryPi !== newStatus.raspberryPi?.status) {
    if (newStatus.raspberryPi?.status === 'offline') {
      alerts.push('라즈베리파이가 오프라인 상태입니다!');
    } else if (newStatus.raspberryPi?.status === 'online' && lastStatus.raspberryPi === 'offline') {
      alerts.push('라즈베리파이가 다시 온라인입니다.');
    }
  }

  // 알림 전송
  for (const alert of alerts) {
    console.log(`\n🚨 알림: ${alert}`);
    await sendTelegramAlert(alert);
  }

  // 상태 저장
  lastStatus.n8n = newStatus.n8n?.status;
  lastStatus.raspberryPi = newStatus.raspberryPi?.status;
}

/**
 * 메인 모니터링 루프
 */
async function monitor() {
  console.log('🔍 PREMO 이메일 릴레이 모니터링 시작...\n');

  const check = async () => {
    const [raspberryPi, n8n, workflows] = await Promise.all([
      checkRaspberryPi(),
      checkN8n(),
      checkN8nWorkflows()
    ]);

    const status = {
      raspberryPi,
      n8n,
      workflows,
      lastCheck: new Date().toLocaleString('ko-KR')
    };

    await detectChanges(status);
    printStatus(status);

    return status;
  };

  // 초기 체크
  await check();

  // 주기적 체크
  setInterval(check, CONFIG.CHECK_INTERVAL * 1000);
}

// 실행
if (require.main === module) {
  monitor().catch(console.error);
}

module.exports = { checkN8n, checkRaspberryPi, checkN8nWorkflows };
