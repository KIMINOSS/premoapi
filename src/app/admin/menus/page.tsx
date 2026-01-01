'use client';

import { useState, useEffect } from 'react';

interface MenuItem {
  id: string;
  code: string;
  name: {
    ko: string;
    en: string;
  };
  company: 'HMC' | 'KMC';
  type: 'query' | 'input';
  status: 'active' | 'inactive' | 'maintenance';
  description: string;
  params: string[];
  lastModified: string;
  usageCount: number;
}

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  maintenance: 'bg-yellow-100 text-yellow-700',
};

const STATUS_LABELS = {
  active: '활성',
  inactive: '비활성',
  maintenance: '점검중',
};

const TYPE_STYLES = {
  query: 'bg-blue-100 text-blue-700 border-blue-200',
  input: 'bg-orange-100 text-orange-700 border-orange-200',
};

const TYPE_LABELS = {
  query: '조회',
  input: '입력',
};

const MOCK_MENUS: MenuItem[] = [
  {
    id: 'menu_001',
    code: 'MMPM8001',
    name: { ko: '품목정보', en: 'Item Info' },
    company: 'HMC',
    type: 'query',
    status: 'active',
    description: '품목 마스터 정보 조회',
    params: ['I_LIFNR', 'I_WERKS', 'I_DATFR', 'I_DATTO'],
    lastModified: '2024-12-28T10:00:00Z',
    usageCount: 1234,
  },
  {
    id: 'menu_002',
    code: 'MMPM8002',
    name: { ko: '검수합격통보서', en: 'Inspection Report' },
    company: 'HMC',
    type: 'query',
    status: 'active',
    description: '검수 합격 통보서 조회',
    params: ['I_LIFNR', 'I_WERKS', 'I_DATFR', 'I_DATTO'],
    lastModified: '2024-12-27T15:30:00Z',
    usageCount: 892,
  },
  {
    id: 'menu_003',
    code: 'MMPM8009',
    name: { ko: '부품출하정보생성', en: 'Shipment Create' },
    company: 'HMC',
    type: 'input',
    status: 'active',
    description: 'ASN 부품 출하 정보 생성',
    params: ['I_LIFNR', 'I_WERKS', 'I_ZASNNO'],
    lastModified: '2024-12-30T09:00:00Z',
    usageCount: 567,
  },
  {
    id: 'menu_004',
    code: 'MMPM8016',
    name: { ko: '실시간결품현황조회', en: 'Realtime Shortage' },
    company: 'KMC',
    type: 'query',
    status: 'active',
    description: 'KMC 실시간 결품 현황 조회',
    params: ['I_LIFNR', 'I_WERKS', 'I_DATUM'],
    lastModified: '2024-12-27T11:00:00Z',
    usageCount: 234,
  },
  {
    id: 'menu_005',
    code: 'MMPM8012',
    name: { ko: '유상사급재고조정', en: 'Paid Supply Adjust' },
    company: 'KMC',
    type: 'input',
    status: 'maintenance',
    description: '유상사급 재고 조정 처리',
    params: ['I_LIFNR', 'I_WERKS', 'I_BUDAT'],
    lastModified: '2024-12-29T14:00:00Z',
    usageCount: 123,
  },
];

export default function MenusPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);

  useEffect(() => {
    const loadData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      setMenus(MOCK_MENUS);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredMenus = menus.filter((menu) => {
    if (companyFilter && menu.company !== companyFilter) return false;
    if (typeFilter && menu.type !== typeFilter) return false;
    if (search) {
      const lowerSearch = search.toLowerCase();
      return (
        menu.code.toLowerCase().includes(lowerSearch) ||
        menu.name.ko.toLowerCase().includes(lowerSearch) ||
        menu.name.en.toLowerCase().includes(lowerSearch)
      );
    }
    return true;
  });

  const hmcCount = menus.filter((m) => m.company === 'HMC').length;
  const kmcCount = menus.filter((m) => m.company === 'KMC').length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleStatus = (id: string) => {
    setMenus(
      menus.map((menu) => {
        if (menu.id === id) {
          const newStatus = menu.status === 'active' ? 'inactive' : 'active';
          return { ...menu, status: newStatus };
        }
        return menu;
      })
    );
  };

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">메뉴 관리</h1>
          <p className="text-gray-500 mt-1">
            HMC {hmcCount}개 / KMC {kmcCount}개 인터페이스
          </p>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* 검색 */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="코드 또는 이름 검색..."
            className="w-full px-4 py-2.5 pl-10 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* 회사 필터 */}
        <div className="flex gap-2">
          <button
            onClick={() => setCompanyFilter('')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              companyFilter === '' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setCompanyFilter('HMC')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              companyFilter === 'HMC' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            HMC
          </button>
          <button
            onClick={() => setCompanyFilter('KMC')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              companyFilter === 'KMC' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            KMC
          </button>
        </div>

        {/* 타입 필터 */}
        <div className="flex gap-2">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              typeFilter === '' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setTypeFilter('query')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              typeFilter === 'query' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            조회
          </button>
          <button
            onClick={() => setTypeFilter('input')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              typeFilter === 'input' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            입력
          </button>
        </div>
      </div>

      {/* 메뉴 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">인터페이스</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">회사</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">타입</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용량</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수정일</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMenus.map((menu) => (
                <tr key={menu.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-gray-800">{menu.code}</div>
                      <div className="text-sm text-gray-500">{menu.name.ko}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        menu.company === 'HMC' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {menu.company}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${TYPE_STYLES[menu.type]}`}>
                      {TYPE_LABELS[menu.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[menu.status]}`}>
                      {STATUS_LABELS[menu.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{menu.usageCount.toLocaleString()}회</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(menu.lastModified)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedMenu(menu)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="상세"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => toggleStatus(menu.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          menu.status === 'active'
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={menu.status === 'active' ? '비활성화' : '활성화'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {menu.status === 'active' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          )}
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredMenus.length === 0 && (
            <div className="text-center py-12 text-gray-500">검색 결과가 없습니다.</div>
          )}
        </div>
      )}

      {/* 상세 모달 */}
      {selectedMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{selectedMenu.code}</h3>
                <p className="text-sm text-gray-500">{selectedMenu.name.ko}</p>
              </div>
              <button
                onClick={() => setSelectedMenu(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    selectedMenu.company === 'HMC' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {selectedMenu.company}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${TYPE_STYLES[selectedMenu.type]}`}>
                  {TYPE_LABELS[selectedMenu.type]}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[selectedMenu.status]}`}>
                  {STATUS_LABELS[selectedMenu.status]}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">설명</label>
                <p className="text-gray-800">{selectedMenu.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">영문명</label>
                <p className="text-gray-800">{selectedMenu.name.en}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">파라미터</label>
                <div className="flex flex-wrap gap-2">
                  {selectedMenu.params.map((param) => (
                    <span
                      key={param}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg font-mono"
                    >
                      {param}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">사용량</label>
                  <p className="text-gray-800 font-semibold">{selectedMenu.usageCount.toLocaleString()}회</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">최종 수정</label>
                  <p className="text-gray-800 text-sm">{formatDate(selectedMenu.lastModified)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setSelectedMenu(null)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => toggleStatus(selectedMenu.id)}
                className={`flex-1 px-4 py-3 font-medium rounded-xl transition-colors ${
                  selectedMenu.status === 'active'
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {selectedMenu.status === 'active' ? '비활성화' : '활성화'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
