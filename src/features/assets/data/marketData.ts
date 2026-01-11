import { StockItem } from '../../../components/Market/marketTypes';

export type Category = 'Technology' | 'Industrial' | 'Finance';

export const CATEGORIES: Category[] = ['Technology', 'Industrial', 'Finance'];

// Initial Market Data with 30 items
export const INITIAL_MARKET_ITEMS: StockItem[] = [
  // --- TECHNOLOGY (Buff: R_AND_D_SPEED) ---
  {
    id: 'tech_pear',
    symbol: 'PEAR',
    name: 'Pear Inc.',
    price: 150.00,
    change: 2.5,
    category: 'Technology',
    risk: 'Medium',
    description: 'Maker of expensive phones and fruits.',
    acquisitionCost: 500_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.15, label: 'R&D Speed +15%' },
    isAcquired: false
  },
  {
    id: 'tech_micro',
    symbol: 'MCRH',
    name: 'Microhard',
    price: 120.00,
    change: 1.2,
    category: 'Technology',
    risk: 'Low',
    description: 'Software that definitely isn\'t soft.',
    acquisitionCost: 400_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.10, label: 'R&D Speed +10%' },
    isAcquired: false
  },
  {
    id: 'tech_ogle',
    symbol: 'OGL',
    name: 'Oogle',
    price: 180.00,
    change: 0.8,
    category: 'Technology',
    risk: 'Medium',
    description: 'They know everything about you.',
    acquisitionCost: 600_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.12, label: 'R&D Speed +12%' },
    isAcquired: false
  },
  {
    id: 'tech_novi',
    symbol: 'NOVI',
    name: 'Novidia',
    price: 210.00,
    change: 4.5,
    category: 'Technology',
    risk: 'High',
    description: 'Powering the AI uprising.',
    acquisitionCost: 750_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.20, label: 'R&D Speed +20%' },
    isAcquired: false
  },
  {
    id: 'tech_social',
    symbol: 'FACE',
    name: 'FaceSpace',
    price: 95.00,
    change: -1.2,
    category: 'Technology',
    risk: 'Medium',
    description: 'Connect with people you ignore IRL.',
    acquisitionCost: 350_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.08, label: 'R&D Speed +8%' },
    isAcquired: false
  },
  {
    id: 'tech_net',
    symbol: 'FLIX',
    name: 'Streamflix',
    price: 45.00,
    change: 0.5,
    category: 'Technology',
    risk: 'Medium',
    description: 'Chill not included.',
    acquisitionCost: 200_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.05, label: 'R&D Speed +5%' },
    isAcquired: false
  },
  {
    id: 'tech_ai',
    symbol: 'GPT',
    name: 'ChatGPTee',
    price: 88.00,
    change: 5.0,
    category: 'Technology',
    risk: 'High',
    description: 'It writes better code than you.',
    acquisitionCost: 900_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.25, label: 'R&D Speed +25%' },
    isAcquired: false
  },
  {
    id: 'tech_bird',
    symbol: 'TWIT',
    name: 'T-Twitter',
    price: 33.00,
    change: -5.0,
    category: 'Technology',
    risk: 'High',
    description: 'Buying this was a mistake.',
    acquisitionCost: 44_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.02, label: 'R&D Speed +2%' },
    isAcquired: false
  },
  {
    id: 'tech_snap',
    symbol: 'SNAP',
    name: 'Snaptalk',
    price: 15.00,
    change: 1.0,
    category: 'Technology',
    risk: 'Medium',
    description: 'Gone in 10 seconds.',
    acquisitionCost: 80_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.04, label: 'R&D Speed +4%' },
    isAcquired: false
  },
  {
    id: 'tech_shop',
    symbol: 'AMZN',
    name: 'Ama-Zone',
    price: 145.00,
    change: 1.8,
    category: 'Technology',
    risk: 'Low',
    description: 'From A to Z, mostly cardboard.',
    acquisitionCost: 800_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.18, label: 'R&D Speed +18%' },
    isAcquired: false
  },

  // --- INDUSTRIAL (Buff: PRODUCTION_COST) ---
  {
    id: 'ind_edison',
    symbol: 'TSLA',
    name: 'Edison Motors',
    price: 250.00,
    change: 3.2,
    category: 'Industrial',
    risk: 'High',
    description: 'Electric cars with panel gaps.',
    acquisitionCost: 600_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.10, label: 'Prod. Cost -10%' },
    isAcquired: false
  },
  {
    id: 'ind_space',
    symbol: 'SPCY',
    name: 'SpaceY',
    price: 120.00,
    change: 6.0,
    category: 'Industrial',
    risk: 'High',
    description: 'Mars or bust.',
    acquisitionCost: 990_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.20, label: 'Prod. Cost -20%' },
    isAcquired: false
  },
  {
    id: 'ind_ge',
    symbol: 'GE',
    name: 'Generous Electric',
    price: 85.00,
    change: 0.5,
    category: 'Industrial',
    risk: 'Low',
    description: 'Making lightbulbs and jet engines.',
    acquisitionCost: 300_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.08, label: 'Prod. Cost -8%' },
    isAcquired: false
  },
  {
    id: 'ind_toy',
    symbol: 'TOY',
    name: 'Toyhonda',
    price: 45.00,
    change: 1.1,
    category: 'Industrial',
    risk: 'Low',
    description: 'Reliable but boring.',
    acquisitionCost: 250_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.05, label: 'Prod. Cost -5%' },
    isAcquired: false
  },
  {
    id: 'ind_ford',
    symbol: 'FORD',
    name: 'Fordnut',
    price: 30.00,
    change: -0.5,
    category: 'Industrial',
    risk: 'Medium',
    description: 'Built tough, breaks often.',
    acquisitionCost: 150_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.04, label: 'Prod. Cost -4%' },
    isAcquired: false
  },
  {
    id: 'ind_boeing',
    symbol: 'BOE',
    name: 'Boeing-Boeing',
    price: 200.00,
    change: -2.0,
    category: 'Industrial',
    risk: 'High',
    description: 'If it ain\'t Boeing, I ain\'t going.',
    acquisitionCost: 450_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.12, label: 'Prod. Cost -12%' },
    isAcquired: false
  },
  {
    id: 'ind_blue',
    symbol: 'BLUE',
    name: 'BlueOriginz',
    price: 90.00,
    change: 1.5,
    category: 'Industrial',
    risk: 'High',
    description: 'Second place in the space race.',
    acquisitionCost: 350_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.15, label: 'Prod. Cost -15%' },
    isAcquired: false
  },
  {
    id: 'ind_steel',
    symbol: 'STEE',
    name: 'SteelWorks',
    price: 60.00,
    change: 0.2,
    category: 'Industrial',
    risk: 'Low',
    description: 'Heavy metal.',
    acquisitionCost: 180_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.06, label: 'Prod. Cost -6%' },
    isAcquired: false
  },
  {
    id: 'ind_robo',
    symbol: 'ROBO',
    name: 'RoboCorp',
    price: 110.00,
    change: 3.0,
    category: 'Industrial',
    risk: 'Medium-High',
    description: 'The future is automated.',
    acquisitionCost: 550_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.10, label: 'Prod. Cost -10%' },
    isAcquired: false
  },
  {
    id: 'ind_solar',
    symbol: 'SUN',
    name: 'SolarCity',
    price: 40.00,
    change: 2.2,
    category: 'Industrial',
    risk: 'Medium',
    description: 'Praise the sun.',
    acquisitionCost: 120_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.03, label: 'Prod. Cost -3%' },
    isAcquired: false
  },

  // --- FINANCE (Buff: LOAN_INTEREST / MARKETING_BOOST) ---
  {
    id: 'fin_gs',
    symbol: 'GOLD',
    name: 'Goldman Sax',
    price: 320.00,
    change: 1.0,
    category: 'Finance',
    risk: 'Medium',
    description: 'The vampire squid.',
    acquisitionCost: 700_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.20, label: 'Loan Interest -20%' },
    isAcquired: false
  },
  {
    id: 'fin_jp',
    symbol: 'JPM',
    name: 'JP Morgan Free',
    price: 140.00,
    change: 0.9,
    category: 'Finance',
    risk: 'Low',
    description: 'Too big to fail.',
    acquisitionCost: 650_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.15, label: 'Loan Interest -15%' },
    isAcquired: false
  },
  {
    id: 'fin_visa',
    symbol: 'VISA',
    name: 'VisaCard',
    price: 210.00,
    change: 0.5,
    category: 'Finance',
    risk: 'Very Low',
    description: 'Everywhere you want to be.',
    acquisitionCost: 500_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.10, label: 'Marketing Eff. +10%' },
    isAcquired: false
  },
  {
    id: 'fin_master',
    symbol: 'MA',
    name: 'MasterPay',
    price: 350.00,
    change: 0.8,
    category: 'Finance',
    risk: 'Low',
    description: 'Priceless.',
    acquisitionCost: 550_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.12, label: 'Marketing Eff. +12%' },
    isAcquired: false
  },
  {
    id: 'fin_bam',
    symbol: 'BAC',
    name: 'Bank of Murica',
    price: 35.00,
    change: -0.2,
    category: 'Finance',
    risk: 'Low',
    description: 'Fees for everyone.',
    acquisitionCost: 200_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.05, label: 'Loan Interest -5%' },
    isAcquired: false
  },
  {
    id: 'fin_crypto',
    symbol: 'COIN',
    name: 'CryptoBase',
    price: 75.00,
    change: 8.0,
    category: 'Finance',
    risk: 'High',
    description: 'To the moon!',
    acquisitionCost: 300_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.20, label: 'Marketing Eff. +20%' },
    isAcquired: false
  },
  {
    id: 'fin_hedge',
    symbol: 'HDGE',
    name: 'HedgeFund X',
    price: 500.00,
    change: 2.5,
    category: 'Finance',
    risk: 'High',
    description: 'Shorting your dreams.',
    acquisitionCost: 400_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.10, label: 'Loan Interest -10%' },
    isAcquired: false
  },
  {
    id: 'fin_wsb',
    symbol: 'WSB',
    name: 'WallSt Bets',
    price: 4.20,
    change: 69.0,
    category: 'Finance',
    risk: 'High',
    description: 'We like the stock.',
    acquisitionCost: 420_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.50, label: 'Marketing Eff. +50%' },
    isAcquired: false
  },
  {
    id: 'fin_insure',
    symbol: 'SAFE',
    name: 'InsureAll',
    price: 110.00,
    change: 0.1,
    category: 'Finance',
    risk: 'Low',
    description: 'We got you covered... probably.',
    acquisitionCost: 250_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.08, label: 'Loan Interest -8%' },
    isAcquired: false
  },
  {
    id: 'fin_credit',
    symbol: 'CS',
    name: 'CreditSus',
    price: 2.00,
    change: -10.0,
    category: 'Finance',
    risk: 'High',
    description: 'Nothing suspicious here.',
    acquisitionCost: 100_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.25, label: 'Loan Interest -25% (Risky)' },
    isAcquired: false
  }
];

// Re-export specific category lists if needed by other components, or let them filter INITIAL_MARKET_ITEMS
// But to keep existing STOCKS object structure compatible (if possible), we can map them.
// HOWEVER, the user instruction was "Overwrite src/features/assets/data/marketData.ts" with specific content.
// The new content didn't explicitly ask for `STOCKS` object export, but the previous file had it.
// If I remove `STOCKS`, `useAssetsLogic.ts` will break (it iterates `Object.values(STOCKS)`).
// I should construct `STOCKS` from `INITIAL_MARKET_ITEMS` to prevent breakage.

export const STOCKS = {
  Technology: INITIAL_MARKET_ITEMS.filter(i => i.category === 'Technology'),
  Industrial: INITIAL_MARKET_ITEMS.filter(i => i.category === 'Industrial'),
  Finance: INITIAL_MARKET_ITEMS.filter(i => i.category === 'Finance'),
  // Mapping existing categories to safely avoid undefined limits or just mapping what we have
  // The previous file had Health, Energy, Consumer, Crypto, High Risk.
  // I should probably map the rest even if empty or fill them if I want to be nice, but user only asked for 3 sectors.
  // But to avoid `undefined` errors if code iterates keys:
  Health: [],
  Energy: [],
  Consumer: [],
  Crypto: [],
  'High Risk': []
  // Wait, some items might fall into these categories if I didn't verify strictly.
  // My new items use 'Technology', 'Industrial', 'Finance'.
  // So STOCKS.Health will be empty.
};