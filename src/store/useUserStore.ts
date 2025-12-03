import {create} from 'zustand';

export type PartnerProfile = {
  name: string;
  mood: string;
  love: number;
  photo?: string | null;
};

export type UserState = {
  name: string;
  bio: string;
  profilePhoto?: string | null;
  hasPremium: boolean;
  partner?: PartnerProfile | null;
};

type UserStore = UserState & {
  update: (partial: Partial<UserState>) => void;
  setField: <K extends keyof UserState>(key: K, value: UserState[K]) => void;
};

const initialState: UserState = {
  name: 'Alex Doe',
  bio: 'Curious strategist balancing life, love, and assets.',
  profilePhoto: null,
  hasPremium: false,
  partner: {
    name: 'Anna',
    mood: 'Neutral',
    love: 68,
    photo: null,
  },
};

export const useUserStore = create<UserStore>(set => ({
  ...initialState,
  update: partial => set(state => ({...state, ...partial})),
  setField: (key, value) => set(state => ({...state, [key]: value})),
}));
