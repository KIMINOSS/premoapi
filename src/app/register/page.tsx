'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '등록에 실패했습니다.');
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error('Register error:', err);
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-96 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">이메일 발송 완료</h2>
          <p className="text-gray-600 text-sm mb-3">
            <span className="text-red-500 font-medium">{email}</span>로<br />
            인증 링크를 발송했습니다.
          </p>
          <p className="text-gray-400 text-xs">
            이메일을 확인하고 링크를 클릭해주세요.<br />
            (24시간 내 유효)
          </p>
          <Link href="/login" className="inline-block mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors">
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <div className="text-center mb-6">
          <Image 
            src="https://grupopremo.com/cdn/shop/files/logo_christmas_2_770x255.gif?v=1765881926" 
            alt="PREMO" 
            width={180} 
            height={48} 
            className="h-12 w-auto mx-auto mb-3" 
            unoptimized 
          />
          <h1 className="text-xl font-bold text-gray-800">회원가입</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">회사 이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@grupopremo.com"
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="text-[10px] text-gray-400 mt-1">@grupopremo.com 도메인만 가입 가능</p>
          </div>

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-wait"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                발송 중...
              </span>
            ) : '인증 메일 발송'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/login" className="text-xs text-gray-500 hover:text-red-500 transition-colors">
            이미 계정이 있으신가요? 로그인
          </Link>
        </div>

        <p className="text-[10px] text-gray-300 text-center mt-4">© 2025 PREMO KOREA</p>
      </div>
    </div>
  );
}
