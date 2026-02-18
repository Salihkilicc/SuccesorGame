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
      primary: '#0057B7', // Greek Blue
      secondary: '#FFFFFF', // White
      chipColor: '#0057B7',
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
      primary: '#40E0D0', // Turquoise
      secondary: '#FFD700', // Gold
      chipColor: '#40E0D0',
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
      primary: '#9B30FF', // Purple
      secondary: '#FF69B4', // Neon Pink
      chipColor: '#9B30FF',
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
      primary: '#C8102E', // Royal Red
      secondary: '#DA291C', // Velvet
      chipColor: '#C8102E',
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
      primary: '#C0C0C0', // Silver
      secondary: '#E0FFFF', // Glass/Cyan tint
      chipColor: '#C0C0C0',
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
      primary: '#F5DEB3', // Cream
      secondary: '#FFD700', // Gold
      chipColor: '#F5DEB3',
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
      primary: '#8B0000', // Dark Red
      secondary: '#FFD700', // Gold
      chipColor: '#8B0000',
    },
    chips: [100000000, 1000000000, 10000000000, 50000000000],
  },
];