import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../storage/persist';
import { RESEARCHER_ECONOMICS, getFacilityByTier, getNextTier } from '../features/laboratory/data/laboratoryData';

interface LaboratoryState {
    currentTier: number;
    researcherCount: number;
    totalRP: number;
}

interface LaboratoryActions {
    upgradeFacility: (playerCash: number, deductCash: (amount: number) => void) => { success: boolean; message: string };
    hireResearchers: (count: number, playerCash: number, deductCash: (amount: number) => void) => { success: boolean; message: string };
    fireResearchers: (count: number) => void;
    processQuarter: (deductCash: (amount: number) => void) => { rpAwarded: number; salaryPaid: number };
    addRP: (amount: number) => void;
    spendRP: (amount: number) => boolean;
    reset: () => void;
}

const initialState: LaboratoryState = {
    currentTier: 1,
    researcherCount: 0,
    totalRP: 0,
};

export const useLaboratoryStore = create<LaboratoryState & LaboratoryActions>()(
    persist(
        (set, get) => ({
            ...initialState,

            upgradeFacility: (playerCash, deductCash) => {
                const state = get();
                const nextTier = getNextTier(state.currentTier);

                if (!nextTier) {
                    return { success: false, message: 'Already at maximum tier' };
                }

                if (!nextTier.upgradeCost) {
                    return { success: false, message: 'Invalid upgrade cost' };
                }

                const { cash, rp } = nextTier.upgradeCost;

                if (playerCash < cash) {
                    return { success: false, message: `Insufficient cash. Need $${(cash / 1_000_000).toFixed(0)}M` };
                }

                if (state.totalRP < rp) {
                    return { success: false, message: `Insufficient RP. Need ${rp.toLocaleString()} RP` };
                }

                // Deduct costs
                deductCash(cash);
                set({ totalRP: state.totalRP - rp, currentTier: nextTier.tier });

                return { success: true, message: `Upgraded to ${nextTier.name}!` };
            },

            hireResearchers: (count, playerCash, deductCash) => {
                const state = get();
                const facility = getFacilityByTier(state.currentTier);

                if (!facility) {
                    return { success: false, message: 'Invalid facility tier' };
                }

                const newCount = state.researcherCount + count;

                if (newCount > facility.capacity) {
                    return { success: false, message: `Exceeds capacity of ${facility.capacity}` };
                }

                const cost = count * RESEARCHER_ECONOMICS.SALARY_PER_QUARTER;

                if (playerCash < cost) {
                    return { success: false, message: `Insufficient cash. Need $${(cost / 1_000_000).toFixed(1)}M` };
                }

                deductCash(cost);
                set({ researcherCount: newCount });

                return { success: true, message: `Hired ${count} researchers` };
            },

            fireResearchers: (count) => {
                const state = get();
                const newCount = Math.max(0, state.researcherCount - count);
                set({ researcherCount: newCount });
            },

            processQuarter: (deductCash) => {
                const state = get();
                const salaryPaid = state.researcherCount * RESEARCHER_ECONOMICS.SALARY_PER_QUARTER;
                const rpAwarded = state.researcherCount * RESEARCHER_ECONOMICS.RP_OUTPUT_PER_QUARTER;

                deductCash(salaryPaid);
                set({ totalRP: state.totalRP + rpAwarded });

                return { rpAwarded, salaryPaid };
            },

            addRP: (amount) => {
                set((state) => ({ totalRP: state.totalRP + amount }));
            },

            spendRP: (amount) => {
                const state = get();
                if (state.totalRP < amount) return false;
                set({ totalRP: state.totalRP - amount });
                return true;
            },

            reset: () => set(initialState),
        }),
        {
            name: 'succesor_laboratory',
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                currentTier: state.currentTier,
                researcherCount: state.researcherCount,
                totalRP: state.totalRP,
            }),
        }
    )
);
