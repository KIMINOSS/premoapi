'use client';

import React, { memo } from 'react';
import type { TabType, LangType } from '../types';
import { HMC_PLANTS, KMC_PLANTS, isParamRequired } from '../config';
import { DATE_PARAMS, toDateInput, toYYYYMMDD, getParamLabel } from '../utils';

interface InterfaceItem {
  id: string;
  name: { ko: string; en: string };
  params: string[];
}

interface ParamInputsProps {
  currentInterface: InterfaceItem;
  paramValues: Record<string, string>;
  lang: LangType;
  activeTab: TabType;
  loading: boolean;
  isInputInterface: boolean;
  isInputMode: boolean;
  onParamChange: (key: string, value: string) => void;
  onQuery: () => void;
  onToggleInputMode: () => void;
}

function ParamInputsComponent({
  currentInterface,
  paramValues,
  lang,
  activeTab,
  loading,
  isInputInterface,
  isInputMode,
  onParamChange,
  onQuery,
  onToggleInputMode,
}: ParamInputsProps) {
  const plants = activeTab === 'HMC' ? HMC_PLANTS : KMC_PLANTS;

  const renderParam = (param: string) => {
    const required = isParamRequired(currentInterface.id, param);

    if (param === 'I_WERKS') {
      return (
        <div key={param} className="flex flex-col gap-0.5">
          <label className="text-[10px] text-gray-500">
            {getParamLabel(param, lang)}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <select
            value={paramValues[param] || ''}
            onChange={(e) => onParamChange(param, e.target.value)}
            className="px-1.5 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:border-red-500 w-28 md:w-36"
          >
            {plants.map((plant) => (
              <option key={plant.code} value={plant.code}>
                {plant.code ? `${plant.code} ${plant.name[lang]}` : plant.name[lang]}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (DATE_PARAMS.includes(param)) {
      return (
        <div key={param} className="flex flex-col gap-0.5">
          <label className="text-[10px] text-gray-500">
            {getParamLabel(param, lang)}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <div className="flex gap-0.5 items-center">
            <input
              type="text"
              value={paramValues[param] || ''}
              onChange={(e) => onParamChange(param, e.target.value)}
              placeholder="YYYYMMDD"
              maxLength={8}
              className="px-1.5 py-1 bg-gray-100 border border-gray-300 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 w-20"
            />
            <label className="relative cursor-pointer p-1 hover:bg-gray-100 rounded transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input
                type="date"
                value={toDateInput(paramValues[param] || '')}
                onChange={(e) => onParamChange(param, toYYYYMMDD(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
          </div>
        </div>
      );
    }

    if (param === 'I_SPMON') {
      return (
        <div key={param} className="flex flex-col gap-0.5">
          <label className="text-[10px] text-gray-500">
            {getParamLabel(param, lang)}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <div className="flex gap-0.5 items-center">
            <input
              type="text"
              value={paramValues[param] || ''}
              onChange={(e) => onParamChange(param, e.target.value)}
              placeholder="YYYYMM"
              maxLength={6}
              className="px-1.5 py-1 bg-gray-100 border border-gray-300 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 w-16"
            />
            <label className="relative cursor-pointer p-1 hover:bg-gray-100 rounded transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input
                type="month"
                value={paramValues[param] ? `${paramValues[param].slice(0, 4)}-${paramValues[param].slice(4, 6)}` : ''}
                onChange={(e) => onParamChange(param, e.target.value.replace('-', ''))}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
          </div>
        </div>
      );
    }

    if (param === 'I_ZPLDAYS') {
      return (
        <div key={param} className="flex flex-col gap-0.5">
          <label className="text-[10px] text-gray-500">
            {getParamLabel(param, lang)}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <input
            type="number"
            min="1"
            max="150"
            value={paramValues[param] || ''}
            onChange={(e) => onParamChange(param, e.target.value)}
            placeholder="1-150"
            className="px-1.5 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 w-14 md:w-16"
          />
        </div>
      );
    }

    if (param === 'I_STATUS') {
      return (
        <div key={param} className="flex flex-col gap-0.5">
          <label className="text-[10px] text-gray-500">{getParamLabel(param, lang)}</label>
          <select
            value={paramValues[param] || ''}
            onChange={(e) => onParamChange(param, e.target.value)}
            className="px-1.5 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:border-red-500 w-20 md:w-24"
          >
            <option value="">{lang === 'ko' ? '전체' : 'All'}</option>
            <option value="01">{lang === 'ko' ? '01-대기' : '01-Wait'}</option>
            <option value="02">{lang === 'ko' ? '02-진행' : '02-Progress'}</option>
            <option value="03">{lang === 'ko' ? '03-완료' : '03-Done'}</option>
          </select>
        </div>
      );
    }

    if (param === 'I_ZASNNO') {
      return (
        <div key={param} className="flex flex-col gap-0.5">
          <label className="text-[10px] text-gray-500">
            {getParamLabel(param, lang)}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <input
            type="text"
            value={paramValues[param] || ''}
            onChange={(e) => onParamChange(param, e.target.value.toUpperCase())}
            placeholder={lang === 'ko' ? 'ASN번호' : 'ASN No'}
            className="px-1.5 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 w-24 md:w-28"
          />
        </div>
      );
    }

    if (param === 'I_MATNR') {
      return (
        <div key={param} className="flex flex-col gap-0.5">
          <label className="text-[10px] text-gray-500">{getParamLabel(param, lang)}</label>
          <input
            type="text"
            value={paramValues[param] || ''}
            onChange={(e) => onParamChange(param, e.target.value.toUpperCase())}
            placeholder={lang === 'ko' ? '자재번호' : 'Material'}
            maxLength={18}
            className="px-1.5 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 w-24 md:w-28"
          />
        </div>
      );
    }

    return (
      <div key={param} className="flex flex-col gap-0.5">
        <label className="text-[10px] text-gray-500">
          {getParamLabel(param, lang)}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
          type="text"
          value={paramValues[param] || ''}
          onChange={(e) => onParamChange(param, e.target.value)}
          className="px-1.5 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 w-16 md:w-20"
        />
      </div>
    );
  };

  return (
    <div className="px-2 md:px-4 py-2 bg-white border-b border-gray-200">
      <div className="flex items-end gap-1 md:gap-2 flex-wrap">
        {currentInterface.params.map(renderParam)}

        <button
          onClick={onQuery}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded text-xs text-white transition-colors font-medium"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {loading ? '...' : (lang === 'ko' ? '조회' : 'Query')}
        </button>

        {isInputInterface && (
          <button
            onClick={onToggleInputMode}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              isInputMode
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="hidden sm:inline">
              {isInputMode ? (lang === 'ko' ? '입력모드 ON' : 'Input ON') : (lang === 'ko' ? '입력' : 'Input')}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export const ParamInputs = memo(ParamInputsComponent);
