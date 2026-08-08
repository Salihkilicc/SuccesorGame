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
  bgImage?: string; // Optional for now, can be added later
}

export type CasinoLocation = {
  id: LocationId;
  name: string;
  subTitle: string; // Added for flavor text like "The Agora"
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
      primary: '#0A2A92', // Greek Blue
      secondary: '#FFFFFF', // White
      chipColor: '#0A2A92',
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
      primary: '#5FB37A', // Turquoise
      secondary: '#E9B8C9', // Gold
      chipColor: '#5FB37A',
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
      primary: '#0A2A92', // Purple
      secondary: '#E06B6B', // Neon Pink
      chipColor: '#0A2A92',
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
      primary: '#E06B6B', // Royal Red
      secondary: '#E06B6B', // Velvet
      chipColor: '#E06B6B',
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
      primary: '#E9B8C9', // Silver
      secondary: '#FFFFFF', // Glass/Cyan tint
      chipColor: '#E9B8C9',
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
      primary: '#FFFFFF', // Cream
      secondary: '#E9B8C9', // Gold
      chipColor: '#FFFFFF',
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
      primary: '#E06B6B', // Dark Red
      secondary: '#E9B8C9', // Gold
      chipColor: '#E06B6B',
    },
    chips: [100000000, 1000000000, 10000000000, 50000000000],
  },
];