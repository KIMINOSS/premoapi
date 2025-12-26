'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [showNotice, setShowNotice] = useState(true);
  const [lang, setLang] = useState<'ko' | 'en'>('ko');

  const handleLogin = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {/* 공지사항 팝업 */}
      {showNotice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[420px] overflow-hidden">
            {/* 헤더 */}
            <div className="bg-red-500 px-3 py-2 flex items-center justify-between">
              <span className="text-white text-sm font-bold">{lang === 'ko' ? '공지사항' : 'Notice'}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
                  className="text-white/80 hover:text-white text-[10px]"
                >
                  {lang === 'ko' ? 'EN' : '한'}
                </button>
                <button onClick={() => setShowNotice(false)} className="text-white text-lg leading-none">×</button>
              </div>
            </div>

            {/* 내용 */}
            <div className="p-3 text-[11px] text-gray-600 space-y-2">
              {/* 테스트 안내 */}
              <div className="bg-yellow-50 border-l-2 border-yellow-400 px-2 py-1">
                <span className="text-yellow-800 font-medium">
                  {lang === 'ko' ? '⚠ 테스트 빌드 - 정식 오픈 전 버전입니다' : '⚠ Test Build - Pre-release version'}
                </span>
              </div>

              {/* 일정표 */}
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-gray-100 text-gray-500">
                    <th className="px-2 py-1 text-left">{lang === 'ko' ? '작업' : 'Task'}</th>
                    <th className="px-2 py-1 w-12">{lang === 'ko' ? '일정' : 'Date'}</th>
                    <th className="px-2 py-1 w-14">{lang === 'ko' ? '상태' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-t"><td className="px-2 py-1">{lang === 'ko' ? 'API 연계 테스트' : 'API Integration Test'}</td><td className="text-center">12/22</td><td className="text-center"><span className="text-green-600">DONE</span></td></tr>
                  <tr className="border-t"><td className="px-2 py-1">{lang === 'ko' ? '운영계 방화벽 해제' : 'Firewall Setup'} <span className="text-gray-400">(IT Team)</span></td><td className="text-center">12/29</td><td className="text-center"><span className="text-blue-600">ONGOING</span></td></tr>
                  <tr className="border-t"><td className="px-2 py-1">{lang === 'ko' ? 'API 시스템 개발 완료' : 'API Development'}</td><td className="text-center">12/29</td><td className="text-center"><span className="text-green-600">DONE</span></td></tr>
                  <tr className="border-t"><td className="px-2 py-1">{lang === 'ko' ? 'APIGW 가이드 및 관리주체 이관' : 'APIGW Guide & Transfer'}</td><td className="text-center">12/29</td><td className="text-center"><span className="text-gray-400">-</span></td></tr>
                  <tr className="border-t"><td className="px-2 py-1">{lang === 'ko' ? 'APIGW 운영계 URL 전환' : 'APIGW Prod URL Switch'}</td><td className="text-center">12/29</td><td className="text-center"><span className="text-gray-400">-</span></td></tr>
                  <tr className="border-t"><td className="px-2 py-1">{lang === 'ko' ? 'API 오픈 및 안정화' : 'API Launch'}</td><td className="text-center">{lang === 'ko' ? '1/5~' : '1/5~'}</td><td className="text-center"><span className="text-gray-400">-</span></td></tr>
                </tbody>
              </table>

              {/* 버전 및 문의 */}
              <div className="pt-1 border-t text-[10px] text-gray-400 flex justify-between">
                <span>v1.0.0 | {lang === 'ko' ? '문의' : 'Contact'}: minho.kim@grupopremo.com</span>
              </div>
            </div>

            {/* 푸터 */}
            <div className="px-3 py-2 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowNotice(false)}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
              >
                {lang === 'ko' ? '확인' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 로그인 카드 */}
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <div className="text-center mb-8">
          <img src="https://grupopremo.com/cdn/shop/files/logo_christmas_2_770x255.gif?v=1765881926" alt="PREMO" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">PREMO KOR.</h1>
          <p className="text-sm font-bold text-gray-600 mt-2">HKMC MM Module API Caller</p>
          <span className="inline-block mt-2 px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">TEST BUILD</span>
        </div>

        <button
          onClick={handleLogin}
          className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
        >
          {lang === 'ko' ? '로그인' : 'Login'}
        </button>

        <button
          onClick={() => setShowNotice(true)}
          className="w-full mt-2 py-1.5 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          {lang === 'ko' ? '공지사항' : 'Notice'}
        </button>

        <p className="text-[10px] text-gray-300 text-center mt-3">Developed by Minho Kim</p>
      </div>
    </div>
  );
}
