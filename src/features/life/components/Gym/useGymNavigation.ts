import { create } from 'zustand';
import { GymViewType } from './gymData';

// ============================================================================
// GYM NAVIGATION STORE
// UI Layer: Manages visibility and active views.
// NO GAME LOGIC HERE.
// ============================================================================

interface GymNavigationState {
    isVisible: boolean;
    activeView: GymViewType;
    openGym: () => void;
    closeGym: () => void;
    navigate: (view: GymViewType) => void;
    goBackToHub: () => void;
}

export const useGymNavigation = create<GymNavigationState>((set) => ({
    isVisible: false,
    activeView: 'HUB',

    openGym: () => set({ isVisible: true, activeView: 'HUB' }),

    closeGym: () => set({ isVisible: false }),

    navigate: (view) => set({ activeView: view }),

    goBackToHub: () => set({ activeView: 'HUB' }),
}));
