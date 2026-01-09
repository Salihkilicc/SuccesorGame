// dosya: src/screens/Assets/Market/marketData.ts

export type Category =
  | 'Tech'
  | 'Health'
  | 'Finance'
  | 'Energy'
  | 'Consumer'
  | 'Crypto'
  | 'High Risk';

export type Stock = {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  meta?: string;
  riskTag?: string;
};

export const CATEGORIES: Category[] = [
  'Tech',
  'Health',
  'Finance',
  'Energy',
  'Consumer',
  'Crypto',
  'High Risk',
];

export const STOCKS: Record<Category, Stock[]> = {
  Tech: [
    {symbol: 'NVTA', name: 'NovaTech AI', price: 142.2, change: 2.1},
    {symbol: 'CLOUDX', name: 'CloudX Systems', price: 88.4, change: 1.2},
    {symbol: 'NEURO', name: 'NeuroLink Labs', price: 64, change: -0.4},
  ],
  Health: [
    {symbol: 'BIOGEN', name: 'Biogenica', price: 52.5, change: 0.9},
    {symbol: 'MEDIX', name: 'Medix Care', price: 33.2, change: 1.8},
    {symbol: 'VITAL', name: 'Vital Health', price: 41.7, change: -0.6},
  ],
  Finance: [
    {symbol: 'STABLE', name: 'Stable Bank', price: 71.3, change: 0.4},
    {symbol: 'CREDIT', name: 'Creditium', price: 55.1, change: -0.2},
    {symbol: 'DEFI', name: 'DeFi Core', price: 19.9, change: 3.5},
  ],
  Energy: [
    {symbol: 'SOLAR', name: 'SolarGrid', price: 24.5, change: 2.9},
    {symbol: 'FUEL', name: 'FuelCo', price: 31, change: -1.1},
    {symbol: 'WIND', name: 'Wind Prime', price: 18.3, change: 0.7},
  ],
  Consumer: [
    {symbol: 'SHOPX', name: 'ShopX Retail', price: 62, change: 1},
    {symbol: 'FOOD', name: 'FoodNation', price: 21.4, change: -0.3},
    {symbol: 'LEISUR', name: 'LeisureOne', price: 44.9, change: 0.5},
  ],
  Crypto: [
    {symbol: 'BTC', name: 'Bitcoin', price: 42100, change: 2.4, meta: 'Volatility: High'},
    {symbol: 'ETH', name: 'Ethereum', price: 2450, change: 1.7, meta: 'Volatility: High'},
    {symbol: 'SOL', name: 'Solana', price: 96, change: 4.2, meta: 'Volatility: High'},
  ],
  'High Risk': [
    {symbol: 'MOON', name: 'Moonshot Labs', price: 3.2, change: 12.1, riskTag: 'HIGH RISK'},
    {symbol: 'HYPE', name: 'HypeWorks', price: 1.05, change: -5.6, riskTag: 'HIGH RISK'},
    {symbol: 'GAMBLE', name: 'GambleX', price: 0.44, change: 7.8, riskTag: 'HIGH RISK'},
  ],
};