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
      primary: '#6004BD', // Greek Blue
      secondary: '#FFFFFF', // White
      chipColor: '#6004BD',
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
      primary: '#C8C0EF', // Turquoise
      secondary: '#C734CA', // Gold
      chipColor: '#C8C0EF',
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
      primary: '#6004BD', // Purple
      secondary: '#C836CA', // Neon Pink
      chipColor: '#6004BD',
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
      primary: '#C836CA', // Royal Red
      secondary: '#C836CA', // Velvet
      chipColor: '#C836CA',
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
      primary: '#C734CA', // Silver
      secondary: '#FFFFFF', // Glass/Cyan tint
      chipColor: '#C734CA',
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
      secondary: '#C734CA', // Gold
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
      primary: '#C836CA', // Dark Red
      secondary: '#C734CA', // Gold
      chipColor: '#C836CA',
    },
    chips: [100000000, 1000000000, 10000000000, 50000000000],
  },
];