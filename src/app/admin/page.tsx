'use client';

import { useState, useEffect } from 'react';

// ============================================
// 타입 정의
// ============================================
type TabType = 'dashboard' | 'announcements' | 'menus' | 'users';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalAnnouncements: number;
  activeMenus: number;
  todayLogins: number;
  apiCallsToday: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'high' | 'normal' | 'low';
  status: 'active' | 'scheduled' | 'expired';
  startDate: string;
  endDate: string | null;
  createdAt: string;
  createdBy: string;
  viewCount: number;
}

interface MenuItem {
  id: string;
  code: string;
  name: { ko: string; en: string };
  company: 'HMC' | 'KMC';
  type: 'query' | 'input';
  status: 'active' | 'inactive' | 'maintenance';
  description: string;
  params: string[];
  lastModified: string;
  usageCount: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'viewer';
  status: 'active' | 'inactive' | 'locked';
  company: 'HMC' | 'KMC' | null;
  department: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

// ============================================
// Mock 데이터
// ============================================
const MOCK_STATS: DashboardStats = {
  totalUsers: 42,
  activeUsers: 38,
  totalAnnouncements: 12,
  activeMenus: 15,
  todayLogins: 23,
  apiCallsToday: 1547,
};

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_001',
    title: '시스템 점검 안내 (01/05 02:00~06:00)',
    content: '서버 업그레이드를 위한 정기 점검이 예정되어 있습니다.',
    priority: 'high',
    status: 'active',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-01-05T06:00:00Z',
    createdAt: '2025-01-01T09:00:00Z',
    createdBy: 'admin@premo.io',
    viewCount: 156,
  },
  {
    id: 'ann_002',
    title: '2025년 새해 인사',
    content: '새해 복 많이 받으세요!',
    priority: 'normal',
    status: 'active',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-01-07T23:59:59Z',
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'admin@premo.io',
    viewCount: 342,
  },
];

const MOCK_MENUS: MenuItem[] = [
  { id: 'menu_001', code: 'MMPM8001', name: { ko: '품목정보', en: 'Item Info' }, company: 'HMC', type: 'query', status: 'active', description: '품목 마스터 정보 조회', params: ['I_LIFNR', 'I_WERKS'], lastModified: '2024-12-28T10:00:00Z', usageCount: 1234 },
  { id: 'menu_002', code: 'MMPM8002', name: { ko: '검수합격통보서', en: 'Inspection Report' }, company: 'HMC', type: 'query', status: 'active', description: '검수 합격 통보서 조회', params: ['I_LIFNR', 'I_WERKS'], lastModified: '2024-12-27T15:30:00Z', usageCount: 892 },
  { id: 'menu_003', code: 'MMPM8009', name: { ko: '부품출하정보생성', en: 'Shipment Create' }, company: 'HMC', type: 'input', status: 'active', description: 'ASN 부품 출하 정보 생성', params: ['I_LIFNR', 'I_ZASNNO'], lastModified: '2024-12-30T09:00:00Z', usageCount: 567 },
  { id: 'menu_004', code: 'MMPM8016', name: { ko: '실시간결품현황조회', en: 'Realtime Shortage' }, company: 'KMC', type: 'query', status: 'active', description: 'KMC 실시간 결품 현황 조회', params: ['I_LIFNR', 'I_DATUM'], lastModified: '2024-12-27T11:00:00Z', usageCount: 234 },
];

const MOCK_USERS: User[] = [
  { id: 'usr_001', email: 'admin@premo.io', name: '관리자', role: 'admin', status: 'active', company: 'HMC', department: 'IT팀', createdAt: '2025-01-01T00:00:00Z', lastLoginAt: '2025-12-31T08:30:00Z' },
  { id: 'usr_002', email: 'operator@hmc.co.kr', name: '김운영', role: 'operator', status: 'active', company: 'HMC', department: '구매팀', createdAt: '2025-02-15T09:00:00Z', lastLoginAt: '2025-12-30T14:20:00Z' },
  { id: 'usr_003', email: 'viewer@partner.com', name: '박조회', role: 'viewer', status: 'inactive', company: null, department: null, createdAt: '2025-06-20T14:00:00Z', lastLoginAt: '2025-11-15T09:00:00Z' },
];

// ============================================
// 스타일 상수
// ============================================
const PRIORITY_STYLES = { high: 'bg-red-100 text-red-700', normal: 'bg-blue-100 text-blue-700', low: 'bg-gray-100 text-gray-600' };
const PRIORITY_LABELS = { high: '긴급', normal: '일반', low: '낮음' };
const STATUS_STYLES = { active: 'bg-green-100 text-green-700', scheduled: 'bg-yellow-100 text-yellow-700', expired: 'bg-gray-100 text-gray-500', inactive: 'bg-gray-100 text-gray-500', locked: 'bg-red-100 text-red-600', maintenance: 'bg-yellow-100 text-yellow-700' };
const STATUS_LABELS = { active: '활성', scheduled: '예약됨', expired: '만료됨', inactive: '비활성', locked: '잠금', maintenance: '점검중' };
const ROLE_STYLES = { admin: 'bg-purple-100 text-purple-700', operator: 'bg-blue-100 text-blue-700', viewer: 'bg-gray-100 text-gray-600' };
const ROLE_LABELS = { admin: '관리자', operator: '운영자', viewer: '조회자' };

// ============================================
// 메인 컴포넌트
// ============================================
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);

  // 데이터 상태
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setStats(MOCK_STATS);
      setAnnouncements(MOCK_ANNOUNCEMENTS);
      setMenus(MOCK_MENUS);
      setUsers(MOCK_USERS);
      setLoading(false);
    };
    loadData();
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: '대시보드', icon: '📊' },
    { id: 'announcements' as TabType, label: '공지사항', icon: '📢' },
    { id: 'menus' as TabType, label: '메뉴 관리', icon: '📋' },
    { id: 'users' as TabType, label: '계정 관리', icon: '👥' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin w-10 h-10 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-red-200">
                P
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">PREMO 관리자</h1>
                <p className="text-xs text-gray-500">시스템 관리 콘솔</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href="/dashboard" className="text-sm text-gray-500 hover:text-red-600 transition-colors">
                사용자 화면 →
              </a>
              <button
                onClick={() => {
                  localStorage.removeItem('admin_token');
                  window.location.href = '/admin/login';
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium transition-all border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-red-600 border-red-500 bg-red-50/50'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 대시보드 탭 */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">대시보드</h2>
              <p className="text-gray-500 mt-1">시스템 현황을 한눈에 확인하세요</p>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: '전체 사용자', value: stats.totalUsers, color: 'blue', sub: '+3 이번 주' },
                { label: '활성 사용자', value: stats.activeUsers, color: 'green', sub: `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}% 활성` },
                { label: '공지사항', value: stats.totalAnnouncements, color: 'purple', sub: '2개 진행중' },
                { label: '활성 메뉴', value: stats.activeMenus, color: 'orange', sub: 'HMC 15 / KMC 13' },
                { label: '오늘 로그인', value: stats.todayLogins, color: 'cyan', sub: '+5 어제 대비' },
                { label: 'API 호출', value: stats.apiCallsToday.toLocaleString(), color: 'red', sub: '평균 1,200/일' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm font-medium text-gray-500 mb-2">{item.label}</div>
                  <div className="text-2xl font-bold text-gray-800">{item.value}</div>
                  <div className={`text-xs mt-1 text-${item.color}-600`}>{item.sub}</div>
                </div>
              ))}
            </div>

            {/* 시스템 상태 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">시스템 상태</h3>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">모든 시스템 정상</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['HMC API (45ms)', 'KMC API (52ms)', 'OAuth 서버 (120ms)', '데이터베이스 (정상)'].map((sys, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm text-gray-700">{sys}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 공지사항 탭 */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">공지사항 관리</h2>
                <p className="text-gray-500 mt-1">총 {announcements.length}개의 공지사항</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-200">
                <span>+</span> 새 공지사항
              </button>
            </div>

            <div className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_STYLES[ann.priority]}`}>{PRIORITY_LABELS[ann.priority]}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[ann.status]}`}>{STATUS_LABELS[ann.status]}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">{ann.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{ann.content}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">✏️</button>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">🗑️</button>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                    <span>📅 {formatDate(ann.startDate)}</span>
                    <span>👁️ {ann.viewCount}회</span>
                    <span>👤 {ann.createdBy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 메뉴 관리 탭 */}
        {activeTab === 'menus' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">메뉴 관리</h2>
              <p className="text-gray-500 mt-1">HMC {menus.filter(m => m.company === 'HMC').length}개 / KMC {menus.filter(m => m.company === 'KMC').length}개 인터페이스</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">인터페이스</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">회사</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">타입</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">사용량</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {menus.map((menu) => (
                    <tr key={menu.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">{menu.code}</div>
                        <div className="text-sm text-gray-500">{menu.name.ko}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${menu.company === 'HMC' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                          {menu.company}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${menu.type === 'query' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {menu.type === 'query' ? '조회' : '입력'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[menu.status]}`}>
                          {STATUS_LABELS[menu.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{menu.usageCount.toLocaleString()}회</td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">👁️</button>
                        <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg">⚙️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 계정 관리 탭 */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">계정 관리</h2>
                <p className="text-gray-500 mt-1">총 {users.length}명의 사용자</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-200">
                <span>+</span> 새 사용자
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">사용자</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">역할</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">회사/부서</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">마지막 로그인</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-medium shadow-sm">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_STYLES[user.role]}`}>
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[user.status]}`}>
                          {STATUS_LABELS[user.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {user.company ? `${user.company} / ${user.department || '-'}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(user.lastLoginAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">✏️</button>
                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
