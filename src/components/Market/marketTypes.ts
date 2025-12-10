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

export interface StockItem {
  id: string;
  symbol: string;
  company: string;
  price: number;
  dailyChange: number;
  yearlyChange: number;
  sector: string;
  risk: 'Low' | 'Medium' | 'Medium-High' | 'High';
  marketCap: number; // in billions (placeholder)
}

export interface HoldingItem {
  id: string;
  name: string;
  type: 'bond' | 'crypto' | 'stock';
  amount: number;
  estimatedValue: number;
  pl: number;
}
