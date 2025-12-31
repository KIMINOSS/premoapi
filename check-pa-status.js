const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const pages = context.pages();
  
  console.log('페이지 수:', pages.length);
  for (const p of pages) {
    console.log('URL:', p.url());
  }
  
  if (pages.length > 0) {
    const page = pages[0];
    await page.screenshot({ path: 'C:\\\\temp\\\\pa-check.png' });
    console.log('스크린샷 저장됨');
  }
  
  await browser.close();
})().catch(e => console.error(e.message));
