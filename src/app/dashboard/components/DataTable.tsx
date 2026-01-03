'use client';

import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import type { TabType, LangType, DataRow } from '../types';
import { getFieldLabel, convertCodeToLabel, getOrderedHeaders } from '../utils';

interface DataTableProps {
  data: DataRow[] | null;
  headers: string[];
  interfaceId: string;
  activeTab: TabType;
  lang: LangType;
  sortKey: string | null;
  sortOrder: 'asc' | 'desc';
  onSort: (key: string) => void;
  zplDays?: number;
}

const ROW_HEIGHT = 32;
const OVERSCAN = 5;
const MIN_COL_WIDTH = 60;
const DEFAULT_COL_WIDTH = 120;

function DataTableComponent({
  data,
  headers,
  interfaceId,
  activeTab,
  lang,
  sortKey,
  sortOrder,
  onSort,
  zplDays,
}: DataTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  // Column resize state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizing, setResizing] = useState<{ key: string; startX: number; startWidth: number } | null>(null);

  // Container resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Display headers
  const displayHeaders = useMemo(() => {
    if (data && data.length > 0) {
      return getOrderedHeaders(interfaceId, Object.keys(data[0]), zplDays);
    }
    return getOrderedHeaders(interfaceId, headers, zplDays);
  }, [data, headers, interfaceId, zplDays]);

  // Initialize column widths
  useEffect(() => {
    const widths: Record<string, number> = { '#': 50 };
    displayHeaders.forEach((header) => {
      if (!columnWidths[header]) {
        const labelLength = getFieldLabel(header, lang).length;
        widths[header] = Math.max(MIN_COL_WIDTH, Math.min(250, labelLength * 12 + 40));
      } else {
        widths[header] = columnWidths[header];
      }
    });
    widths['#'] = 50;
    setColumnWidths(prev => ({ ...prev, ...widths }));
  }, [displayHeaders, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sorted data
  const sortedData = useMemo(() => {
    if (!data || !sortKey) return data || [];
    return [...data].sort((a, b) => {
      const aVal = String(a[sortKey] ?? '');
      const bVal = String(b[sortKey] ?? '');
      const cmp = aVal.localeCompare(bVal, 'ko', { numeric: true });
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortOrder]);

  const totalWidth = useMemo(() => {
    return 50 + displayHeaders.reduce((sum, h) => sum + (columnWidths[h] || DEFAULT_COL_WIDTH), 0);
  }, [displayHeaders, columnWidths]);

  // Virtual scroll calculations
  const totalRows = sortedData?.length || 0;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN);
  const visibleRows = sortedData?.slice(startIndex, endIndex) || [];
  const totalHeight = totalRows * ROW_HEIGHT;
  const offsetY = startIndex * ROW_HEIGHT;

  // Column resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      key,
      startX: e.clientX,
      startWidth: columnWidths[key] || DEFAULT_COL_WIDTH,
    });
  }, [columnWidths]);

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(MIN_COL_WIDTH, resizing.startWidth + diff);
      setColumnWidths(prev => ({ ...prev, [resizing.key]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  // Handle header click for sorting
  const handleHeaderClick = useCallback((key: string) => {
    onSort(key);
  }, [onSort]);

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-100 border-b border-gray-300">
          <span className="text-sm text-gray-600">{lang === 'ko' ? '컬럼:' : 'Cols:'}</span>
          <span className="text-sm font-semibold text-gray-800">{displayHeaders.length}</span>
          <div className="flex-1" />
          <span className="text-sm text-orange-600 font-semibold animate-pulse">
            {lang === 'ko' ? '조회 대기중...' : 'Awaiting query...'}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-lg font-medium">{lang === 'ko' ? '조회 버튼을 클릭하세요' : 'Click Query button'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-300 shadow-sm flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-100 border-b border-gray-300 flex-shrink-0">
        <span className="text-sm text-gray-600">{lang === 'ko' ? '컬럼:' : 'Cols:'}</span>
        <span className="text-sm font-semibold text-gray-800">{displayHeaders.length}</span>
        <span className="text-gray-400">|</span>
        <span className="text-sm text-gray-600">{lang === 'ko' ? '행:' : 'Rows:'}</span>
        <span className="text-sm font-bold text-green-700">{data.length.toLocaleString()}</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-green-700 font-medium">
            {lang === 'ko' ? '가상 스크롤' : 'Virtual Scroll'}
          </span>
        </div>
      </div>

      {/* Table Container - with visible scrollbars */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          className="flex-1 flex flex-col overflow-x-auto scrollbar-visible"
          style={{
            scrollbarWidth: 'auto',
            scrollbarColor: '#9ca3af #f3f4f6'
          }}
        >
          <div style={{ minWidth: totalWidth }} className="flex-1 flex flex-col">
            {/* Header */}
            <div
              className="flex bg-gradient-to-b from-gray-200 to-gray-100 sticky top-0 z-10 border-b-2 border-gray-400 flex-shrink-0"
              style={{ height: 40 }}
            >
              <div
                style={{ width: 50, minWidth: 50 }}
                className="px-3 py-2 text-center font-bold text-gray-700 flex items-center justify-center flex-shrink-0 text-sm"
              >
                #
              </div>
              {displayHeaders.map((key) => (
                <div
                  key={key}
                  style={{ width: columnWidths[key] || DEFAULT_COL_WIDTH, minWidth: MIN_COL_WIDTH }}
                  className="relative px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-gray-300 flex items-center flex-shrink-0 text-sm select-none group"
                  onClick={() => handleHeaderClick(key)}
                >
                  <span className="truncate flex-1">{getFieldLabel(key, lang)}</span>
                  {sortKey === key && (
                    <span className="ml-1 text-blue-600 font-bold">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                  )}
                  {/* Resize handle */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-gray-400 opacity-0 group-hover:opacity-100 hover:bg-blue-500 hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => handleResizeStart(e, key)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>

            {/* Virtual Scroll Body - with visible scrollbar */}
            <div
              ref={containerRef}
              onScroll={handleScroll}
              className="scrollbar-visible flex-1"
              style={{
                overflowY: 'scroll',
                overflowX: 'hidden',
                scrollbarWidth: 'auto',
                scrollbarColor: '#9ca3af #f3f4f6'
              }}
            >
              <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
                  {visibleRows.map((row, idx) => {
                    const actualIndex = startIndex + idx;
                    return (
                      <div
                        key={actualIndex}
                        style={{
                          height: ROW_HEIGHT,
                          display: 'flex',
                          alignItems: 'center',
                          borderBottom: '1px solid #e5e7eb',
                          backgroundColor: actualIndex % 2 === 0 ? '#ffffff' : '#f9fafb',
                        }}
                        className="hover:bg-blue-100 transition-colors"
                      >
                        <div
                          style={{ width: 50, minWidth: 50 }}
                          className="px-2 text-xs text-gray-500 flex-shrink-0 text-center font-medium"
                        >
                          {actualIndex + 1}
                        </div>
                        {displayHeaders.map((key) => (
                          <div
                            key={key}
                            style={{ width: columnWidths[key] || DEFAULT_COL_WIDTH, minWidth: MIN_COL_WIDTH }}
                            className="px-2 text-xs text-gray-800 truncate flex-shrink-0"
                            title={String(row[key] ?? '')}
                          >
                            {convertCodeToLabel(key, row[key], activeTab, lang)}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollbar CSS */}
      <style jsx>{`
        .scrollbar-visible::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }
        .scrollbar-visible::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }
        .scrollbar-visible::-webkit-scrollbar-thumb {
          background: #9ca3af;
          border-radius: 4px;
          border: 3px solid #f3f4f6;
        }
        .scrollbar-visible::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        .scrollbar-visible::-webkit-scrollbar-corner {
          background: #f3f4f6;
        }
      `}</style>
    </div>
  );
}

export const DataTable = memo(DataTableComponent);
