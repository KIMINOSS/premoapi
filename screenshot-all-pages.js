const { chromium } = require('playwright');

const PAGES = [
  { name: 'home', url: 'http://localhost:3000/' },
  { name: 'login', url: 'http://localhost:3000/login' },
  { name: 'register', url: 'http://localhost:3000/register' },
  { name: 'verify', url: 'http://localhost:3000/verify' },
  { name: 'dashboard', url: 'http://localhost:3000/dashboard' },
  { name: 'users', url: 'http://localhost:3000/users' }
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  for (const p of PAGES) {
    console.log(`📸 ${p.name} 페이지...`);
    try {
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: `/home/kogh/.playwright-mcp/page-${p.name}.png`,
        fullPage: true
      });
      console.log(`   ✅ 저장됨: page-${p.name}.png`);
    } catch (e) {
      console.log(`   ⚠️ 오류: ${e.message}`);
    }
  }

  await browser.close();
  console.log('\n모든 페이지 캡처 완료');
}

main();
