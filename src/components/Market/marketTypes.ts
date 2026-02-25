export type CategoryKey = 'bonds' | 'crypto' | 'stocks' | 'funds';

export type FundCategory = 'Index' | 'Sector' | 'Commodity';

export type RiskLevel = 'Very Low' | 'Low' | 'Medium' | 'Medium-High' | 'High' | 'Extreme';

// ─── Types used by MarketScreen / marketData.ts (acquisition system) ────────

export type AcquisitionCategory = 'Technology' | 'Industrial' | 'Finance' | 'Health';

export interface AcquisitionBuff {
  type: 'R_AND_D_SPEED' | 'PRODUCTION_COST' | 'LOAN_INTEREST' | 'MARKETING_BOOST';
  value: number;
  label: string;
}

export interface StockItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  category: AcquisitionCategory;
  risk: RiskLevel;
  description?: string;
  marketCap: number;

  // Acquisition fields
  acquisitionCost: number;
  acquisitionBuff: AcquisitionBuff;
  isAcquired: boolean;
}

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  volatility: 'Low' | 'Medium' | 'High' | 'Extreme';
  marketCap: number;
  risk: RiskLevel;
  description?: string;
}

export interface BondItem {
  id: string;
  name: string;
  faceValue: number;
  couponRate: number;
  duration: number;
  risk: RiskLevel;
  issuerType: 'Government' | 'Corporate' | 'Municipal';
  creditRating: 'AAA' | 'AA' | 'A' | 'B' | 'CCC';
  maturityDate: number | string;
}

export interface FundItem {
  id: string;
  name: string;
  symbol?: string;
  price: number;
  change: number;
  expenseRatio: number;
  category: FundCategory;
  risk: RiskLevel;
  description?: string;
  topHoldings: string[];
}

export type MarketItem = StockItem | BondItem | FundItem | CryptoAsset;

export interface HoldingItem {
  id: string;
  symbol: string;
  quantity: number;
  averageCost: number;
  type: 'stock' | 'crypto' | 'bond' | 'fund';
}

// ─── Simpler types used by BondsList / CryptoList / StocksList components ───

export type BondCategory = 'government' | 'local' | 'corporate';

export interface SimpleBondItem {
  id: string;
  name: string;
  coupon: number;
  years: number;
  risk: RiskLevel;
  category: BondCategory;
}

export interface SimpleCryptoAsset {
  id: string;
  name: string;
  cost: number;
  trend: string;
  change: number;
  risk: RiskLevel;
  marketCap: number;
}

export type StockSector =
  | 'Technology' | 'Materials' | 'Industrials' | 'Healthcare'
  | 'Financial' | 'Energy' | 'Consumer' | 'Communication';

export interface SimpleStockItem {
  id: string;
  symbol: string;
  company: string;
  price: number;
  dailyChange: number;
  yearlyChange: number;
  sector: StockSector;
  risk: RiskLevel;
  marketCap: number;
}

