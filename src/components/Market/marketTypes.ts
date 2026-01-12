export type CategoryKey = 'bonds' | 'crypto' | 'stocks' | 'funds';

export type BondCategory = 'Government' | 'Corporate' | 'Municipal';
export type FundCategory = 'Index' | 'Sector' | 'Commodity';

export type RiskLevel = 'Very Low' | 'Low' | 'Medium' | 'Medium-High' | 'High' | 'Extreme';

export interface BondItem {
  id: string;
  name: string;
  faceValue: number;
  couponRate: number; // Annual interest rate (e.g. 0.05 for 5%)
  duration: number; // Years to maturity
  risk: RiskLevel;
  issuerType: BondCategory;
  creditRating: 'AAA' | 'AA' | 'A' | 'B' | 'CCC';
  maturityDate: number | string;
}

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  volatility: 'Low' | 'Medium' | 'High' | 'Extreme';
  marketCap: number; // Circulating Supply Value
  risk: RiskLevel;
  description?: string;
}

export interface FundItem {
  id: string;
  name: string;
  symbol?: string;
  price: number;
  change: number;
  expenseRatio: number; // e.g. 0.005 for 0.5%
  category: FundCategory;
  risk: RiskLevel;
  description?: string;
  topHoldings: string[];
}

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
  category: 'Technology' | 'Industrial' | 'Finance' | 'Health';
  risk: RiskLevel;
  description?: string;
  marketCap: number; // Company Valuation

  // ACQUISITION FIELDS
  acquisitionCost: number; // Cost to buy 100% ownership
  acquisitionBuff: AcquisitionBuff;
  isAcquired: boolean; // Default false
}

export type MarketItem = StockItem | BondItem | FundItem | CryptoAsset;

export interface HoldingItem {
  id: string;
  symbol: string;
  quantity: number;
  averageCost: number;
  type: 'stock' | 'crypto' | 'bond' | 'fund';
}
