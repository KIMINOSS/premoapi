#!/usr/bin/env node
/**
 * 등록된 사용자 목록 조회 스크립트
 * 사용법: node scripts/list-users.js
 */

const REDIS_PROXY_URL = 'https://collection-bodies-sewing-viewpicture.trycloudflare.com';

async function listUsers() {
  try {
    const res = await fetch(`${REDIS_PROXY_URL}/users`);
    const data = await res.json();

    if (data.raw) {
      // Redis RESP 프로토콜 파싱
      const lines = data.raw.split('\r\n').filter(l => !l.startsWith('*') && !l.startsWith('$') && l);
      const users = [];

      for (let i = 0; i < lines.length; i += 2) {
        const email = lines[i];
        const userData = JSON.parse(lines[i + 1] || '{}');
        users.push({ email, ...userData });
      }

      console.log('\n📋 등록된 계정 목록\n');
      console.log('─'.repeat(60));
      users.forEach((u, i) => {
        console.log(`${i + 1}. ${u.email}`);
        console.log(`   이름: ${u.name || '-'}`);
        console.log(`   생성: ${u.createdAt || '-'}`);
        console.log('');
      });
      console.log(`총 ${users.length}명`);
    } else {
      console.log('사용자 없음');
    }
  } catch (e) {
    console.error('조회 실패:', e.message);
  }
}

listUsers();
