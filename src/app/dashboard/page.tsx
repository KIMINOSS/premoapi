'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';

// Config 모듈 import
import {
  INPUT_INTERFACES,
  INTERFACE_CONFIG,
  HMC_INTERFACES,
  KMC_INTERFACES,
  HMC_PLANTS,
  KMC_PLANTS,
  INTERFACE_FIELD_ORDER,
  validateRequiredParams,
  isParamRequired,
} from './config';

// Utils 모듈 import
import {
  DATE_PARAMS,
  toDateInput,
  toYYYYMMDD,
  getParamLabel,
  getFieldLabel,
  convertCodeToLabel,
  getOrderedHeaders,
  formatTime,
} from './utils';

// Components
import AnnouncementBanner from '@/components/admin/AnnouncementBanner';

// Types
import type { TabType, LangType, SubmitResult, DataRow } from './types';

// 동적 메뉴 인터페이스 타입
interface DynamicMenuInterface {
  id: string;
  name: { ko: string; en: string };
  params: string[];
  hidden?: boolean;
  order?: number;
}

interface MenuConfig {
  version: string;
  lastUpdated: string;
  needsUpdate: boolean;
  HMC: DynamicMenuInterface[];
  KMC: DynamicMenuInterface[];
}

export default function Dashboard() {
  // 상태 관리
  const [activeTab, setActiveTab] = useState<TabType>('HMC');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [data, setData] = useState<DataRow[] | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [sessionTime, setSessionTime] = useState(3600);
  const [liveMode, setLiveMode] = useState(true);
  const [tokens, setTokens] = useState<{ HMC: string | null; KMC: string | null }>({ HMC: null, KMC: null });
  const [tokenLoading, setTokenLoading] = useState(false);
  const [lang, setLang] = useState<LangType>('ko');
  const [offlineSwitchCount, setOfflineSwitchCount] = useState(0);
  const [modeLockUntil, setModeLockUntil] = useState<number | null>(null);

  // 입력 모드 상태
  const [isInputMode, setIsInputMode] = useState(false);
  const [inputData, setInputData] = useState<DataRow[]>([]);
  const [headerData, setHeaderData] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 동적 메뉴 상태
  const [dynamicMenus, setDynamicMenus] = useState<MenuConfig | null>(null);
  const [menuVersion, setMenuVersion] = useState<string | null>(null);
  const [menuLoading, setMenuLoading] = useState(true);

  // 동적 메뉴 로드
  const loadDynamicMenus = useCallback(async () => {
    try {
      const versionParam = menuVersion ? `?version=${menuVersion}` : '';
      const response = await fetch(`/api/menus/config${versionParam}`);
      const data = await response.json();

      if (data.success && data.config) {
        // 버전이 변경되었거나 처음 로드인 경우에만 업데이트
        if (data.config.needsUpdate || !dynamicMenus) {
          setDynamicMenus(data.config);
          setMenuVersion(data.config.version);
        }
      }
    } catch (err) {
      console.error('Failed to load menu config:', err);
      // 실패 시 정적 메뉴 사용 (fallback)
    } finally {
      setMenuLoading(false);
    }
  }, [menuVersion, dynamicMenus]);

  // 초기 메뉴 로드
  useEffect(() => {
    loadDynamicMenus();
  }, [loadDynamicMenus]);

  // 동적 또는 정적 인터페이스 선택
  const interfaces = useMemo(() => {
    if (dynamicMenus) {
      return activeTab === 'HMC' ? dynamicMenus.HMC : dynamicMenus.KMC;
    }
    return activeTab === 'HMC' ? HMC_INTERFACES : KMC_INTERFACES;
  }, [activeTab, dynamicMenus]);

  const currentInterface = interfaces[selectedIndex] || interfaces[0];
  const isInputInterface = currentInterface && INPUT_INTERFACES[currentInterface.id];
  const inputConfig = isInputInterface ? INPUT_INTERFACES[currentInterface.id] : null;
  const hasHeaderFields = inputConfig?.headerFields && inputConfig.headerFields.length > 0;

  // 세션 타이머 (LIVE 모드에서만 작동)
  useEffect(() => {
    if (!liveMode) return;
    const timer = setInterval(() => {
      setSessionTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [liveMode]);

  // 모드 잠금 해제 타이머
  useEffect(() => {
    if (!modeLockUntil) return;
    const checkLock = setInterval(() => {
      if (Date.now() >= modeLockUntil) {
        setModeLockUntil(null);
        setOfflineSwitchCount(0);
      }
    }, 1000);
    return () => clearInterval(checkLock);
  }, [modeLockUntil]);

  // 에러 메시지 자동 dismiss (5초 후)
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  // 탭 변경 시 선택 초기화
  useEffect(() => {
    setSelectedIndex(0);
    setData(null);
    setParamValues({});
  }, [activeTab]);

  // 인터페이스 선택 시 파라미터 초기화
  useEffect(() => {
    if (!currentInterface) return;

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
    setParamValues(newParams);
    setData(null);
  }, [selectedIndex, activeTab, currentInterface]);

  // 페이지 로드 시 자동 토큰 인증
  useEffect(() => {
    if (liveMode && !tokens.HMC && !tokens.KMC && !tokenLoading) {
      getAllTokens();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveMode]);

  // OAuth 토큰 발급
  const getAllTokens = async () => {
    setTokenLoading(true);
    try {
      const [hmcRes, kmcRes] = await Promise.all([
        fetch('/api/oauth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company: 'HMC' }) }),
        fetch('/api/oauth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company: 'KMC' }) })
      ]);
      const hmcData = await hmcRes.json();
      const kmcData = await kmcRes.json();
      setTokens({ HMC: hmcData.token || null, KMC: kmcData.token || null });
      setSessionTime(3600);
      return { HMC: hmcData.token, KMC: kmcData.token };
    } catch {
      setError(lang === 'ko' ? 'OAuth 토큰 발급 실패' : 'OAuth token failed');
      return { HMC: null, KMC: null };
    } finally {
      setTokenLoading(false);
    }
  };

  // 엑셀 파일 업로드 핸들러
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as DataRow[];
      setInputData(jsonData);
      setSubmitResult(null);
      setError(null);
    } catch {
      setError(lang === 'ko' ? '엑셀 파일 읽기 실패' : 'Failed to read Excel file');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 입력 데이터 전송 핸들러
  const handleSubmitInput = async () => {
    if (!inputData || inputData.length === 0) {
      setError(lang === 'ko' ? '전송할 데이터가 없습니다' : 'No data to submit');
      return;
    }
    if (!liveMode) {
      setError(lang === 'ko' ? 'LIVE 모드에서만 전송 가능합니다' : 'Only available in LIVE mode');
      return;
    }

    setSubmitLoading(true);
    setSubmitResult(null);
    setError(null);

    try {
      let currentToken = tokens[activeTab];
      if (!currentToken) {
        const newTokens = await getAllTokens();
        currentToken = newTokens[activeTab];
        if (!currentToken) throw new Error(lang === 'ko' ? '토큰이 없습니다' : 'No token');
      }

      const config = INTERFACE_CONFIG[currentInterface.id];
      const moduleCode = activeTab === 'HMC' ? 'MMH' : 'MMK';
      const inDataJson: Record<string, unknown> = {
        I_LIFNR: paramValues['I_LIFNR'] || 'RR4U',
        I_WERKS: paramValues['I_WERKS'] || '',
      };

      if (currentInterface.id === 'MMPM8009') {
        inDataJson['I_ZASNNO'] = paramValues['I_ZASNNO'] || '';
        inDataJson['IT_IMPORT1'] = inputData.filter(row => row['ZASNNO']);
        inDataJson['IT_IMPORT2'] = inputData.filter(row => row['ZASNSEQ']);
      } else {
        if (currentInterface.id === 'MMPM8012') inDataJson['I_BUDAT'] = paramValues['I_BUDAT'] || '';
        else if (currentInterface.id === 'MMPM8015') inDataJson['I_BASEDT'] = paramValues['I_BASEDT'] || '';
        inDataJson['IN_LIST'] = inputData;
      }

      const payload = {
        COMPANY: activeTab === 'HMC' ? 'HMC' : 'KIA',
        SENDER: paramValues['I_LIFNR'] || 'RR4U',
        RECORD_COUNT: String(inputData.length),
        IFID: currentInterface.id,
        SERVICE_CODE: `${paramValues['I_LIFNR'] || 'RR4U'}-${moduleCode}-B-${config.serial}`,
        DOCUMENTTYPE: config.docType,
        TARGET_SYSTEM: 'ERPMM',
        INDATA_JSON: JSON.stringify(inDataJson)
      };

      const response = await fetch('/api/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: activeTab, token: currentToken, payload })
      });
      const json = await response.json();

      if (json.E_IFRESULT === 'S' || json.E_IFRESULT === 'Z') {
        setSubmitResult({ success: true, message: json.E_IFMSG || (lang === 'ko' ? '전송 성공' : 'Submit successful') });
        setInputData([]);
      } else {
        setSubmitResult({ success: false, message: json.E_IFMSG || (lang === 'ko' ? '전송 실패' : 'Submit failed') });
      }
    } catch (err) {
      setSubmitResult({ success: false, message: err instanceof Error ? err.message : (lang === 'ko' ? '오류 발생' : 'Error occurred') });
    } finally {
      setSubmitLoading(false);
    }
  };

  // 입력 필드 계산
  const getInputFields = () => {
    if (!inputConfig) return [];
    return inputConfig.detailFields || inputConfig.fields || [];
  };

  // 입력 데이터 행 추가
  const handleAddInputRow = () => {
    const fields = getInputFields();
    if (fields.length === 0) return;
    const newRow: DataRow = {};
    fields.forEach(field => { newRow[field] = ''; });
    setInputData([...inputData, newRow]);
  };

  // 입력 데이터 행 삭제
  const handleDeleteInputRow = (index: number) => {
    setInputData(inputData.filter((_, i) => i !== index));
  };

  // 입력 셀 수정
  const handleInputCellChange = (rowIndex: number, field: string, value: string) => {
    const newData = [...inputData];
    newData[rowIndex] = { ...newData[rowIndex], [field]: value };
    setInputData(newData);
  };

  // 헤더 데이터 수정
  const handleHeaderChange = (field: string, value: string) => {
    setHeaderData(prev => ({ ...prev, [field]: value }));
  };

  // 샘플 엑셀 다운로드
  const handleDownloadTemplate = async () => {
    if (!inputConfig) return;
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    if (inputConfig.headerFields && inputConfig.detailFields) {
      const headerSample = [inputConfig.headerFields.reduce((acc, field) => { acc[field] = ''; return acc; }, {} as Record<string, string>)];
      const wsHeader = XLSX.utils.json_to_sheet(headerSample);
      XLSX.utils.book_append_sheet(wb, wsHeader, 'Header');
      const detailSample = [inputConfig.detailFields.reduce((acc, field) => { acc[field] = ''; return acc; }, {} as Record<string, string>)];
      const wsDetail = XLSX.utils.json_to_sheet(detailSample);
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail');
    } else {
      const fields = inputConfig.fields || [];
      const sampleData = [fields.reduce((acc, field) => { acc[field] = ''; return acc; }, {} as Record<string, string>)];
      const ws = XLSX.utils.json_to_sheet(sampleData);
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
    }
    XLSX.writeFile(wb, `${currentInterface.id}_template.xlsx`);
  };

  // 조회 핸들러
  const handleQuery = async () => {
    const validation = validateRequiredParams(currentInterface.id, paramValues, lang);
    if (!validation.valid) {
      const errorMsg = lang === 'ko' ? `필수 입력값이 누락되었습니다: ${validation.missingFields.join(', ')}` : `Required fields missing: ${validation.missingFields.join(', ')}`;
      setError(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (liveMode) {
        let currentToken = tokens[activeTab];
        if (!currentToken) {
          const newTokens = await getAllTokens();
          currentToken = newTokens[activeTab];
          if (!currentToken) throw new Error(lang === 'ko' ? '토큰이 없습니다. 연결을 확인하세요.' : 'No token. Check connection.');
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
          setData(Array.isArray(list) ? list : [list]);
        } else {
          setData([]);
        }
      } else {
        const filename = `${activeTab}_${currentInterface.id}_${currentInterface.name.ko}_RR4U_20251101_response.json`;
        const response = await fetch(`/api/responses/${encodeURIComponent(filename)}`);
        if (!response.ok) throw new Error(lang === 'ko' ? '데이터를 불러올 수 없습니다' : 'Cannot load data');
        const json = await response.json();

        if (json.OUTDATA_JSON) {
          const outData = typeof json.OUTDATA_JSON === 'string' ? JSON.parse(json.OUTDATA_JSON) : json.OUTDATA_JSON;
          const list = outData.OUT_LIST || outData.ET_LIST || [];
          setData(Array.isArray(list) ? list : [list]);
        } else {
          setData([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : (lang === 'ko' ? '오류가 발생했습니다' : 'Error occurred'));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // 정렬된 데이터
  const sortedData = useMemo(() => {
    if (!data || !sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = String(a[sortKey] ?? '');
      const bVal = String(b[sortKey] ?? '');
      const cmp = aVal.localeCompare(bVal, 'ko', { numeric: true });
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortOrder]);

  // 헤더 클릭 정렬
  const handleSort = (key: string) => {
    if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('asc'); }
  };

  // CSV 내보내기
  const handleExport = () => {
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
  };

  const handlePrint = () => window.print();

  // 모드 토글 핸들러
  const handleModeToggle = () => {
    const newMode = !liveMode;
    if (newMode && modeLockUntil && Date.now() < modeLockUntil) {
      const remainSec = Math.ceil((modeLockUntil - Date.now()) / 1000);
      setError(lang === 'ko' ? `${remainSec}초 후 LIVE 모드 전환 가능` : `LIVE mode available in ${remainSec}s`);
      return;
    }
    if (!newMode && liveMode) {
      const newCount = offlineSwitchCount + 1;
      setOfflineSwitchCount(newCount);
      if (newCount >= 2) setModeLockUntil(Date.now() + 60000);
    }
    if (newMode && !liveMode) setOfflineSwitchCount(0);
    setLiveMode(newMode);
    if (newMode && !tokens.HMC && !tokens.KMC) getAllTokens();
  };

  // 공장 목록
  const plants = activeTab === 'HMC' ? HMC_PLANTS : KMC_PLANTS;

  // 헤더 결정
  const defaultHeaders = INTERFACE_FIELD_ORDER[currentInterface.id] || [];
  const displayHeaders = data && data.length > 0
    ? getOrderedHeaders(currentInterface.id, Object.keys(data[0]), paramValues['I_ZPLDAYS'] ? parseInt(paramValues['I_ZPLDAYS'], 10) : undefined)
    : getOrderedHeaders(currentInterface.id, defaultHeaders, paramValues['I_ZPLDAYS'] ? parseInt(paramValues['I_ZPLDAYS'], 10) : undefined);

  // 메뉴 로딩 중 스켈레톤
  if (menuLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">{lang === 'ko' ? '메뉴 로딩 중...' : 'Loading menu...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Image src="https://grupopremo.com/cdn/shop/files/logo_christmas_2_770x255.gif?v=1765881926" alt="PREMO" width={120} height={32} className="h-8 w-auto" unoptimized />
            <span className="font-semibold text-lg text-gray-800">PREMO KOREA</span>
            <span className="text-gray-400">|</span>
            <span className="text-sm font-bold text-gray-600">HKMC MM Module API Caller</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 라이브 모드 토글 */}
          <div className="flex items-center gap-2">
            <span className={`text-sm ${liveMode ? 'text-green-600' : 'text-gray-500'}`}>{liveMode ? 'LIVE' : 'OFFLINE'}</span>
            <button onClick={handleModeToggle} disabled={!liveMode && modeLockUntil !== null && Date.now() < modeLockUntil}
              className={`relative w-12 h-6 rounded-full transition-colors ${liveMode ? 'bg-green-500' : modeLockUntil ? 'bg-red-300' : 'bg-gray-300'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${liveMode ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* 토큰 상태 */}
          {liveMode && (
            <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full transition-all duration-300 ${
              tokenLoading ? 'bg-blue-50 text-blue-700 border border-blue-200' : tokens[activeTab] ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            }`}>
              {tokenLoading ? (
                <>
                  <div className="relative"><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg></div>
                  <span className="font-medium">{lang === 'ko' ? '연결중...' : 'Connecting...'}</span>
                </>
              ) : tokens[activeTab] ? (
                <>
                  <div className="relative flex items-center justify-center"><span className="absolute w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75"></span><span className="relative w-2.5 h-2.5 bg-green-500 rounded-full"></span></div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
                    <span className="font-medium">{lang === 'ko' ? '연결됨' : 'Connected'}</span>
                  </div>
                </>
              ) : (
                <><span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span><span className="font-medium">{lang === 'ko' ? '대기중' : 'Standby'}</span></>
              )}
            </div>
          )}

          {/* 세션 타이머 */}
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-mono">{formatTime(sessionTime)}</span>
          </div>

          {/* 한영전환 */}
          <button onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium text-gray-600 transition-colors">
            {lang === 'ko' ? 'EN' : '한'}
          </button>

          {/* 새로고침 */}
          <button onClick={loadDynamicMenus} className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500" title={lang === 'ko' ? '메뉴 새로고침' : 'Refresh Menu'}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>

          {/* 로그아웃 */}
          <button onClick={() => window.location.href = '/login'} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title={lang === 'ko' ? '로그아웃' : 'Logout'}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바 */}
        <aside className={`w-48 bg-white border-r-2 flex flex-col transition-all duration-500 ${activeTab === 'HMC' ? 'border-blue-400' : 'border-red-400'}`}>
          <div className="text-[10px] text-gray-400 text-center py-1 bg-gray-50 border-b border-gray-100">{lang === 'ko' ? '고객사 선택' : 'Select Customer'}</div>
          <div className="flex p-1 gap-1 bg-gray-100 border-b border-gray-200">
            <button onClick={() => { setActiveTab('HMC'); setSelectedIndex(0); }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all shadow-sm ${activeTab === 'HMC' ? 'bg-blue-500 text-white ring-2 ring-blue-300 ring-offset-1' : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'}`}>
              {lang === 'ko' ? '현대' : 'Hyundai'}
            </button>
            <button onClick={() => { setActiveTab('KMC'); setSelectedIndex(0); }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all shadow-sm ${activeTab === 'KMC' ? 'bg-red-500 text-white ring-2 ring-red-300 ring-offset-1' : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200'}`}>
              {lang === 'ko' ? '기아' : 'Kia'}
            </button>
          </div>
          <div className={`px-3 py-2 border-b-2 flex items-center justify-between ${activeTab === 'HMC' ? 'border-blue-400 bg-blue-50' : 'border-red-400 bg-red-50'}`}>
            <span className={`text-lg font-bold ${activeTab === 'HMC' ? 'text-blue-700' : 'text-red-700'}`}>{activeTab}</span>
            <span className="text-sm font-medium text-gray-500">{interfaces.length}</span>
          </div>

          <nav className="flex-1 overflow-y-auto p-1">
            {interfaces.map((iface, index) => (
              <button key={`${activeTab}-${iface.id}`} onClick={() => setSelectedIndex(index)}
                className={`w-full text-left px-2 py-1 rounded transition-all ${selectedIndex === index ? 'bg-red-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                <span className="text-sm">{(index + 1).toString().padStart(2, '0')} {iface.name[lang]}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* 메인 컨텐츠 */}
        <main className={`flex-1 flex flex-col overflow-hidden bg-gray-50 border-t-2 transition-all duration-500 ${activeTab === 'HMC' ? 'border-blue-400' : 'border-red-400'}`}>
          {/* 공지사항 배너 */}
          <div className="px-4 pt-4">
            <AnnouncementBanner location="dashboard" lang={lang} />
          </div>

          {/* 상단 바 */}
          <div className="px-4 py-2 border-b border-gray-200 bg-white flex items-center justify-between">
            <div>
              <h1 className="text-sm font-semibold text-gray-800">{currentInterface.name[lang]}</h1>
              <p className="text-[10px] text-gray-500">{data ? `Total: ${data.length}` : (lang === 'ko' ? '조회하세요' : 'Query')}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={handlePrint} disabled={!data || data.length === 0} className="flex items-center gap-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs text-gray-700">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                {lang === 'ko' ? '인쇄' : 'Print'}
              </button>
              <button onClick={handleExport} disabled={!data || data.length === 0} className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs text-white">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                {lang === 'ko' ? '엑셀' : 'Excel'}
              </button>
            </div>
          </div>

          {/* INPUT DATA 입력 영역 */}
          <div className="px-4 py-2 bg-white border-b border-gray-200">
            <div className="flex items-end gap-2 flex-wrap">
              {currentInterface.params.map((param) => {
                if (param === 'I_WERKS') {
                  return (
                    <div key={param} className="flex flex-col gap-0.5">
                      <label className="text-[10px] text-gray-500">{getParamLabel(param, lang)}{isParamRequired(currentInterface.id, param) && <span className="text-red-500 ml-0.5">*</span>}</label>
                      <select value={paramValues[param] || ''} onChange={(e) => setParamValues({ ...paramValues, [param]: e.target.value })}
                        className="px-1.5 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:border-red-500 w-36">
                        {plants.map((plant) => (<option key={plant.code} value={plant.code}>{plant.code ? `${plant.code} ${plant.name[lang]}` : plant.name[lang]}</option>))}
                      </select>
                    </div>
                  );
                }
                if (DATE_PARAMS.includes(param)) {
                  return (
                    <div key={param} className="flex flex-col gap-0.5">
                      <label className="text-[10px] text-gray-500">{getParamLabel(param, lang)}{isParamRequired(currentInterface.id, param) && <span className="text-red-500 ml-0.5">*</span>}</label>
                      <div className="flex gap-0.5 items-center">
                        <input type="text" value={paramValues[param] || ''} onChange={(e) => setParamValues({ ...paramValues, [param]: e.target.value })} placeholder="YYYYMMDD" maxLength={8}
                          className="px-1.5 py-1 bg-gray-100 border border-gray-300 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 w-20" />
                        <label className="relative cursor-pointer p-1 hover:bg-gray-100 rounded transition-colors">
                          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <input type="date" value={toDateInput(paramValues[param] || '')} onChange={(e) => setParamValues({ ...paramValues, [param]: toYYYYMMDD(e.target.value) })} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </label>
                      </div>
                    </div>
                  );
                }
                if (param === 'I_SPMON') {
                  return (
                    <div key={param} className="flex flex-col gap-0.5">
                      <label className="text-[10px] text-gray-500">{getParamLabel(param, lang)}{isParamRequired(currentInterface.id, param) && <span className="text-red-500 ml-0.5">*</span>}</label>
                      <div className="flex gap-0.5 items-center">
                        <input type="text" value={paramValues[param] || ''} onChange={(e) => setParamValues({ ...paramValues, [param]: e.target.value })} placeholder="YYYYMM" maxLength={6}
                          className="px-1.5 py-1 bg-gray-100 border border-gray-300 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 w-16" />
                        <label className="relative cursor-pointer p-1 hover:bg-gray-100 rounded transition-colors">
                          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <input type="month" value={paramValues[param] ? `${paramValues[param].slice(0, 4)}-${paramValues[param].slice(4, 6)}` : ''} onChange={(e) => setParamValues({ ...paramValues, [param]: e.target.value.replace('-', '') })} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </label>
                      </div>
                    </div>
                  );
                }
                // I_ZPLDAYS: 숫자 입력 (1-150)
                if (param === 'I_ZPLDAYS') {
                  return (
                    <div key={param} className="flex flex-col gap-0.5">
                      <label className="text-[10px] text-gray-500">{getParamLabel(param, lang)}{isParamRequired(currentInterface.id, param) && <span className="text-red-500 ml-0.5">*</span>}</label>
                      <input type="number" min="1" max="150" value={paramValues[param] || ''} onChange={(e) => setParamValues({ ...paramValues, [param]: e.target.value })} placeholder="1-150"
                        className="px-1.5 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 w-16" />
                    </div>
                  );
                }
                // I_STATUS: 상태 선택 드롭다운
                if (param === 'I_STATUS') {
                  return (
                    <div key={param} className="flex flex-col gap-0.5">
                      <label className="text-[10px] text-gray-500">{getParamLabel(param, lang)}</label>
                      <select value={paramValues[param] || ''} onChange={(e) => setParamValues({ ...paramValues, [param]: e.target.value })}
                        className="px-1.5 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:border-red-500 w-24">
                        <option value="">{lang === 'ko' ? '전체' : 'All'}</option>
                        <option value="01">{lang === 'ko' ? '01-대기' : '01-Wait'}</option>
                        <option value="02">{lang === 'ko' ? '02-진행' : '02-Progress'}</option>
                        <option value="03">{lang === 'ko' ? '03-완료' : '03-Done'}</option>
                      </select>
                    </div>
                  );
                }
                // I_ZASNNO: ASN번호 입력 (힌트 추가)
                if (param === 'I_ZASNNO') {
                  return (
                    <div key={param} className="flex flex-col gap-0.5">
                      <label className="text-[10px] text-gray-500">{getParamLabel(param, lang)}{isParamRequired(currentInterface.id, param) && <span className="text-red-500 ml-0.5">*</span>}</label>
                      <input type="text" value={paramValues[param] || ''} onChange={(e) => setParamValues({ ...paramValues, [param]: e.target.value.toUpperCase() })} placeholder={lang === 'ko' ? 'ASN번호' : 'ASN No'}
                        className="px-1.5 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 w-28" />
                    </div>
                  );
                }
                // I_MATNR: 자재번호 입력 (힌트 추가)
                if (param === 'I_MATNR') {
                  return (
                    <div key={param} className="flex flex-col gap-0.5">
                      <label className="text-[10px] text-gray-500">{getParamLabel(param, lang)}</label>
                      <input type="text" value={paramValues[param] || ''} onChange={(e) => setParamValues({ ...paramValues, [param]: e.target.value.toUpperCase() })} placeholder={lang === 'ko' ? '자재번호' : 'Material'} maxLength={18}
                        className="px-1.5 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 w-28" />
                    </div>
                  );
                }
                // 기본 텍스트 입력
                return (
                  <div key={param} className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-gray-500">{getParamLabel(param, lang)}{isParamRequired(currentInterface.id, param) && <span className="text-red-500 ml-0.5">*</span>}</label>
                    <input type="text" value={paramValues[param] || ''} onChange={(e) => setParamValues({ ...paramValues, [param]: e.target.value })} placeholder=""
                      className="px-1.5 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 w-20" />
                  </div>
                );
              })}

              <button onClick={handleQuery} disabled={loading} className="flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded text-xs text-white transition-colors">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                {loading ? (lang === 'ko' ? '조회중' : 'Load') : (lang === 'ko' ? '조회' : 'Query')}
              </button>

              {isInputInterface && (
                <button onClick={() => { setIsInputMode(!isInputMode); setInputData([]); setHeaderData({}); setSubmitResult(null); }}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${isInputMode ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  {isInputMode ? (lang === 'ko' ? '입력모드 ON' : 'Input ON') : (lang === 'ko' ? '입력' : 'Input')}
                </button>
              )}
            </div>
          </div>

          {/* 입력 모드 UI */}
          {isInputMode && inputConfig && (
            <div className="px-4 py-3 bg-orange-50 border-b border-orange-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-orange-800">{inputConfig.description[lang]}</span>
                  <span className="text-xs text-orange-600">({inputData.length} {lang === 'ko' ? '건' : 'rows'})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleDownloadTemplate} className="flex items-center gap-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs text-gray-700">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {lang === 'ko' ? '템플릿' : 'Template'}
                  </button>
                  <input type="file" ref={fileInputRef} accept=".xlsx,.xls" onChange={handleExcelUpload} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-white">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    {lang === 'ko' ? '엑셀' : 'Excel'}
                  </button>
                  <button onClick={handleAddInputRow} className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 rounded text-xs text-white">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    {lang === 'ko' ? '+ 상세' : '+ Detail'}
                  </button>
                  <button onClick={handleSubmitInput} disabled={submitLoading || inputData.length === 0 || !liveMode} className="flex items-center gap-1 px-3 py-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded text-xs text-white font-medium">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    {submitLoading ? '...' : (lang === 'ko' ? '전송' : 'Send')}
                  </button>
                </div>
              </div>

              {submitResult && (
                <div className={`px-3 py-2 rounded text-xs mb-3 ${submitResult.success ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                  {submitResult.message}
                </div>
              )}

              {hasHeaderFields && inputConfig.headerFields && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-orange-700 mb-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    {lang === 'ko' ? '출하 정보 (헤더)' : 'Shipment Info (Header)'}
                  </div>
                  <div className="bg-white rounded border border-orange-200 p-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {inputConfig.headerFields.map(field => (
                        <div key={field} className="flex flex-col">
                          <label className="text-[10px] text-gray-500 mb-0.5 truncate" title={getFieldLabel(field, lang)}>{getFieldLabel(field, lang)}</label>
                          <input type="text" value={headerData[field] || ''} onChange={(e) => handleHeaderChange(field, e.target.value)} placeholder={field}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:border-orange-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {getInputFields().length > 0 && (
                <>
                  {hasHeaderFields && (
                    <div className="text-xs font-medium text-orange-700 mb-2 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                      {lang === 'ko' ? '부품 상세 (N건)' : 'Part Details (N rows)'}
                    </div>
                  )}
                  {inputData.length > 0 ? (
                    <div className="bg-white rounded border border-orange-200 overflow-x-auto max-h-40">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-orange-100">
                          <tr>
                            <th className="px-1.5 py-1 text-left text-orange-800 border-b border-orange-200 w-8">#</th>
                            {getInputFields().map(field => (<th key={field} className="px-1.5 py-1 text-left text-orange-800 border-b border-orange-200 whitespace-nowrap text-[11px]">{getFieldLabel(field, lang)}</th>))}
                            <th className="px-1.5 py-1 text-center text-orange-800 border-b border-orange-200 w-8">x</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inputData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-orange-50">
                              <td className="px-1.5 py-0.5 border-b border-orange-100 text-gray-400 text-[10px]">{rowIndex + 1}</td>
                              {getInputFields().map(field => (
                                <td key={field} className="px-0.5 py-0.5 border-b border-orange-100">
                                  <input type="text" value={String(row[field] || '')} onChange={(e) => handleInputCellChange(rowIndex, field, e.target.value)}
                                    className="w-full min-w-[60px] px-1 py-0.5 border border-gray-200 rounded text-[11px] focus:outline-none focus:border-orange-400" />
                                </td>
                              ))}
                              <td className="px-1 py-0.5 border-b border-orange-100 text-center">
                                <button onClick={() => handleDeleteInputRow(rowIndex)} className="text-red-400 hover:text-red-600">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-orange-600 text-xs bg-white rounded border border-orange-200">
                      {lang === 'ko' ? '[+ 상세] 버튼으로 부품 정보를 추가하세요' : 'Click [+ Detail] to add parts'}
                    </div>
                  )}
                </>
              )}

              {!hasHeaderFields && inputData.length === 0 && (
                <div className="text-center py-4 text-orange-600 text-sm">
                  {lang === 'ko' ? '엑셀 파일을 업로드하거나 [행 추가] 버튼을 클릭하세요' : 'Upload Excel file or click [Add Row] button'}
                </div>
              )}
            </div>
          )}

          {/* 데이터 테이블 */}
          <div className="flex-1 overflow-auto p-2">
            {error && (<div className="bg-red-100 border border-red-300 text-red-600 px-4 py-3 rounded-lg mb-4">{error}</div>)}
            {loading && (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div></div>)}

            {!loading && (
              <div className="bg-white rounded overflow-hidden border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs text-gray-500">{lang === 'ko' ? '컬럼:' : 'Cols:'}</span>
                  <span className="text-xs font-medium text-gray-700">{displayHeaders.length}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-xs text-gray-500">{lang === 'ko' ? '좌우 키로 스크롤' : 'Use arrow keys to scroll'}</span>
                  <div className="flex-1" />
                  {(!data || data.length === 0) && (<span className="text-xs text-orange-500 font-medium animate-pulse">{lang === 'ko' ? '조회 대기중...' : 'Awaiting query...'}</span>)}
                  <button onClick={() => { const el = document.getElementById('data-table'); if(el) el.scrollLeft = 0; }} className="px-2 py-0.5 text-xs bg-gray-200 hover:bg-gray-300 rounded">{lang === 'ko' ? '처음' : 'First'}</button>
                  <button onClick={() => { const el = document.getElementById('data-table'); if(el) el.scrollLeft = el.scrollWidth; }} className="px-2 py-0.5 text-xs bg-gray-200 hover:bg-gray-300 rounded">{lang === 'ko' ? '끝' : 'End'}</button>
                </div>
                <div id="data-table" className="overflow-x-auto overflow-y-auto flex-1" style={{scrollbarWidth: 'auto', scrollbarColor: '#94a3b8 #e2e8f0', height: 'calc(100vh - 280px)'}}>
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gray-100">
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600 border-b border-gray-200 bg-gray-100 sticky left-0 z-20">#</th>
                        {displayHeaders.map((key) => (
                          <th key={key} className="px-2 py-1.5 text-left font-medium text-gray-600 border-b border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100" onClick={() => handleSort(key)}>
                            {getFieldLabel(key, lang)}{sortKey === key && (sortOrder === 'asc' ? ' ^' : ' v')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data && data.length > 0 ? (
                        (sortedData || []).map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-2 py-1 border-b border-gray-100 text-gray-500 bg-white sticky left-0 z-10">{idx + 1}</td>
                            {displayHeaders.map((key, i) => (<td key={i} className="px-2 py-1 border-b border-gray-100 text-gray-800 whitespace-nowrap">{convertCodeToLabel(key, row[key], activeTab, lang)}</td>))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={displayHeaders.length + 1} className="px-4 py-32 text-center text-gray-400">
                            <div className="flex flex-col items-center gap-3">
                              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              <span className="text-base">{lang === 'ko' ? '조회 버튼을 클릭하세요' : 'Click Query button'}</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 상태바 */}
          <div className="px-6 py-2 bg-white border-t border-gray-200 text-sm text-gray-500 flex justify-between items-center">
            <span>{data && data.length > 0 ? (<>Ready | Rows: {data.length} | Columns: {Object.keys(data[0]).length}</>) : (<>Ready | Columns: {(INTERFACE_FIELD_ORDER[currentInterface.id] || []).length}</>)}</span>
            <span className="text-xs text-gray-400">Developed by Minho Kim{dynamicMenus && ` | Menu v${dynamicMenus.version}`}</span>
          </div>
        </main>
      </div>
    </div>
  );
}
