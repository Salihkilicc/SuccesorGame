// src/core/market/governanceTypes.ts
//
// The board member traits, on their own so that pure helpers can import them
// without pulling in governance.ts - which imports i18n, which imports
// AsyncStorage. A type should not cost a device to read.

export type TraitType =
    | 'Shark'
    | 'Loyalist'
    | 'Conservative'
    | 'Visionary'
    | 'Aggressive'
    | 'Snake';
