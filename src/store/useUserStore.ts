import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../storage/persist';

export type FamilyMember = {
  id: string;
  name: string;
  relation: 'Mother' | 'Father' | 'Sister' | 'Brother' | 'Sibling';
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

export type PartnerProfile = {
  name: string;
  mood: string;
  love: number;
  photo?: string | null;
};

export type UserState = {
  name: string;
  bio: string;
  gender?: 'male' | 'female' | 'other';
  profilePhoto?: string | null;
  hasPremium: boolean;
  avatarUrl?: string | null;
  partner?: PartnerProfile | null;
  family: FamilyMember[];
  friends: Friend[];
  exes: ExPartner[];
};

type UserStore = UserState & {
  update: (partial: Partial<UserState>) => void;
  setField: <K extends keyof UserState>(key: K, value: UserState[K]) => void;
  setName: (name: string) => void;
  setBio: (bio: string) => void;
  setAvatarUrl: (url: string | null) => void;
  setHasPremium: (value: boolean) => Promise<void>;
  reset: () => void;
};

export const initialUserState: UserState = {
  name: 'John Rich',
  bio: 'New to the rich life.',
  gender: 'male',
  profilePhoto: null,
  avatarUrl: null,
  hasPremium: false,
  partner: {
    name: 'Anna',
    mood: 'Neutral',
    love: 68,
    photo: null,
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
};

export const useUserStore = create<UserStore>()(
  persist(
    set => ({
      ...initialUserState,
      update: partial => set(state => ({ ...state, ...partial })),
      setField: (key, value) => set(state => ({ ...state, [key]: value })),
      setName: name => set(state => ({ ...state, name })),
      setBio: bio => set(state => ({ ...state, bio })),
      setAvatarUrl: url => set(state => ({ ...state, avatarUrl: url })),
      setHasPremium: async value => {
        set(state => ({ ...state, hasPremium: value }));
      },
      reset: () => set(() => ({ ...initialUserState })),
    }),
    {
      name: 'succesor_user_v1',
      storage: createJSONStorage(() => zustandStorage),
      partialize: state => ({
        name: state.name,
        bio: state.bio,
        gender: state.gender,
        avatarUrl: state.avatarUrl,
        hasPremium: state.hasPremium,
        partner: state.partner,
        family: state.family,
        friends: state.friends,
        exes: state.exes,
      }) as any,
    },
  ),
);
