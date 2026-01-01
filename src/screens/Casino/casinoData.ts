// src/screens/Casino/casinoData.ts
import type { CasinoStackParamList } from '../../navigation';

export type LocationId = 'greece' | 'las_vegas' | 'monaco' | 'montenegro' | 'macau' | 'singapore';

export type CasinoLocation = {
  id: LocationId;
  name: string;
  requirement: number;
};

export const CASINO_LOCATIONS: CasinoLocation[] = [
  { id: 'greece', name: 'Greece', requirement: 0 },
  { id: 'las_vegas', name: 'Las Vegas', requirement: 20 },
  { id: 'monaco', name: 'Monaco', requirement: 40 },
  { id: 'montenegro', name: 'Montenegro', requirement: 30 },
  { id: 'macau', name: 'Macau', requirement: 50 },
  { id: 'singapore', name: 'Singapore', requirement: 60 },
];

export const SLOT_VARIANTS = [
  {
    id: 'street_fighter' as const,
    title: 'Street Fighter Slots',
    icon: '🎮',
    note: 'Volatility: Medium',
  },
  {
    id: 'poseidon' as const,
    title: "Poseidon's Fortune",
    icon: '🌊',
    note: 'Volatility: Medium-High',
  },
];

export const HIGH_ROLLER_SLOT = {
  id: 'high_roller' as const,
  title: 'High Roller Deluxe',
  icon: '💎',
  note: 'Volatility: High',
};