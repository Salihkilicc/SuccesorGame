export type CategoryKey = 'bonds' | 'crypto' | 'stocks';

export type BondCategory = 'government' | 'local' | 'corporate';

export type RiskLevel = 'Very Low' | 'Low' | 'Medium' | 'Medium-High' | 'High';

export interface BondItem {
  id: string;
  name: string;
  years: number;
  coupon: number;
  risk: RiskLevel;
  category: BondCategory;
}

export interface CryptoAsset {
  id: string;
  name: string;
  cost: number;
  trend: 'High Trend' | 'Low Trend';
  change: number;
  risk: 'High';
  marketCap: number; // in billions (placeholder)
}

export interface AcquisitionBuff {
  type: 'R_AND_D_SPEED' | 'PRODUCTION_COST' | 'LOAN_INTEREST' | 'MARKETING_BOOST';
  value: number; // e.g. 0.1 for 10%
  label: string; // e.g. "R&D Speed +10%"
}

export interface StockItem {
  id: string;
  symbol: string;
  name: string; // Maps to 'company' in legacy, keeping legacy support or refactoring? 
  // User snippet uses 'name', legacy uses 'company'. I will use 'name' and map 'company' to it if needed or just use 'name'.
  // Actually, existing has 'company'. I'll add 'name' and 'company' or just replace.
  // User snippet: "name: 'Pear Inc.'".
  // Legacy: "company: string".
  // I will use `name` as primary, but maybe keep `company` optional to avoid breaking other files?
  // No, I'll standardize on `name` as requested, but I should check if `company` is used elsewhere.
  // Looking at `marketData.ts` (Step 715), STOCKS uses `name`.
  // Wait, `marketTypes.ts` (Step 721) uses `company` in `StockItem`.
  // `marketData.ts` (Step 715) uses `name` in `Stock` type (local definitions there).
  // I will UNIFY to `name`.

  price: number;
  change: number; // Maps to 'dailyChange' in legacy?
  // Legacy: dailyChange, yearlyChange.
  // User snippet: change.
  // I'll add `change` and keep `dailyChange` optional or just use `change`.

  category: 'Technology' | 'Industrial' | 'Finance' | 'Health' | 'Energy' | 'Consumer' | 'Crypto' | 'High Risk';
  risk: RiskLevel;
  description?: string;

  // ACQUISITION FIELDS
  acquisitionCost: number; // Cost to buy 100% ownership
  acquisitionBuff: AcquisitionBuff;
  isAcquired: boolean; // Default false
}

// Ensure strict compatibility if others use "company"
// I will just implement the user's requested structure.

export interface HoldingItem {
  id: string;
  symbol: string;
  quantity: number;
  averageCost: number;
  type: 'stock' | 'crypto' | 'bond';
}
