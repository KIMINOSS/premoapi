'use client';

import React, { memo } from 'react';
import { HMC_PLANTS, KMC_PLANTS, isParamRequired } from '../config';
import { DATE_PARAMS, toDateInput, getParamLabel } from '../utils';
import type { TabType, LangType } from '../types';

interface QueryPanelProps {
  activeTab: TabType;
  lang: LangType;
  currentInterface: {
    id: string;
    name: { ko: string; en: string };
    params: string[];
  };
  paramValues: Record<string, string>;
  onParamChange: (key: string, value: string) => void;
  onSubmit: () => void;
  onDownload: () => void;
  loading: boolean;
  hasData: boolean;
}

function QueryPanelComponent({
  activeTab,
  lang,
  currentInterface,
  paramValues,
  onParamChange,
  onSubmit,
  onDownload,
  loading,
  hasData,
}: QueryPanelProps) {
  const plants = activeTab === 'HMC' ? HMC_PLANTS : KMC_PLANTS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* 필수 파라미터: 벤더코드 */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-end">
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-medium text-red-600 mb-1">
            {lang === 'ko' ? '벤더코드' : 'Vendor Code'}*
          </label>
          <input
            type="text"
            value={paramValues['I_LIFNR'] || ''}
            onChange={(e) => onParamChange('I_LIFNR', e.target.value.toUpperCase())}
            placeholder="RR4U"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </div>

        {/* 회사 선택 (플랜트가 있을 경우) */}
        {currentInterface.params.includes('I_WERKS') && (
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {lang === 'ko' ? '회사' : 'Company'}
            </label>
            <select
              value={paramValues['I_WERKS'] || ''}
              onChange={(e) => onParamChange('I_WERKS', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">{lang === 'ko' ? '전체' : 'All'}</option>
              {plants.map((plant) => (
                <option key={plant.code} value={plant.code}>
                  {plant.code ? `${plant.code} ${plant.name[lang]}` : plant.name[lang]}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 조회 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors disabled:bg-gray-400 flex items-center gap-2 whitespace-nowrap"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {lang === 'ko' ? '조회중...' : 'Loading...'}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {lang === 'ko' ? '조회' : 'Search'}
            </>
          )}
        </button>
      </div>

      {/* 추가 파라미터 */}
      {currentInterface.params.filter(p => p !== 'I_LIFNR' && p !== 'I_WERKS').length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
          {currentInterface.params
            .filter(p => p !== 'I_LIFNR' && p !== 'I_WERKS')
            .map((param) => {
              const isDate = DATE_PARAMS.includes(param);
              const isRequired = isParamRequired(currentInterface.id, param);

              return (
                <div key={param}>
                  <label className={`block text-xs font-medium mb-1 ${isRequired ? 'text-red-600' : 'text-gray-600'}`}>
                    {getParamLabel(param, lang)}{isRequired && '*'}
                  </label>
                  <input
                    type={isDate ? 'date' : 'text'}
                    value={isDate ? toDateInput(paramValues[param] || '') : (paramValues[param] || '')}
                    onChange={(e) => onParamChange(param, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    required={isRequired}
                  />
                </div>
              );
            })}
        </div>
      )}

      {/* 다운로드 버튼 */}
      {hasData && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onDownload}
            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {lang === 'ko' ? '엑셀 다운로드' : 'Download Excel'}
          </button>
        </div>
      )}
    </form>
  );
}

export const QueryPanel = memo(QueryPanelComponent);
