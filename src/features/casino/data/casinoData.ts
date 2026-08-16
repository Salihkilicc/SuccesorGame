// src/features/casino/data/casinoData.ts

export type LocationId =
  | 'athens'
  | 'istanbul'
  | 'las_vegas'
  | 'london'
  | 'singapore'
  | 'monte_carlo'
  | 'macau';

export interface CasinoTheme {
  primary: string;
  secondary: string;
  chipColor: string;
  gradient: string[];
  bgGradient: string[];
  accentGlow: string;
  badgeBg: string;
  textColor: string;
  icon: string;
  flag: string;
}

export type CasinoLocation = {
  id: LocationId;
  name: string;
  subTitle: string;
  requirement: number;
  maxBet: number;
  theme: CasinoTheme;
  chips: number[];
};

export const CASINO_LOCATIONS: CasinoLocation[] = [
  {
    id: 'athens',
    name: 'Athens',
    subTitle: 'The Agora',
    requirement: 0,
    maxBet: 1_000_000,
    theme: {
      primary: '#05A8F6',
      secondary: '#EFC94C',
      chipColor: '#05A8F6',
      gradient: ['#05A8F6', '#0C6C9C'],
      bgGradient: ['#132838', '#1C242C', '#161F28'],
      accentGlow: 'rgba(5, 168, 246, 0.25)',
      badgeBg: 'rgba(5, 168, 246, 0.15)',
      textColor: '#7DD3FC',
      icon: 'pillar',
      flag: '🇬🇷',
    },
    chips: [1000, 5000, 10000, 50000],
  },
  {
    id: 'istanbul',
    name: 'Istanbul',
    subTitle: 'Bosphorus Royale',
    requirement: 100,
    maxBet: 5_000_000,
    theme: {
      primary: '#3FC9C0',
      secondary: '#FFA94D',
      chipColor: '#3FC9C0',
      gradient: ['#3FC9C0', '#1C6B66'],
      bgGradient: ['#142B2B', '#1C242C', '#142022'],
      accentGlow: 'rgba(63, 201, 192, 0.25)',
      badgeBg: 'rgba(63, 201, 192, 0.15)',
      textColor: '#6EE7B7',
      icon: 'mosque',
      flag: '🇹🇷',
    },
    chips: [50000, 100000, 500000, 2500000],
  },
  {
    id: 'las_vegas',
    name: 'Las Vegas',
    subTitle: 'Neon Palace',
    requirement: 200,
    maxBet: 25_000_000,
    theme: {
      primary: '#C4B5FD',
      secondary: '#F09BD0',
      chipColor: '#C4B5FD',
      gradient: ['#A78BFA', '#E879F9'],
      bgGradient: ['#281E38', '#1C242C', '#22192A'],
      accentGlow: 'rgba(196, 181, 253, 0.25)',
      badgeBg: 'rgba(196, 181, 253, 0.15)',
      textColor: '#DDD6FE',
      icon: 'dice-multiple',
      flag: '🇺🇸',
    },
    chips: [100000, 500000, 2500000, 10000000],
  },
  {
    id: 'london',
    name: 'London',
    subTitle: 'The Crown Club',
    requirement: 300,
    maxBet: 100_000_000,
    theme: {
      primary: '#93A0F7',
      secondary: '#EFC94C',
      chipColor: '#93A0F7',
      gradient: ['#6366F1', '#3730A3'],
      bgGradient: ['#1C2038', '#1C242C', '#181A28'],
      accentGlow: 'rgba(147, 160, 247, 0.25)',
      badgeBg: 'rgba(147, 160, 247, 0.15)',
      textColor: '#C7D2FE',
      icon: 'crown',
      flag: '🇬🇧',
    },
    chips: [500000, 2500000, 10000000, 50000000],
  },
  {
    id: 'singapore',
    name: 'Singapore',
    subTitle: 'Marina Bay Heights',
    requirement: 400,
    maxBet: 1_000_000_000,
    theme: {
      primary: '#4ADE80',
      secondary: '#7DD3FC',
      chipColor: '#4ADE80',
      gradient: ['#10B981', '#065F46'],
      bgGradient: ['#142B22', '#1C242C', '#13201B'],
      accentGlow: 'rgba(74, 222, 128, 0.25)',
      badgeBg: 'rgba(74, 222, 128, 0.15)',
      textColor: '#86EFAC',
      icon: 'city-variant',
      flag: '🇸🇬',
    },
    chips: [2500000, 10000000, 50000000, 500000000],
  },
  {
    id: 'monte_carlo',
    name: 'Monte Carlo',
    subTitle: 'Le Grand Casino',
    requirement: 500,
    maxBet: 10_000_000_000,
    theme: {
      primary: '#EFC94C',
      secondary: '#FFA94D',
      chipColor: '#EFC94C',
      gradient: ['#F59E0B', '#B45309'],
      bgGradient: ['#2E2718', '#1C242C', '#221E15'],
      accentGlow: 'rgba(239, 201, 76, 0.25)',
      badgeBg: 'rgba(239, 201, 76, 0.15)',
      textColor: '#FDE68A',
      icon: 'diamond-stone',
      flag: '🇲🇨',
    },
    chips: [10000000, 50000000, 500000000, 5000000000],
  },
  {
    id: 'macau',
    name: 'Macau',
    subTitle: "Dragon's Ascendancy",
    requirement: 600,
    maxBet: 100_000_000_000,
    theme: {
      primary: '#FF8A8A',
      secondary: '#FFA94D',
      chipColor: '#FF8A8A',
      gradient: ['#EF4444', '#991B1B'],
      bgGradient: ['#30191C', '#1C242C', '#261517'],
      accentGlow: 'rgba(255, 138, 138, 0.25)',
      badgeBg: 'rgba(255, 138, 138, 0.15)',
      textColor: '#FECACA',
      icon: 'fire',
      flag: '🇲🇴',
    },
    chips: [100000000, 1000000000, 10000000000, 50000000000],
  },
];