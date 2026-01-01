'use client';

import React, { useState, useEffect, useCallback } from 'react';

// 타입 정의
interface Announcement {
  id: string;
  type: 'info' | 'warning' | 'urgent';
  title: { ko: string; en: string };
  message: { ko: string; en: string };
  location: 'login' | 'dashboard' | 'both';
  priority: number;
}

interface AnnouncementBannerProps {
  location: 'login' | 'dashboard';
  lang?: 'ko' | 'en';
}

// 타입별 스타일 매핑
const TYPE_STYLES = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-500',
    button: 'hover:bg-blue-100',
    indicator: 'bg-blue-500',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: 'text-amber-500',
    button: 'hover:bg-amber-100',
    indicator: 'bg-amber-500',
  },
  urgent: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'text-red-500',
    button: 'hover:bg-red-100',
    indicator: 'bg-red-500',
  },
};

// 아이콘 컴포넌트
const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const UrgentIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const getIcon = (type: Announcement['type']) => {
  switch (type) {
    case 'urgent': return <UrgentIcon />;
    case 'warning': return <WarningIcon />;
    default: return <InfoIcon />;
  }
};

export default function AnnouncementBanner({ location, lang = 'ko' }: AnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // 공지사항 로드
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch(`/api/announcements/active?location=${location}`);
        const data = await response.json();
        if (data.success && data.announcements) {
          setAnnouncements(data.announcements);
        }
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, [location]);

  // 세션 스토리지에서 닫은 공지 ID 복원
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem('dismissedAnnouncements');
      if (dismissed) {
        setDismissedIds(new Set(JSON.parse(dismissed)));
      }
    } catch {
      // sessionStorage 접근 실패 시 무시
    }
  }, []);

  // 필터링된 공지사항 (닫은 것 제외)
  const visibleAnnouncements = announcements.filter(ann => !dismissedIds.has(ann.id));

  // 닫기 핸들러
  const handleDismiss = useCallback((id: string) => {
    const newDismissed = new Set(dismissedIds).add(id);
    setDismissedIds(newDismissed);
    try {
      sessionStorage.setItem('dismissedAnnouncements', JSON.stringify([...newDismissed]));
    } catch {
      // sessionStorage 저장 실패 시 무시
    }
    // 다음 공지로 이동
    if (currentIndex >= visibleAnnouncements.length - 1) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  }, [dismissedIds, currentIndex, visibleAnnouncements.length]);

  // 현재 공지사항
  const currentAnnouncement = visibleAnnouncements[currentIndex];

  // 자동 슬라이드 (5초마다)
  useEffect(() => {
    if (visibleAnnouncements.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % visibleAnnouncements.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [visibleAnnouncements.length]);

  // 이전/다음 핸들러
  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + visibleAnnouncements.length) % visibleAnnouncements.length);
  }, [visibleAnnouncements.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % visibleAnnouncements.length);
  }, [visibleAnnouncements.length]);

  // 로딩 중이거나 공지가 없으면 렌더링하지 않음
  if (isLoading || visibleAnnouncements.length === 0 || !currentAnnouncement) {
    return null;
  }

  const styles = TYPE_STYLES[currentAnnouncement.type];

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg px-4 py-3 mb-4 transition-all duration-300`}>
      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <div className={`flex-shrink-0 ${styles.icon} mt-0.5`}>
          {getIcon(currentAnnouncement.type)}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-sm font-semibold ${styles.text}`}>
              {currentAnnouncement.title[lang]}
            </h3>
            {currentAnnouncement.type === 'urgent' && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">
                {lang === 'ko' ? '긴급' : 'URGENT'}
              </span>
            )}
          </div>
          <p className={`text-sm ${styles.text} opacity-90`}>
            {currentAnnouncement.message[lang]}
          </p>
        </div>

        {/* 네비게이션 */}
        {visibleAnnouncements.length > 1 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handlePrev}
              className={`p-1 rounded ${styles.button} ${styles.text} transition-colors`}
              aria-label={lang === 'ko' ? '이전' : 'Previous'}
            >
              <ChevronLeftIcon />
            </button>
            <span className={`text-xs ${styles.text} opacity-70 min-w-[40px] text-center`}>
              {currentIndex + 1} / {visibleAnnouncements.length}
            </span>
            <button
              onClick={handleNext}
              className={`p-1 rounded ${styles.button} ${styles.text} transition-colors`}
              aria-label={lang === 'ko' ? '다음' : 'Next'}
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}

        {/* 닫기 버튼 */}
        <button
          onClick={() => handleDismiss(currentAnnouncement.id)}
          className={`flex-shrink-0 p-1 rounded ${styles.button} ${styles.text} transition-colors`}
          aria-label={lang === 'ko' ? '닫기' : 'Close'}
        >
          <CloseIcon />
        </button>
      </div>

      {/* 인디케이터 (여러 공지일 때) */}
      {visibleAnnouncements.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {visibleAnnouncements.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? `${styles.indicator} w-4`
                  : `${styles.indicator} opacity-30`
              }`}
              aria-label={`${lang === 'ko' ? '공지' : 'Announcement'} ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
