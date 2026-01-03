'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { TabType, LangType, DataRow, SubmitResult } from '../types';

// 데이터 캐시 타입
interface DataCache {
  [key: string]: {
    data: DataRow[];
    params: Record<string, string>;
    timestamp: number;
  };
}

// 통합 상태 타입
interface DashboardState {
  // 기본 상태
  activeTab: TabType;
  selectedIndex: number;
  data: DataRow[] | null;
  loading: boolean;
  error: string | null;
  paramValues: Record<string, string>;

  // 세션/모드
  sessionTime: number;
  liveMode: boolean;
  lang: LangType;

  // 토큰
  tokens: { HMC: string | null; KMC: string | null };
  tokenLoading: boolean;

  // 정렬
  sortKey: string | null;
  sortOrder: 'asc' | 'desc';

  // 입력 모드
  isInputMode: boolean;
  inputData: DataRow[];
  headerData: Record<string, string>;
  submitLoading: boolean;
  submitResult: SubmitResult | null;

  // UI
  sidebarOpen: boolean;
}

interface DashboardActions {
  setActiveTab: (tab: TabType) => void;
  setSelectedIndex: (index: number) => void;
  setData: (data: DataRow[] | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setParamValues: (values: Record<string, string>) => void;
  updateParamValue: (key: string, value: string) => void;
  setLiveMode: (mode: boolean) => void;
  setLang: (lang: LangType) => void;
  setTokens: (tokens: { HMC: string | null; KMC: string | null }) => void;
  setTokenLoading: (loading: boolean) => void;
  setSortKey: (key: string | null) => void;
  toggleSortOrder: () => void;
  setIsInputMode: (mode: boolean) => void;
  setInputData: (data: DataRow[]) => void;
  setHeaderData: (data: Record<string, string>) => void;
  setSubmitLoading: (loading: boolean) => void;
  setSubmitResult: (result: SubmitResult | null) => void;
  setSidebarOpen: (open: boolean) => void;
  resetSession: () => void;
  // 데이터 캐싱
  cacheData: (interfaceId: string, data: DataRow[], params: Record<string, string>) => void;
  getCachedData: (interfaceId: string) => { data: DataRow[]; params: Record<string, string> } | null;
  clearCache: () => void;
}

const INITIAL_STATE: DashboardState = {
  activeTab: 'HMC',
  selectedIndex: 0,
  data: null,
  loading: false,
  error: null,
  paramValues: {},
  sessionTime: 3600,
  liveMode: true,
  lang: 'ko',
  tokens: { HMC: null, KMC: null },
  tokenLoading: false,
  sortKey: null,
  sortOrder: 'asc',
  isInputMode: false,
  inputData: [],
  headerData: {},
  submitLoading: false,
  submitResult: null,
  sidebarOpen: false,
};

const DATA_CACHE_TTL = 10 * 60 * 1000; // 10분

export function useDashboardState(): [DashboardState, DashboardActions] {
  const [state, setState] = useState<DashboardState>(INITIAL_STATE);
  const dataCacheRef = useRef<DataCache>({});

  // 세션 타이머 (LIVE 모드에서만)
  useEffect(() => {
    if (!state.liveMode) return;
    const timer = setInterval(() => {
      setState(prev => ({
        ...prev,
        sessionTime: prev.sessionTime > 0 ? prev.sessionTime - 1 : 0
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [state.liveMode]);

  // 에러 자동 dismiss (5초)
  useEffect(() => {
    if (!state.error) return;
    const timer = setTimeout(() => {
      setState(prev => ({ ...prev, error: null }));
    }, 5000);
    return () => clearTimeout(timer);
  }, [state.error]);

  // 데이터 캐싱 함수
  const cacheData = useCallback((interfaceId: string, data: DataRow[], params: Record<string, string>) => {
    const cacheKey = `${state.activeTab}_${interfaceId}`;
    dataCacheRef.current[cacheKey] = {
      data,
      params,
      timestamp: Date.now(),
    };
  }, [state.activeTab]);

  // 캐시 데이터 가져오기
  const getCachedData = useCallback((interfaceId: string) => {
    const cacheKey = `${state.activeTab}_${interfaceId}`;
    const cached = dataCacheRef.current[cacheKey];
    if (cached && Date.now() - cached.timestamp < DATA_CACHE_TTL) {
      return { data: cached.data, params: cached.params };
    }
    return null;
  }, [state.activeTab]);

  // 캐시 클리어
  const clearCache = useCallback(() => {
    dataCacheRef.current = {};
  }, []);

  // 액션들
  const actions: DashboardActions = useMemo(() => ({
    setActiveTab: (tab) => setState(prev => ({ ...prev, activeTab: tab, selectedIndex: 0 })),
    setSelectedIndex: (index) => setState(prev => ({ ...prev, selectedIndex: index })),
    setData: (data) => setState(prev => ({ ...prev, data })),
    setLoading: (loading) => setState(prev => ({ ...prev, loading })),
    setError: (error) => setState(prev => ({ ...prev, error })),
    setParamValues: (paramValues) => setState(prev => ({ ...prev, paramValues })),
    updateParamValue: (key, value) => setState(prev => ({
      ...prev,
      paramValues: { ...prev.paramValues, [key]: value }
    })),
    setLiveMode: (liveMode) => setState(prev => ({ ...prev, liveMode })),
    setLang: (lang) => setState(prev => ({ ...prev, lang })),
    setTokens: (tokens) => setState(prev => ({ ...prev, tokens })),
    setTokenLoading: (tokenLoading) => setState(prev => ({ ...prev, tokenLoading })),
    setSortKey: (sortKey) => setState(prev => ({ ...prev, sortKey })),
    toggleSortOrder: () => setState(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
    })),
    setIsInputMode: (isInputMode) => setState(prev => ({ ...prev, isInputMode })),
    setInputData: (inputData) => setState(prev => ({ ...prev, inputData })),
    setHeaderData: (headerData) => setState(prev => ({ ...prev, headerData })),
    setSubmitLoading: (submitLoading) => setState(prev => ({ ...prev, submitLoading })),
    setSubmitResult: (submitResult) => setState(prev => ({ ...prev, submitResult })),
    setSidebarOpen: (sidebarOpen) => setState(prev => ({ ...prev, sidebarOpen })),
    resetSession: () => setState(prev => ({
      ...prev,
      sessionTime: 3600,
      tokens: { HMC: null, KMC: null }
    })),
    cacheData,
    getCachedData,
    clearCache,
  }), [cacheData, getCachedData, clearCache]);

  return [state, actions];
}

// 메뉴 캐싱 훅
interface MenuConfig {
  version: string;
  lastUpdated: string;
  needsUpdate: boolean;
  HMC: Array<{ id: string; name: { ko: string; en: string }; params: string[]; hidden?: boolean; order?: number }>;
  KMC: Array<{ id: string; name: { ko: string; en: string }; params: string[]; hidden?: boolean; order?: number }>;
}

const MENU_CACHE_KEY = 'premo_menu_cache';
const MENU_CACHE_TTL = 5 * 60 * 1000; // 5분

export function useMenuConfig() {
  const [menus, setMenus] = useState<MenuConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMenus = useCallback(async () => {
    try {
      // 캐시 확인
      const cached = sessionStorage.getItem(MENU_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < MENU_CACHE_TTL) {
          setMenus(data);
          setLoading(false);
          return;
        }
      }

      // API 호출
      const response = await fetch('/api/menus/config');
      const result = await response.json();

      if (result.success && result.config) {
        setMenus(result.config);
        // 캐시 저장
        sessionStorage.setItem(MENU_CACHE_KEY, JSON.stringify({
          data: result.config,
          timestamp: Date.now()
        }));
      }
    } catch (err) {
      console.error('Failed to load menu config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenus();
  }, [loadMenus]);

  return { menus, loading, reload: loadMenus };
}
