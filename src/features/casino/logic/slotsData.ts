// src/screens/Casino/logic/slotsData.ts

export type SlotVariant = 'street_fighter' | 'poseidon' | 'high_roller';

export type SlotConfig = {
  title: string;
  icon: string;
  subtitle: string;
  symbols: string[];
  multipliers: Record<string, number>;
  twoKindMultiplier: number;
  minBet: number;
  maxBet: number;
};

export const SLOT_CONFIG: Record<SlotVariant, SlotConfig> = {
  street_fighter: {
    title: 'Street Fighter Slots',
    icon: '🎮',
    subtitle: 'Arcade wilds & bonus spins',
    symbols: ['🥊', '🔥', '💰', '⭐', '⚡'],
    multipliers: {
      '🥊': 5, '🔥': 6, '💰': 8, '⭐': 9, '⚡': 10,
    },
    twoKindMultiplier: 1.6,
    minBet: 1000,
    maxBet: 30000,
  },
  poseidon: {
    title: "Poseidon's Fortune",
    icon: '🌊',
    subtitle: 'Tidal multipliers & treasure chests',
    symbols: ['⚓', '🌊', '🐚', '🐙', '💎'],
    multipliers: {
      '⚓': 5, '🌊': 6, '🐚': 7, '🐙': 8, '💎': 11,
    },
    twoKindMultiplier: 1.8,
    minBet: 1000,
    maxBet: 35000,
  },
  high_roller: {
    title: 'High Roller Deluxe',
    icon: '💎',
    subtitle: 'Premium stakes and luxe jackpots',
    symbols: ['💎', '7️⃣', '🍀', '💰', '👑'],
    multipliers: {
      '💎': 10, '7️⃣': 9, '🍀': 7, '💰': 8, '👑': 12,
    },
    twoKindMultiplier: 2,
    minBet: 5000,
    maxBet: 100_000,
  },
};