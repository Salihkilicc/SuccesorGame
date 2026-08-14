// src/features/news/logic/useSiliconNewsLogic.ts
import { useEffect, useCallback } from 'react';
import { useNewsStore, NewsItem, NewsType } from '../../../core/store/useNewsStore';
import { generateQuarterlyNews } from '../../../core/news/newsEngine';

export interface TypeVisualTheme {
  badgeBg: string;
  badgeText: string;
  accentColor: string;
  label: string;
}

/**
 * Clean Visual Colors matching Game Theme
 * - player: Bright Electric Blue (#05A8F6)
 * - rival: Amber / Brand (#FFA94D)
 * - world: Violet / RP (#C4B5FD)
 */
export const NEWS_VISUAL_THEMES: Record<NewsType, TypeVisualTheme> = {
  player: {
    accentColor: '#05A8F6',
    badgeBg: 'rgba(5, 168, 246, 0.14)',
    badgeText: '#7DD3FC',
    label: 'HALE CORP',
  },
  rival: {
    accentColor: '#FFA94D',
    badgeBg: 'rgba(255, 169, 77, 0.14)',
    badgeText: '#FFA94D',
    label: 'RIVALS',
  },
  world: {
    accentColor: '#C4B5FD',
    badgeBg: 'rgba(196, 181, 253, 0.14)',
    badgeText: '#DDD6FE',
    label: 'SECTOR',
  },
};

export interface SiliconNewsLogicReturn {
  state: {
    newsHistory: NewsItem[];
    unreadCount: number;
  };
  actions: {
    handleClose: () => void;
    markAsRead: () => void;
  };
}

export const useSiliconNewsLogic = (visible: boolean, onClose: () => void): SiliconNewsLogicReturn => {
  const newsHistory = useNewsStore((state) => state.newsHistory);
  const unreadCount = useNewsStore((state) => state.unreadCount);
  const markAsRead = useNewsStore((state) => state.markAsRead);

  // Seed initial news if empty when opened
  useEffect(() => {
    if (visible && newsHistory.length === 0) {
      generateQuarterlyNews(1);
    }
  }, [visible, newsHistory.length]);

  // Automatically mark items as read when the news modal is opened
  useEffect(() => {
    if (visible && unreadCount > 0) {
      markAsRead();
    }
  }, [visible, unreadCount, markAsRead]);

  const handleClose = useCallback(() => {
    markAsRead();
    onClose();
  }, [markAsRead, onClose]);

  return {
    state: {
      newsHistory,
      unreadCount,
    },
    actions: {
      handleClose,
      markAsRead,
    },
  };
};
