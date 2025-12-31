const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const signupPage = context.pages().find(p => p.url().includes('signup'));
  
  if (!signupPage) {
    console.log('페이지 없음');
    await browser.close();
    return;
  }
  
  // 페이지 내 클릭 가능한 요소 분석
  const elements = await signupPage.evaluate(() => {
    const results = [];
    
    // 동의 관련 텍스트 주변 요소 찾기
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const text = el.textContent || '';
      const tag = el.tagName.toLowerCase();
      
      if (text.includes('개인 정보를 수집') && tag !== 'body' && tag !== 'html') {
        results.push({
          tag,
          class: el.className,
          role: el.getAttribute('role'),
          ariaChecked: el.getAttribute('aria-checked'),
          text: text.substring(0, 50)
        });
      }
    }
    
    // 버튼 찾기
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      results.push({
        tag: 'button',
        text: btn.textContent,
        disabled: btn.disabled
      });
    });
    
    return results.slice(0, 15);
  });
  
  console.log('요소 분석:');
  elements.forEach((el, i) => console.log(i, el));
  
  await browser.close();
}

main().catch(e => console.error('❌:', e.message));
