const { chromium } = require('playwright');

async function main() {
  console.log('브라우저 시작...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  console.log('localhost:3006 접속...');
  await page.goto('http://localhost:3006', { waitUntil: 'networkidle' });

  console.log('스크린샷 저장...');
  await page.screenshot({ path: '/home/kogh/mino/premoapi/homepage.png', fullPage: true });

  console.log('페이지 제목:', await page.title());

  await browser.close();
  console.log('완료!');
}

main().catch(function(e) { console.error('오류:', e.message); });
