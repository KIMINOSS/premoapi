'use client';

import React, { memo } from 'react';
import type { LangType, DataRow, SubmitResult } from '../types';
import { getFieldLabel } from '../utils';

interface InputConfig {
  description: { ko: string; en: string };
  fields?: string[];
  headerFields?: string[];
  detailFields?: string[];
}

interface InputModePanelProps {
  inputConfig: InputConfig;
  inputData: DataRow[];
  headerData: Record<string, string>;
  lang: LangType;
  submitLoading: boolean;
  submitResult: SubmitResult | null;
  liveMode: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onInputDataChange: (data: DataRow[]) => void;
  onHeaderDataChange: (field: string, value: string) => void;
  onSubmit: () => void;
}

function InputModePanelComponent({
  inputConfig,
  inputData,
  headerData,
  lang,
  submitLoading,
  submitResult,
  liveMode,
  fileInputRef,
  onInputDataChange,
  onHeaderDataChange,
  onSubmit,
}: InputModePanelProps) {
  const hasHeaderFields = inputConfig?.headerFields && inputConfig.headerFields.length > 0;
  const inputFields = inputConfig.detailFields || inputConfig.fields || [];

  // Excel upload handler
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
      onInputDataChange(jsonData);
    } catch {
      console.error('Failed to read Excel file');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download template
  const handleDownloadTemplate = async () => {
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
    XLSX.writeFile(wb, 'input_template.xlsx');
  };

  // Add row
  const handleAddRow = () => {
    if (inputFields.length === 0) return;
    const newRow: DataRow = {};
    inputFields.forEach(field => { newRow[field] = ''; });
    onInputDataChange([...inputData, newRow]);
  };

  // Delete row
  const handleDeleteRow = (index: number) => {
    onInputDataChange(inputData.filter((_, i) => i !== index));
  };

  // Update cell
  const handleCellChange = (rowIndex: number, field: string, value: string) => {
    const newData = [...inputData];
    newData[rowIndex] = { ...newData[rowIndex], [field]: value };
    onInputDataChange(newData);
  };

  return (
    <div className="px-2 md:px-4 py-3 bg-orange-50 border-b border-orange-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-orange-800">{inputConfig.description[lang]}</span>
          <span className="text-xs text-orange-600">({inputData.length} {lang === 'ko' ? '건' : 'rows'})</span>
        </div>
        <div className="flex items-center gap-1 md:gap-2 flex-wrap">
          <button onClick={handleDownloadTemplate} className="flex items-center gap-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs text-gray-700">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">{lang === 'ko' ? '템플릿' : 'Template'}</span>
          </button>
          <input type="file" ref={fileInputRef} accept=".xlsx,.xls" onChange={handleExcelUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-white">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="hidden sm:inline">{lang === 'ko' ? '엑셀' : 'Excel'}</span>
          </button>
          <button onClick={handleAddRow} className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 rounded text-xs text-white">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            +
          </button>
          <button onClick={onSubmit} disabled={submitLoading || inputData.length === 0 || !liveMode} className="flex items-center gap-1 px-3 py-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded text-xs text-white font-medium">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            {submitLoading ? '...' : (lang === 'ko' ? '전송' : 'Send')}
          </button>
        </div>
      </div>

      {/* Submit Result */}
      {submitResult && (
        <div className={`px-3 py-2 rounded text-xs mb-3 ${submitResult.success ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
          {submitResult.message}
        </div>
      )}

      {/* Header Fields (if any) */}
      {hasHeaderFields && inputConfig.headerFields && (
        <div className="mb-3">
          <div className="text-xs font-medium text-orange-700 mb-2">{lang === 'ko' ? '출하 정보 (헤더)' : 'Shipment Info'}</div>
          <div className="bg-white rounded border border-orange-200 p-2 md:p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {inputConfig.headerFields.map(field => (
                <div key={field} className="flex flex-col">
                  <label className="text-[10px] text-gray-500 mb-0.5 truncate" title={getFieldLabel(field, lang)}>
                    {getFieldLabel(field, lang)}
                  </label>
                  <input
                    type="text"
                    value={headerData[field] || ''}
                    onChange={(e) => onHeaderDataChange(field, e.target.value)}
                    placeholder={field}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:border-orange-400"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detail Fields */}
      {inputFields.length > 0 && (
        <>
          {hasHeaderFields && (
            <div className="text-xs font-medium text-orange-700 mb-2">{lang === 'ko' ? '부품 상세' : 'Part Details'}</div>
          )}
          {inputData.length > 0 ? (
            <div className="bg-white rounded border border-orange-200 overflow-x-auto max-h-40">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-orange-100">
                  <tr>
                    <th className="px-1.5 py-1 text-left text-orange-800 border-b border-orange-200 w-8">#</th>
                    {inputFields.map(field => (
                      <th key={field} className="px-1.5 py-1 text-left text-orange-800 border-b border-orange-200 whitespace-nowrap text-[11px]">
                        {getFieldLabel(field, lang)}
                      </th>
                    ))}
                    <th className="px-1.5 py-1 text-center text-orange-800 border-b border-orange-200 w-8">x</th>
                  </tr>
                </thead>
                <tbody>
                  {inputData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-orange-50">
                      <td className="px-1.5 py-0.5 border-b border-orange-100 text-gray-400 text-[10px]">{rowIndex + 1}</td>
                      {inputFields.map(field => (
                        <td key={field} className="px-0.5 py-0.5 border-b border-orange-100">
                          <input
                            type="text"
                            value={String(row[field] || '')}
                            onChange={(e) => handleCellChange(rowIndex, field, e.target.value)}
                            className="w-full min-w-[60px] px-1 py-0.5 border border-gray-200 rounded text-[11px] focus:outline-none focus:border-orange-400"
                          />
                        </td>
                      ))}
                      <td className="px-1 py-0.5 border-b border-orange-100 text-center">
                        <button onClick={() => handleDeleteRow(rowIndex)} className="text-red-400 hover:text-red-600">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-3 text-orange-600 text-xs bg-white rounded border border-orange-200">
              {lang === 'ko' ? '[+] 버튼으로 부품 정보를 추가하세요' : 'Click [+] to add parts'}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export const InputModePanel = memo(InputModePanelComponent);
