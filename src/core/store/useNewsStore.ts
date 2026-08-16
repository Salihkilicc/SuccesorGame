// src/core/store/useNewsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../storage/persist';

export type NewsType = 'player' | 'rival' | 'world';
export type NewsCategory = 'Breaking' | 'Exclusive' | 'Market' | 'Tech' | 'Corporate' | 'Analysis' | 'Legal' | 'Media';
export type NewsKind = 'market' | 'deal' | 'company' | 'story' | NewsType;

export interface NewsItem {
  id: string;
  type: NewsType;
  category: NewsCategory;
  source: string;
  headline: string;
  text: string;
  quarter: number;
  readTime: string;
  isHero?: boolean;
  isRead: boolean;
  createdAt: number;
  /** Backwards compatibility fields */
  kind?: NewsKind;
  atMonth?: number;
}

export type NewsPayload = {
  type: NewsType;
  category?: NewsCategory;
  source?: string;
  headline?: string;
  text: string;
  quarter: number;
  readTime?: string;
  isHero?: boolean;
  kind?: NewsKind;
  atMonth?: number;
};

export const MAX_ITEMS = 60;

interface NewsState {
  newsHistory: NewsItem[];
  items: NewsItem[]; // Backwards compatibility alias
  unreadCount: number;
  announcedProductIds: string[];
  announcedAcquisitionIds: string[];
  addNewsBatch: (newItems: NewsPayload[]) => void;
  markAsRead: () => void;
  markProductAnnounced: (id: string) => void;
  markAcquisitionAnnounced: (id: string) => void;
  clearNews: () => void;
  publish: (headline: string, kind: NewsKind, atMonth: number) => NewsItem;
  reset: () => void;
}

const mapKindToType = (kind: NewsKind): NewsType => {
  if (kind === 'player' || kind === 'rival' || kind === 'world') return kind;
  if (kind === 'company') return 'player';
  if (kind === 'deal' || kind === 'market') return 'world';
  return 'player';
};

const DEFAULT_SOURCES: Record<NewsType, string[]> = {
  player: ['Silicon Chronicle', 'Bloomberg Tech', 'TechCrunch', 'The Information'],
  rival: ['Financial Times', 'Wall St Journal', 'Reuters Tech', 'The Verge'],
  world: ['Global Macro Wire', 'Tech Insider', 'S&P Global', 'MarketWatch'],
};

export const useNewsStore = create<NewsState>()(
  persist(
    (set, get) => ({
      newsHistory: [],
      items: [],
      unreadCount: 0,
      announcedProductIds: [],
      announcedAcquisitionIds: [],

      addNewsBatch: (newItems) => {
        if (!newItems || newItems.length === 0) return;

        const timestamp = Date.now();
        const formattedItems: NewsItem[] = newItems.map((item, index) => {
          const type = item.type || (item.kind ? mapKindToType(item.kind) : 'world');
          const text = item.text || item.headline || '';
          const headline = item.headline || text;
          const category = item.category || (index === 0 ? 'Breaking' : type === 'rival' ? 'Exclusive' : 'Market');
          const sourceList = DEFAULT_SOURCES[type] || DEFAULT_SOURCES.world;
          const source = item.source || sourceList[Math.floor(Math.random() * sourceList.length)];
          const readTime = item.readTime || `${Math.max(1, Math.min(4, Math.ceil(text.length / 80)))} min read`;

          return {
            id: `news_q${item.quarter || 1}_${timestamp}_${index}_${Math.random().toString(36).substring(2, 7)}`,
            type,
            category,
            source,
            headline,
            text,
            quarter: item.quarter || 1,
            readTime,
            isHero: item.isHero ?? (index === 0),
            kind: (item.kind || type) as NewsKind,
            atMonth: item.atMonth ?? (item.quarter ? item.quarter * 3 : 1),
            isRead: false,
            createdAt: timestamp,
          };
        });

        // Replace previous quarter news with the fresh quarterly edition
        set({
          newsHistory: formattedItems,
          items: formattedItems,
          unreadCount: formattedItems.length,
        });
      },

      markAsRead: () => {
        const { newsHistory, unreadCount } = get();
        if (unreadCount === 0 && newsHistory.every((i) => i.isRead)) return;

        const updatedHistory = newsHistory.map((item) => (item.isRead ? item : { ...item, isRead: true }));
        set({
          unreadCount: 0,
          newsHistory: updatedHistory,
          items: updatedHistory,
        });
      },

      markProductAnnounced: (id: string) => {
        const current = get().announcedProductIds;
        if (!current.includes(id)) {
          set({ announcedProductIds: [...current, id] });
        }
      },

      markAcquisitionAnnounced: (id: string) => {
        const current = get().announcedAcquisitionIds;
        if (!current.includes(id)) {
          set({ announcedAcquisitionIds: [...current, id] });
        }
      },

      clearNews: () => set({ newsHistory: [], items: [], unreadCount: 0 }),

      publish: (headline, kind, atMonth) => {
        const quarter = Math.max(1, Math.ceil(atMonth / 3));
        const type = mapKindToType(kind);
        const timestamp = Date.now();
        const sourceList = DEFAULT_SOURCES[type] || DEFAULT_SOURCES.world;
        const source = sourceList[0];

        const item: NewsItem = {
          id: `news_${atMonth}_${timestamp}_${get().newsHistory.length}`,
          headline,
          text: headline,
          kind,
          type,
          category: 'Market',
          source,
          quarter,
          readTime: '2 min read',
          isHero: false,
          atMonth,
          isRead: false,
          createdAt: timestamp,
        };

        const nextHistory = [item, ...get().newsHistory].slice(0, MAX_ITEMS);
        set((state) => ({
          newsHistory: nextHistory,
          items: nextHistory,
          unreadCount: state.unreadCount + 1,
        }));
        return item;
      },

      reset: () => set({ newsHistory: [], items: [], unreadCount: 0, announcedProductIds: [], announcedAcquisitionIds: [] }),
    }),
    {
      name: 'succesor_news_v4',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        newsHistory: state.newsHistory,
        items: state.newsHistory,
        unreadCount: state.unreadCount,
        announcedProductIds: state.announcedProductIds,
        announcedAcquisitionIds: state.announcedAcquisitionIds,
      }),
    },
  ),
);
