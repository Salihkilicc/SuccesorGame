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
      primary: '#05A8F6', // Greek Blue
      secondary: '#FFFFFF', // White
      chipColor: '#05A8F6',
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
      primary: '#CFD0D2', // Turquoise
      secondary: '#FF8A8A', // Gold
      chipColor: '#CFD0D2',
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
      primary: '#05A8F6', // Purple
      secondary: '#FF8A8A', // Neon Pink
      chipColor: '#05A8F6',
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
      primary: '#FF8A8A', // Royal Red
      secondary: '#FF8A8A', // Velvet
      chipColor: '#FF8A8A',
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
      primary: '#FF8A8A', // Silver
      secondary: '#FFFFFF', // Glass/Cyan tint
      chipColor: '#FF8A8A',
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
      secondary: '#FF8A8A', // Gold
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
      primary: '#FF8A8A', // Dark Red
      secondary: '#FF8A8A', // Gold
      chipColor: '#FF8A8A',
    },
    chips: [100000000, 1000000000, 10000000000, 50000000000],
  },
];