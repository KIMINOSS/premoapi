'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import type { TabType, LangType } from '../types';
import { formatTime } from '../utils';

interface HeaderProps {
  activeTab: TabType;
  lang: LangType;
  liveMode: boolean;
  tokenLoading: boolean;
  tokens: { HMC: string | null; KMC: string | null };
  sessionTime: number;
  modeLockUntil: number | null;
  onModeToggle: () => void;
  onLangToggle: () => void;
  onSidebarToggle: () => void;
  onLogout: () => void;
}

function HeaderComponent({
  activeTab,
  lang,
  liveMode,
  tokenLoading,
  tokens,
  sessionTime,
  modeLockUntil,
  onModeToggle,
  onLangToggle,
  onSidebarToggle,
  onLogout,
}: HeaderProps) {
  const isLocked = modeLockUntil !== null && Date.now() < modeLockUntil;
  const hasToken = tokens[activeTab] !== null;

  return (
    <header className="bg-white border-b-2 border-gray-300 px-4 md:px-6 py-3 flex items-center justify-between shadow-md relative z-30">
      <div className="flex items-center gap-3 md:gap-6">
        {/* Mobile hamburger menu */}
        <button
          onClick={onSidebarToggle}
          className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-7 h-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <Image
            src="https://grupopremo.com/cdn/shop/files/logo_christmas_2_770x255.gif?v=1765881926"
            alt="PREMO"
            width={140}
            height={36}
            className="h-8 md:h-10 w-auto"
            unoptimized
          />
          <div className="hidden sm:flex flex-col">
            <span className="font-bold text-lg md:text-xl text-gray-900">PREMO KOREA</span>
            <span className="text-xs text-gray-500">HKMC MM Module</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Live/Demo mode toggle with clear status */}
        <div className="flex items-center gap-2 md:gap-3 px-3 py-1.5 rounded-lg bg-gray-100">
          <div className="flex items-center gap-2">
            {liveMode ? (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
                <span className="text-sm md:text-base font-bold text-green-700">LIVE</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-gray-400 rounded-full" />
                <span className="text-sm md:text-base font-bold text-gray-500">DEMO</span>
              </>
            )}
          </div>
          <button
            onClick={onModeToggle}
            disabled={!liveMode && isLocked}
            className={`relative w-12 md:w-14 h-6 md:h-7 rounded-full transition-all duration-300 ${
              liveMode ? 'bg-green-500 shadow-inner' : isLocked ? 'bg-red-300' : 'bg-gray-400'
            }`}
          >
            <span
              className={`absolute top-0.5 md:top-1 w-5 md:w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-md ${
                liveMode ? 'left-6 md:left-8' : 'left-0.5 md:left-1'
              }`}
            />
          </button>
        </div>

        {/* Token status - clear and visible */}
        {liveMode && (
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 border-2 ${
              tokenLoading
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : hasToken
                ? 'bg-green-50 text-green-700 border-green-300'
                : 'bg-yellow-50 text-yellow-700 border-yellow-300'
            }`}
          >
            {tokenLoading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm font-bold">{lang === 'ko' ? '토큰 발급중...' : 'Getting Token...'}</span>
              </>
            ) : hasToken ? (
              <>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">{activeTab} {lang === 'ko' ? '토큰 활성' : 'Token Active'}</span>
                  <span className="text-[10px] opacity-75">{lang === 'ko' ? 'API 연결됨' : 'API Connected'}</span>
                </div>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm font-bold">{lang === 'ko' ? '토큰 없음' : 'No Token'}</span>
              </>
            )}
          </div>
        )}

        {/* Session timer */}
        {liveMode && (
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-mono text-base font-semibold text-gray-700">{formatTime(sessionTime)}</span>
          </div>
        )}

        {/* Language toggle */}
        <button
          onClick={onLangToggle}
          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-bold text-gray-700 transition-colors"
        >
          {lang === 'ko' ? 'EN' : '한'}
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title={lang === 'ko' ? '로그아웃' : 'Logout'}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}

export const Header = memo(HeaderComponent);
