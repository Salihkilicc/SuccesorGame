import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CalendarEvent = {
    id: string;
    date: string; // Format: 'YYYY-MM-DD'
    title: string;
    description: string;
};

type CalendarState = {
    _hasHydrated: boolean;
    events: CalendarEvent[];
};

type CalendarStore = CalendarState & {
    setHasHydrated: (value: boolean) => void;
    addEvent: (event: CalendarEvent) => void;
    removeEvent: (id: string) => void;
};

// Calculate tomorrow's date for the test event
const getTomorrowDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const d = String(tomorrow.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const initialState: CalendarState = {
    _hasHydrated: false,
    events: [
        {
            id: 'demo-1',
            date: getTomorrowDate(),
            title: 'Board Meeting',
            description:
                'Quarterly strategy meeting with the board of directors. New investment plans and growth targets will be discussed.',
        },
    ],
};

export const useCalendarStore = create<CalendarStore>()(
    persist(
        (set) => ({
            ...initialState,
            setHasHydrated: (value) => set({ _hasHydrated: value }),
            addEvent: (event) =>
                set((state) => ({ events: [...state.events, event] })),
            removeEvent: (id) =>
                set((state) => ({
                    events: state.events.filter((e) => e.id !== id),
                })),
        }),
        {
            name: 'succesor_calendar_v2',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ events: state.events }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.setHasHydrated(true);
                }
            },
        },
    ),
);
