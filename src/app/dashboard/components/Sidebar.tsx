'use client';

import React, { memo } from 'react';
import type { TabType, LangType } from '../types';

interface InterfaceItem {
  id: string;
  name: { ko: string; en: string };
  params: string[];
  hidden?: boolean;
  order?: number;
}

interface SidebarProps {
  activeTab: TabType;
  selectedIndex: number;
  interfaces: InterfaceItem[];
  lang: LangType;
  sidebarOpen: boolean;
  onTabChange: (tab: TabType) => void;
  onInterfaceSelect: (index: number) => void;
  onClose: () => void;
}

function SidebarComponent({
  activeTab,
  selectedIndex,
  interfaces,
  lang,
  sidebarOpen,
  onTabChange,
  onInterfaceSelect,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
          w-56 md:w-48 bg-white border-r-2 flex flex-col
          transition-all duration-300 ease-in-out
          ${activeTab === 'HMC' ? 'border-blue-400' : 'border-red-400'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:flex
          pt-0 lg:pt-0
          top-0 lg:top-auto
          h-full
        `}
      >
        {/* Mobile sidebar header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <span className="font-bold text-gray-800">{lang === 'ko' ? '메뉴' : 'Menu'}</span>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Customer selection label */}
        <div className="text-[10px] text-gray-400 text-center py-1 bg-gray-50 border-b border-gray-100">
          {lang === 'ko' ? '고객사 선택' : 'Select Customer'}
        </div>

        {/* Tab buttons */}
        <div className="flex p-1 gap-1 bg-gray-100 border-b border-gray-200">
          <button
            onClick={() => {
              onTabChange('HMC');
              onClose();
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all shadow-sm ${
              activeTab === 'HMC'
                ? 'bg-blue-500 text-white ring-2 ring-blue-300 ring-offset-1'
                : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
            }`}
          >
            {lang === 'ko' ? '현대' : 'Hyundai'}
          </button>
          <button
            onClick={() => {
              onTabChange('KMC');
              onClose();
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all shadow-sm ${
              activeTab === 'KMC'
                ? 'bg-red-500 text-white ring-2 ring-red-300 ring-offset-1'
                : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200'
            }`}
          >
            {lang === 'ko' ? '기아' : 'Kia'}
          </button>
        </div>

        {/* Active tab indicator */}
        <div
          className={`px-3 py-2 border-b-2 flex items-center justify-between ${
            activeTab === 'HMC' ? 'border-blue-400 bg-blue-50' : 'border-red-400 bg-red-50'
          }`}
        >
          <span className={`text-lg font-bold ${activeTab === 'HMC' ? 'text-blue-700' : 'text-red-700'}`}>
            {activeTab}
          </span>
          <span className="text-sm font-medium text-gray-500">{interfaces.length}</span>
        </div>

        {/* Interface list */}
        <nav className="flex-1 overflow-y-auto p-1">
          {interfaces.map((iface, index) => (
            <button
              key={`${activeTab}-${iface.id}`}
              onClick={() => {
                onInterfaceSelect(index);
                onClose();
              }}
              className={`w-full text-left px-2 py-2 md:py-1 rounded transition-all ${
                selectedIndex === index
                  ? 'bg-red-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-sm">
                {(index + 1).toString().padStart(2, '0')} {iface.name[lang]}
              </span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}

export const Sidebar = memo(SidebarComponent);
