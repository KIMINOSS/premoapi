'use client';

import React, { memo } from 'react';
import type { TabType, LangType, DataRow } from '../types';
import { getFieldLabel, convertCodeToLabel } from '../utils';

interface MobileCardViewProps {
  data: DataRow[] | null;
  headers: string[];
  interfaceId: string;
  activeTab: TabType;
  lang: LangType;
  sortKey: string | null;
  sortOrder: 'asc' | 'desc';
}

function MobileCardViewComponent({
  data,
  headers,
  interfaceId,
  activeTab,
  lang,
  sortKey,
  sortOrder,
}: MobileCardViewProps) {
  // Sorted data
  const sortedData = React.useMemo(() => {
    if (!data || !sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = String(a[sortKey] ?? '');
      const bVal = String(b[sortKey] ?? '');
      const cmp = aVal.localeCompare(bVal, 'ko', { numeric: true });
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortOrder]);

  // Limit to 20 items on mobile
  const displayData = sortedData?.slice(0, 20) || [];

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <svg
          className="w-12 h-12 mx-auto text-gray-300 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-gray-500">{lang === 'ko' ? '조회 버튼을 클릭하세요' : 'Click Query'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayData.map((row, idx) => (
        <div key={idx} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500">#{idx + 1}</span>
            <span className="text-[10px] text-gray-400">{interfaceId}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {headers.slice(0, 8).map((key) => (
              <div key={key} className="overflow-hidden">
                <span className="text-gray-500 text-[10px] block truncate">
                  {getFieldLabel(key, lang)}
                </span>
                <span className="text-gray-800 font-medium truncate block">
                  {convertCodeToLabel(key, row[key], activeTab, lang) || '-'}
                </span>
              </div>
            ))}
          </div>
          {headers.length > 8 && (
            <div className="mt-2 text-[10px] text-gray-400 text-right">
              +{headers.length - 8} more fields
            </div>
          )}
        </div>
      ))}
      {data.length > 20 && (
        <div className="text-center py-2 text-sm text-gray-500">
          {lang === 'ko'
            ? `외 ${data.length - 20}건 더... PC에서 전체 보기`
            : `+${data.length - 20} more... View all on PC`}
        </div>
      )}
    </div>
  );
}

export const MobileCardView = memo(MobileCardViewComponent);
