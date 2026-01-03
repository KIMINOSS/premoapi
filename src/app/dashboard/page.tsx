'use client';

import React, { useEffect, useMemo, useRef, useCallback } from 'react';

// Config & Utils
import {
  INPUT_INTERFACES,
  INTERFACE_CONFIG,
  HMC_INTERFACES,
  KMC_INTERFACES,
  INTERFACE_FIELD_ORDER,
  validateRequiredParams,
} from './config';
import {
  DATE_PARAMS,
  getFieldLabel,
  convertCodeToLabel,
  getOrderedHeaders,
} from './utils';

// Components
import { Header, Sidebar, DataTable, MobileCardView, ParamInputs, InputModePanel } from './components';
import AnnouncementBanner from '@/components/admin/AnnouncementBanner';

// Hooks
import { useDashboardState, useMenuConfig } from './hooks/useDashboardState';

// Types
import type { DataRow } from './types';

export default function Dashboard() {
  // State management hook
  const [state, actions] = useDashboardState();
  const { menus, loading: menuLoading } = useMenuConfig();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    activeTab, selectedIndex, data, loading, error, paramValues,
    sessionTime, liveMode, tokens, tokenLoading, lang,
    sortKey, sortOrder, isInputMode, inputData, headerData,
    submitLoading, submitResult, sidebarOpen,
  } = state;

  // Interface selection
  const interfaces = useMemo(() => {
    if (menus) {
      return activeTab === 'HMC' ? menus.HMC : menus.KMC;
    }
    return activeTab === 'HMC' ? HMC_INTERFACES : KMC_INTERFACES;
  }, [activeTab, menus]);

  const currentInterface = interfaces[selectedIndex] || interfaces[0];
  const isInputInterface = currentInterface && INPUT_INTERFACES[currentInterface.id];
  const inputConfig = isInputInterface ? INPUT_INTERFACES[currentInterface.id] : null;

  // OAuth token fetch
  const getAllTokens = useCallback(async () => {
    actions.setTokenLoading(true);
    try {
      const [hmcRes, kmcRes] = await Promise.all([
        fetch('/api/oauth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company: 'HMC' }) }),
        fetch('/api/oauth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company: 'KMC' }) })
      ]);
      const [hmcData, kmcData] = await Promise.all([hmcRes.json(), kmcRes.json()]);
      actions.setTokens({ HMC: hmcData.token || null, KMC: kmcData.token || null });
      return { HMC: hmcData.token, KMC: kmcData.token };
    } catch {
      actions.setError(lang === 'ko' ? 'OAuth 토큰 발급 실패' : 'OAuth token failed');
      return { HMC: null, KMC: null };
    } finally {
      actions.setTokenLoading(false);
    }
  }, [actions, lang]);

  // Initial token fetch
  useEffect(() => {
    if (liveMode && !tokens.HMC && !tokens.KMC && !tokenLoading) {
      getAllTokens();
    }
  }, [liveMode, tokens, tokenLoading, getAllTokens]);

  // Tab change handler - 캐시된 데이터 없으면 null로 초기화
  useEffect(() => {
    // 탭 변경 시에는 캐시를 먼저 확인하지 않음 (인터페이스 선택 시 처리)
    actions.setParamValues({});
  }, [activeTab, actions]);

  // Interface change: init params or restore from cache
  useEffect(() => {
    if (!currentInterface) return;

    // 캐시된 데이터 확인
    const cached = actions.getCachedData(currentInterface.id);
    if (cached) {
      // 캐시된 데이터와 파라미터 복원
      actions.setData(cached.data);
      actions.setParamValues(cached.params);
      return;
    }

    // 캐시 없으면 기본값으로 초기화
    const newParams: Record<string, string> = {};
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const thisMonth = new Date().toISOString().slice(0, 7).replace('-', '');

    currentInterface.params.forEach((p) => {
      if (p === 'I_LIFNR') newParams[p] = 'RR4U';
      else if (p === 'I_SPMON') newParams[p] = thisMonth;
      else if (DATE_PARAMS.includes(p)) newParams[p] = today;
      else if (p === 'I_WERKS') newParams[p] = '';
      else if (p === 'I_ZPLDAYS') newParams[p] = '150';
      else if (p === 'I_STATUS') newParams[p] = '';
      else newParams[p] = '';
    });
    actions.setParamValues(newParams);
    actions.setData(null);
  }, [selectedIndex, activeTab, currentInterface, actions]);

  // Query handler
  const handleQuery = useCallback(async () => {
    const validation = validateRequiredParams(currentInterface.id, paramValues, lang);
    if (!validation.valid) {
      actions.setError(lang === 'ko'
        ? `필수 입력값 누락: ${validation.missingFields.join(', ')}`
        : `Required fields missing: ${validation.missingFields.join(', ')}`);
      return;
    }

    actions.setLoading(true);
    actions.setError(null);

    try {
      if (liveMode) {
        let currentToken = tokens[activeTab];
        if (!currentToken) {
          const newTokens = await getAllTokens();
          currentToken = newTokens[activeTab];
          if (!currentToken) throw new Error(lang === 'ko' ? '토큰이 없습니다' : 'No token');
        }

        const config = INTERFACE_CONFIG[currentInterface.id];
        const moduleCode = activeTab === 'HMC' ? 'MMH' : 'MMK';
        const payload = {
          COMPANY: activeTab === 'HMC' ? 'HMC' : 'KIA',
          SENDER: paramValues['I_LIFNR'] || 'RR4U',
          RECORD_COUNT: '1',
          IFID: currentInterface.id,
          SERVICE_CODE: `${paramValues['I_LIFNR'] || 'RR4U'}-${moduleCode}-B-${config.serial}`,
          DOCUMENTTYPE: config.docType,
          TARGET_SYSTEM: 'ERPMM',
          INDATA_JSON: JSON.stringify(paramValues)
        };

        const response = await fetch('/api/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company: activeTab, token: currentToken, payload })
        });
        const json = await response.json();

        if (json.E_IFRESULT === 'E') {
          const errMsg = json.E_IFMSG || '';
          if (!errMsg.includes('30일') && !errMsg.includes('30 day') && !errMsg.includes('exceed')) {
            throw new Error(errMsg || (lang === 'ko' ? '조회 실패' : 'Query failed'));
          }
        }

        if (json.OUTDATA_JSON) {
          const outData = typeof json.OUTDATA_JSON === 'string' ? JSON.parse(json.OUTDATA_JSON) : json.OUTDATA_JSON;
          const list = outData.OUT_LIST || outData.ET_LIST || outData.ET_EXPORT_1 || [];
          const resultData = Array.isArray(list) ? list : [list];
          actions.setData(resultData);
          // 캐시에 저장
          actions.cacheData(currentInterface.id, resultData, paramValues);
        } else {
          actions.setData([]);
        }
      } else {
        const filename = `${activeTab}_${currentInterface.id}_${currentInterface.name.ko}_RR4U_20251101_response.json`;
        const response = await fetch(`/api/responses/${encodeURIComponent(filename)}`);
        if (!response.ok) throw new Error(lang === 'ko' ? '데이터 로드 실패' : 'Cannot load data');
        const json = await response.json();

        if (json.OUTDATA_JSON) {
          const outData = typeof json.OUTDATA_JSON === 'string' ? JSON.parse(json.OUTDATA_JSON) : json.OUTDATA_JSON;
          const list = outData.OUT_LIST || outData.ET_LIST || [];
          const resultData = Array.isArray(list) ? list : [list];
          actions.setData(resultData);
          // 캐시에 저장
          actions.cacheData(currentInterface.id, resultData, paramValues);
        } else {
          actions.setData([]);
        }
      }
    } catch (err) {
      actions.setError(err instanceof Error ? err.message : (lang === 'ko' ? '오류 발생' : 'Error occurred'));
      actions.setData(null);
    } finally {
      actions.setLoading(false);
    }
  }, [currentInterface, paramValues, lang, liveMode, tokens, activeTab, getAllTokens, actions]);

  // Sort handler
  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      actions.toggleSortOrder();
    } else {
      actions.setSortKey(key);
    }
  }, [sortKey, actions]);

  // Export to CSV
  const handleExport = useCallback(() => {
    if (!data || data.length === 0) return;
    const headers = getOrderedHeaders(currentInterface.id, Object.keys(data[0]), paramValues['I_ZPLDAYS'] ? parseInt(paramValues['I_ZPLDAYS'], 10) : undefined);
    const headerLabels = headers.map(h => getFieldLabel(h, lang));
    const csvContent = [
      headerLabels.join(','),
      ...data.map(row => headers.map(h => `"${convertCodeToLabel(h, row[h], activeTab, lang)}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_${currentInterface.name[lang]}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, currentInterface, paramValues, lang, activeTab]);

  // Display headers
  const displayHeaders = useMemo(() => {
    const defaultHeaders = INTERFACE_FIELD_ORDER[currentInterface.id] || [];
    if (data && data.length > 0) {
      return getOrderedHeaders(currentInterface.id, Object.keys(data[0]), paramValues['I_ZPLDAYS'] ? parseInt(paramValues['I_ZPLDAYS'], 10) : undefined);
    }
    return getOrderedHeaders(currentInterface.id, defaultHeaders, paramValues['I_ZPLDAYS'] ? parseInt(paramValues['I_ZPLDAYS'], 10) : undefined);
  }, [data, currentInterface.id, paramValues]);

  // Loading skeleton
  if (menuLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">{lang === 'ko' ? '메뉴 로딩 중...' : 'Loading menu...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex flex-col">
      {/* Header */}
      <Header
        activeTab={activeTab}
        lang={lang}
        liveMode={liveMode}
        tokenLoading={tokenLoading}
        tokens={tokens}
        sessionTime={sessionTime}
        modeLockUntil={null}
        onModeToggle={() => actions.setLiveMode(!liveMode)}
        onLangToggle={() => actions.setLang(lang === 'ko' ? 'en' : 'ko')}
        onSidebarToggle={() => actions.setSidebarOpen(!sidebarOpen)}
        onLogout={() => window.location.href = '/login'}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          selectedIndex={selectedIndex}
          interfaces={interfaces}
          lang={lang}
          sidebarOpen={sidebarOpen}
          onTabChange={(tab) => { actions.setActiveTab(tab); actions.setSelectedIndex(0); }}
          onInterfaceSelect={actions.setSelectedIndex}
          onClose={() => actions.setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className={`flex-1 flex flex-col overflow-hidden bg-gray-50 border-t-2 transition-all duration-500 ${activeTab === 'HMC' ? 'border-blue-400' : 'border-red-400'}`}>
          {/* Announcement */}
          <div className="px-2 md:px-4 pt-2 md:pt-4">
            <AnnouncementBanner location="dashboard" lang={lang} />
          </div>

          {/* Toolbar */}
          <div className="px-2 md:px-4 py-2 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-sm font-semibold text-gray-800">{currentInterface.name[lang]}</h1>
              <p className="text-[10px] text-gray-500">{data ? `Total: ${data.length}` : (lang === 'ko' ? '조회하세요' : 'Query')}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => window.print()} disabled={!data || data.length === 0} className="flex items-center gap-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs text-gray-700">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                <span className="hidden sm:inline">{lang === 'ko' ? '인쇄' : 'Print'}</span>
              </button>
              <button onClick={handleExport} disabled={!data || data.length === 0} className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs text-white">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span className="hidden sm:inline">{lang === 'ko' ? '엑셀' : 'Excel'}</span>
              </button>
            </div>
          </div>

          {/* Parameter Inputs */}
          <ParamInputs
            currentInterface={currentInterface}
            paramValues={paramValues}
            lang={lang}
            activeTab={activeTab}
            loading={loading}
            isInputInterface={!!isInputInterface}
            isInputMode={isInputMode}
            onParamChange={(key, value) => actions.setParamValues({ ...paramValues, [key]: value })}
            onQuery={handleQuery}
            onToggleInputMode={() => {
              actions.setIsInputMode(!isInputMode);
              actions.setInputData([]);
              actions.setHeaderData({});
              actions.setSubmitResult(null);
            }}
          />

          {/* Input Mode Panel */}
          {isInputMode && inputConfig && (
            <InputModePanel
              inputConfig={inputConfig}
              inputData={inputData}
              headerData={headerData}
              lang={lang}
              submitLoading={submitLoading}
              submitResult={submitResult}
              liveMode={liveMode}
              fileInputRef={fileInputRef}
              onInputDataChange={actions.setInputData}
              onHeaderDataChange={(field, value) => actions.setHeaderData({ ...headerData, [field]: value })}
              onSubmit={async () => {/* Submit logic */}}
            />
          )}

          {/* Data Display Area - Full height */}
          <div className="flex-1 flex flex-col overflow-hidden p-2">
            {error && (
              <div className="bg-red-100 border border-red-300 text-red-600 px-3 py-2 rounded-lg mb-2 text-sm flex-shrink-0">
                {error}
              </div>
            )}
            {loading && (
              <div className="flex items-center justify-center flex-1">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent" />
              </div>
            )}

            {!loading && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile: Card View */}
                <div className="block md:hidden flex-1 overflow-auto">
                  <MobileCardView
                    data={data}
                    headers={displayHeaders}
                    interfaceId={currentInterface.id}
                    activeTab={activeTab}
                    lang={lang}
                    sortKey={sortKey}
                    sortOrder={sortOrder}
                  />
                </div>

                {/* Desktop: Virtual Scroll Table - Full height */}
                <div className="hidden md:flex flex-1 flex-col overflow-hidden">
                  <DataTable
                    data={data}
                    headers={displayHeaders}
                    interfaceId={currentInterface.id}
                    activeTab={activeTab}
                    lang={lang}
                    sortKey={sortKey}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    zplDays={paramValues['I_ZPLDAYS'] ? parseInt(paramValues['I_ZPLDAYS'], 10) : undefined}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="px-3 md:px-6 py-2 bg-white border-t border-gray-200 text-xs md:text-sm text-gray-500 flex justify-between items-center">
            <span>{data && data.length > 0 ? `Rows: ${data.length}` : 'Ready'}</span>
            <span className="text-[10px] md:text-xs text-gray-400">
              Minho Kim{menus && ` | v${menus.version}`}
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}
