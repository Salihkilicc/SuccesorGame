import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../storage/persist';
import { PartnerProfile, ExPartnerProfile, MarriageProposalResult } from '../types';
import { useStatsStore } from './useStatsStore';

export interface AcquiredCompany {
  id: string;
  name: string;
  symbol: string;
  category: string;
  acquisitionBuff: { type: string; value: number; label: string };
}

export type FamilyMember = {
  id: string;
  name: string;
  relation: 'Mother' | 'Father' | 'Sister' | 'Brother' | 'Sibling' | 'Son' | 'Daughter';
  relationship: number; // 0-100
  photo?: string | null;
};

export type Friend = {
  id: string;
  name: string;
  relationship: number; // 0-100
  photo?: string | null;
};

export type ExPartner = {
  id: string;
  name: string;
  relationship: number; // 0-100
  reason?: string;
  photo?: string | null;
};

// Note: PartnerProfile and ExPartnerProfile are now imported from data/types
// The comprehensive relationship types are defined in data/relationshipTypes.ts

// ... types
export type InventoryItem = {
  id: string;
  name: string;
  price: number;
  type: string;
  shopId: string;
  brand?: string;
  location?: string;
  purchasedAt: number; // timestamp
};

// Custom User Job Type
export interface UserJob {
  id: string;
  title: string;
  salary: number; // Monthly salary
}

export type UserState = {
  name: string;
  bio: string;
  gender?: 'male' | 'female' | 'other';
  profilePhoto?: string | null;
  hasPremium: boolean;
  avatarUrl?: string | null;
  partner: PartnerProfile | null; // Updated to use comprehensive PartnerProfile
  job: UserJob | null; // NEW: Track player's job
  family: FamilyMember[];
  friends: Friend[];
  exes: ExPartnerProfile[]; // Updated to use ExPartnerProfile with breakup details
  inventory: InventoryItem[];
  subsidiaries: AcquiredCompany[];
  hasEngagementRing: boolean;
  gymState: {
    gymStatus: number; // 0-100
    membership: 'titanium' | 'elite' | null;
    unlockedTiers: ('titanium' | 'elite')[];
    trainerId: 'sarah' | 'marcus' | 'ken' | null;
    martialArts: Record<string, number>; // discipline -> level (0-6)
    combatStrength: number;
  };
};

type UserStore = UserState & {
  update: (partial: Partial<UserState>) => void;
  setField: <K extends keyof UserState>(key: K, value: UserState[K]) => void;
  setName: (name: string) => void;
  setBio: (bio: string) => void;
  setAvatarUrl: (url: string | null) => void;
  setHasPremium: (value: boolean) => Promise<void>;
  addItem: (item: InventoryItem) => void;
  updateGymState: (partial: Partial<UserState['gymState']>) => void;
  addSubsidiary: (company: AcquiredCompany) => void;
  setAll: (partial: Partial<UserState>) => void; // Helper requested by user (same as update)
  updateJob: (job: UserJob | null) => void; // NEW Action

  // === RELATIONSHIP ENGINE ACTIONS ===
  setPartner: (newPartner: PartnerProfile | null) => void;
  proposeMarriage: (withPrenup: boolean, locationBonus?: number) => MarriageProposalResult;
  marryPartner: (hasPrenup: boolean) => void;
  removeItem: (itemId: string) => void;
  breakUp: (reason: ExPartnerProfile['breakupReason']) => void;
  updateSpecificStat: (statId: string, value: number) => void; // For DNA stats from education

  reset: () => void;
};

export const initialUserState: UserState = {
  name: 'John Rich',
  bio: 'Beta Tester - CEO Edition',
  gender: 'male',
  profilePhoto: null,
  avatarUrl: null,
  hasPremium: true, // Gift premium for beta testing
  partner: null, // Will be set via setPartner action
  // BETA START: CEO Job
  job: {
    id: 'ceo_start',
    title: 'CEO',
    salary: 50000
  },
  family: [
    {
      id: 'mom-1',
      name: 'Martha',
      relation: 'Mother',
      relationship: 85,
    },
    {
      id: 'sib-1',
      name: 'Tom',
      relation: 'Brother',
      relationship: 60,
    },
  ],
  friends: [
    { id: 'fr-1', name: 'Mike', relationship: 75 },
    { id: 'fr-2', name: 'Sarah', relationship: 65 },
  ],
  exes: [],
  inventory: [],
  subsidiaries: [],
  hasEngagementRing: false,
  gymState: {
    gymStatus: 0,
    membership: null,
    unlockedTiers: ['titanium'],
    trainerId: null,
    martialArts: {
      boxing: 0,
      mma: 0,
      kungfu: 0,
      karate: 0,
      kravmaga: 0,
    },
    combatStrength: 0,
  },
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      ...initialUserState,
      update: partial => set(state => ({ ...state, ...partial })),
      setField: (key, value) => set(state => ({ ...state, [key]: value })),
      setName: name => set(state => ({ ...state, name })),
      setBio: bio => set(state => ({ ...state, bio })),
      setAvatarUrl: url => set(state => ({ ...state, avatarUrl: url })),
      setHasPremium: async value => {
        set(state => ({ ...state, hasPremium: value }));
      },
      addItem: item =>
        set(state => {
          const isRing = item.type === 'ring';
          return {
            ...state,
            inventory: [...state.inventory, item],
            hasEngagementRing: state.hasEngagementRing || isRing,
          };
        }),
      removeItem: (itemId) =>
        set(state => ({
          ...state,
          inventory: state.inventory.filter(i => i.id !== itemId),
          hasEngagementRing: state.inventory.some(i => i.id !== itemId && i.type === 'ring')
        })),
      updateGymState: partial =>
        set(state => ({
          ...state,
          gymState: { ...state.gymState, ...partial },
        })),
      addSubsidiary: (company) => set((state) => ({
        subsidiaries: [...state.subsidiaries, company]
      })),
      setAll: (partial) => set((state) => ({ ...state, ...partial })),
      updateJob: (job) => set((state) => ({ ...state, job })),

      // ============================================================================
      // RELATIONSHIP ENGINE ACTIONS
      // ============================================================================

      /**
       * Set a new partner or clear current partner
       */
      setPartner: (newPartner) =>
        set(state => ({
          ...state,
          partner: newPartner,
        })),

      /**
       * Propose marriage to current partner
       * @param withPrenup - Whether to propose with a prenuptial agreement
       * @param locationBonus - Bonus chance from the location (optional)
       * @returns MarriageProposalResult with success status and message
       */
      proposeMarriage: (withPrenup, locationBonus = 0) => {
        const state = get();
        const partner = state.partner;

        if (!partner) {
          return {
            success: false,
            message: 'You need a partner to propose marriage!',
          };
        }

        if (partner.isMarried) {
          return {
            success: false,
            message: 'You are already married!',
          };
        }

        // === MARRIAGE PROPOSAL LOGIC ===
        // Base chance = partner's love level
        let baseChance = partner.love;

        // Prenup Penalty: Intelligent partners are harder to convince
        // Formula: 30 + (intelligence / 5)
        let prenupPenalty = 0;
        if (withPrenup) {
          prenupPenalty = 30 + (partner.stats.intelligence / 5);
        }

        // Final acceptance chance
        // Add location bonus (default 0)
        const bonus = locationBonus || 0;
        const finalChance = baseChance - prenupPenalty + bonus;

        const roll = Math.random() * 100;

        // === SPECIAL CASE: Royalty & Billionaire Heirs ===
        // These social classes ALWAYS require prenup, regardless of user choice
        const forcedPrenup = ['Royalty', 'BillionaireHeir'].includes(partner.stats.socialClass);
        const actualPrenup = withPrenup || forcedPrenup;

        if (roll <= finalChance) {
          // === ACCEPTED ===
          // We DO NOT set state here anymore. 
          // 'marryPartner' will be called by UI upon confirmation/celebration.

          const prenupMessage = forcedPrenup && !withPrenup
            ? ' (They insisted on a prenup!)'
            : actualPrenup
              ? ' (with prenup)'
              : '';

          return {
            success: true,
            message: `${partner.name} accepted your proposal!${prenupMessage}`,
          };
        } else {
          // === REJECTED ===
          // Love decreases by 20 due to trust issues
          const newLove = Math.max(0, partner.love - 20);

          set(state => ({
            ...state,
            partner: state.partner
              ? {
                ...state.partner,
                love: newLove,
              }
              : null,
          }));

          return {
            success: false,
            message: `${partner.name} rejected your proposal. Trust has been damaged.`,
            loveChange: -20,
          };
        }
      },

      /**
       * Officializes the marriage
       */
      marryPartner: (hasPrenup) =>
        set(state => ({
          ...state,
          partner: state.partner
            ? {
              ...state.partner,
              isMarried: true,
              hasPrenup,
            }
            : null,
        })),

      /**
       * Break up with current partner
       * Handles divorce settlements if married without prenup
       * @param reason - Reason for breakup
       */
      breakUp: (reason) => {
        const state = get();
        const partner = state.partner;
        const statsStore = useStatsStore.getState();

        if (!partner) {
          console.warn('No partner to break up with');
          return;
        }

        // === DIVORCE SETTLEMENT ===
        // If married without prenup, lose 50% of personal wealth
        if (partner.isMarried && !partner.hasPrenup) {
          // Update money in stats store
          const currentMoney = statsStore.money;
          const settlement = currentMoney * 0.5;
          const remainingMoney = currentMoney - settlement;
          statsStore.setField('money', remainingMoney);

          console.log(
            `💔 DIVORCE SETTLEMENT: Lost $${settlement.toLocaleString()} (50% of wealth). Remaining: $${remainingMoney.toLocaleString()}`
          );
        }

        // === ARCHIVE TO EXES ===
        // Convert current partner to ex-partner with breakup details
        const exPartner: ExPartnerProfile = {
          ...partner,
          breakupReason: reason,
          breakupDateAge: new Date().getFullYear() - 1995, // Placeholder: Calculate from birth year or use game time
        };

        // Update state: clear partner, add to exes
        set(state => ({
          ...state,
          partner: null,
          exes: [...state.exes, exPartner],
        }));

        console.log(`💔 Broke up with ${partner.name}. Reason: ${reason}`);
      },

      /**
       * Update any specific stat by ID (for education DNA stat bonuses)
       * Routes stats to the correct nested state object
       */
      updateSpecificStat: (statId, value) => {
        set(state => {
          // Clamp value between 0 and 100
          const clampedValue = Math.max(0, Math.min(100, value));

          // Route to appropriate state based on statId
          // Security stats
          if (['digitalShield', 'bodyguard', 'policeHeat'].includes(statId)) {
            return {
              ...state,
              // Note: Assuming security exists in user store or we need to add it
              // For now, log it as this structure may need to be added
            };
          }

          // Reputation stats
          if (['businessTrust', 'highSociety', 'streetCred', 'casinoVIP'].includes(statId)) {
            return {
              ...state,
              // Note: Reputation may be in player store, not user store
              // For now, log it
            };
          }

          // Core genetics/attributes
          if (['intellect', 'charm', 'looks', 'strength'].includes(statId)) {
            return {
              ...state,
              // Note: These are in player store attributes, not user store
              // For now, log it
            };
          }

          // Combat stats
          if (statId === 'martialArts') {
            return {
              ...state,
              gymState: {
                ...state.gymState,
                // Update martial arts level
              }
            };
          }

          // Happiness stat
          if (statId === 'happiness') {
            return state; // In player store core stats
          }

          console.log(`[Education Bonus] ${statId} +${value} (routed)`);
          return state;
        });
      },

      reset: () => set(() => ({ ...initialUserState })),
    }),
    {
      name: 'succesor_user_v3',
      storage: createJSONStorage(() => zustandStorage),
      partialize: state => ({
        name: state.name,
        bio: state.bio,
        gender: state.gender,
        avatarUrl: state.avatarUrl,
        hasPremium: state.hasPremium,
        partner: state.partner,
        job: state.job, // Persist Job
        family: state.family,
        friends: state.friends,
        exes: state.exes, // Now includes full ExPartnerProfile data
        inventory: state.inventory,
        hasEngagementRing: state.hasEngagementRing,
        gymState: state.gymState,
        subsidiaries: state.subsidiaries,
        // Note: DNA stats would be added here when implemented
      }) as any,
    },
  ),
);
