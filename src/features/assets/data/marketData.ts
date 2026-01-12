import { StockItem, BondItem, FundItem, CryptoAsset, MarketItem } from '../../../components/Market/marketTypes';

export type Category = 'Technology' | 'Industrial' | 'Finance' | 'Health';
export const CATEGORIES: Category[] = ['Technology', 'Industrial', 'Finance', 'Health'];

// --- STOCKS (Categorized) ---
export const INITIAL_STOCKS: StockItem[] = [
  // TECHNOLOGY (High Growth, High Risk)
  {
    id: 'tech_pear',
    symbol: 'PEAR',
    name: 'Pear Inc.',
    price: 185.50,
    change: 1.2,
    category: 'Technology',
    risk: 'Medium',
    description: 'Leader in premium fruit-themed electronics.',
    acquisitionCost: 3_300_000_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.15, label: 'R&D Speed +15%' },
    isAcquired: false,
    marketCap: 3_000_000_000_000
  },
  {
    id: 'tech_micro',
    symbol: 'MCRH',
    name: 'Microhard',
    price: 320.00,
    change: 0.8,
    category: 'Technology',
    risk: 'Low',
    description: 'Software giant that controls your PC.',
    acquisitionCost: 2_750_000_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.12, label: 'R&D Speed +12%' },
    isAcquired: false,
    marketCap: 2_500_000_000_000
  },
  {
    id: 'tech_start',
    symbol: 'STRT',
    name: 'StartApp IO',
    price: 5.20,
    change: 12.5,
    category: 'Technology',
    risk: 'High',
    description: 'Might disrupt everything, or disappear.',
    acquisitionCost: 55_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.20, label: 'R&D Speed +20%' },
    isAcquired: false,
    marketCap: 50_000_000
  },
  {
    id: 'tech_face',
    symbol: 'FACE',
    name: 'FaceSpace',
    price: 145.00,
    change: -2.0,
    category: 'Technology',
    risk: 'Medium',
    description: 'Social media monopoly.',
    acquisitionCost: 880_000_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.10, label: 'Marketing +10%' },
    isAcquired: false,
    marketCap: 800_000_000_000
  },
  {
    id: 'tech_gpt',
    symbol: 'AI',
    name: 'OpenAI-ish',
    price: 90.00,
    change: 5.0,
    category: 'Technology',
    risk: 'High',
    description: 'Artificial intelligence hype train.',
    acquisitionCost: 99_000_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.25, label: 'R&D Speed +25%' },
    isAcquired: false,
    marketCap: 90_000_000_000
  },
  {
    id: 'tech_chip',
    symbol: 'CHIP',
    name: 'Novidia',
    price: 450.00,
    change: 3.5,
    category: 'Technology',
    risk: 'Medium-High',
    description: 'Powering the matrix.',
    acquisitionCost: 1_320_000_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.18, label: 'R&D Speed +18%' },
    isAcquired: false,
    marketCap: 1_200_000_000_000
  },
  {
    id: 'tech_stream',
    symbol: 'FLIX',
    name: 'StreamFlix',
    price: 25.00,
    change: -1.0,
    category: 'Technology',
    risk: 'Medium',
    description: 'Watch shows all day.',
    acquisitionCost: 198_000_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.05, label: 'Marketing +5%' },
    isAcquired: false,
    marketCap: 180_000_000_000
  },

  // HEALTH (Defensive, Steady)
  {
    id: 'health_pfiz',
    symbol: 'PFE',
    name: 'Pfizero',
    price: 35.00,
    change: 0.2,
    category: 'Health',
    risk: 'Low',
    description: 'Big Pharma stability.',
    acquisitionCost: 220_000_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.05, label: 'Cost -5%' },
    isAcquired: false,
    marketCap: 200_000_000_000
  },
  {
    id: 'health_bio',
    symbol: 'BIO',
    name: 'BioGen Start',
    price: 2.15,
    change: 25.0,
    category: 'Health',
    risk: 'Extreme',
    description: 'Pending FDA approval... or bankruptcy.',
    acquisitionCost: 275_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.30, label: 'R&D Speed +30%' },
    isAcquired: false,
    marketCap: 250_000_000
  },
  {
    id: 'health_cure',
    symbol: 'CURE',
    name: 'CureAll Corp',
    price: 120.00,
    change: 1.5,
    category: 'Health',
    risk: 'Medium',
    description: 'Curing diseases for profit.',
    acquisitionCost: 82_500_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.10, label: 'Cost -10%' },
    isAcquired: false,
    marketCap: 75_000_000_000
  },
  {
    id: 'health_insure',
    symbol: 'UNH',
    name: 'UnitedHealth',
    price: 480.00,
    change: 0.5,
    category: 'Health',
    risk: 'Low',
    description: 'Insurance always wins.',
    acquisitionCost: 495_000_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.10, label: 'Loan Rate -10%' },
    isAcquired: false,
    marketCap: 450_000_000_000
  },
  {
    id: 'health_med',
    symbol: 'MED',
    name: 'MediDevice',
    price: 85.00,
    change: 1.1,
    category: 'Health',
    risk: 'Medium',
    description: 'Robots doing surgery.',
    acquisitionCost: 66_000_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.08, label: 'Cost -8%' },
    isAcquired: false,
    marketCap: 60_000_000_000
  },

  // INDUSTRIAL (Cyclical, Production)
  {
    id: 'ind_edison',
    symbol: 'TSLA',
    name: 'Edison Motors',
    price: 250.00,
    change: 4.2,
    category: 'Industrial',
    risk: 'High',
    description: 'Electric cars and memes.',
    acquisitionCost: 880_000_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.15, label: 'Cost -15%' },
    isAcquired: false,
    marketCap: 800_000_000_000
  },
  {
    id: 'ind_rust',
    symbol: 'STEEL',
    name: 'RustBelt Steel',
    price: 12.00,
    change: -0.5,
    category: 'Industrial',
    risk: 'Medium',
    description: 'Old school heavy metal.',
    acquisitionCost: 16_500_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.12, label: 'Cost -12%' },
    isAcquired: false,
    marketCap: 15_000_000_000
  },
  {
    id: 'ind_mine',
    symbol: 'LUCK',
    name: 'Lucky Mining',
    price: 0.85,
    change: 15.0,
    category: 'Industrial',
    risk: 'Extreme',
    description: 'Might find gold, might find dirt.',
    acquisitionCost: 88_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.20, label: 'Cost -20% (Risky)' },
    isAcquired: false,
    marketCap: 80_000_000
  },
  {
    id: 'ind_gm',
    symbol: 'GMP',
    name: 'General Motors Parody',
    price: 45.20,
    change: 0.9,
    category: 'Industrial',
    risk: 'Medium',
    description: 'Reliable, boring trucks.',
    acquisitionCost: 66_000_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.08, label: 'Cost -8%' },
    isAcquired: false,
    marketCap: 60_000_000_000
  },
  {
    id: 'ind_space',
    symbol: 'SPCY',
    name: 'SpaceY',
    price: 120.00,
    change: 8.0,
    category: 'Industrial',
    risk: 'High',
    description: 'To Mars!',
    acquisitionCost: 165_000_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.18, label: 'R&D Speed +18%' },
    isAcquired: false,
    marketCap: 150_000_000_000
  },
  {
    id: 'ind_air',
    symbol: 'FLY',
    name: 'Airbus-ish',
    price: 30.00,
    change: 1.2,
    category: 'Industrial',
    risk: 'Medium',
    description: 'Planes mostly stay in the air.',
    acquisitionCost: 99_000_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.10, label: 'Cost -10%' },
    isAcquired: false,
    marketCap: 90_000_000_000
  },

  // FINANCE (Monetary, Loans)
  {
    id: 'fin_gs',
    symbol: 'GOLD',
    name: 'Goldman Sax',
    price: 380.00,
    change: 1.5,
    category: 'Finance',
    risk: 'Medium',
    description: 'They run the world.',
    acquisitionCost: 132_000_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.20, label: 'Loan Rate -20%' },
    isAcquired: false,
    marketCap: 120_000_000_000
  },
  {
    id: 'fin_visa',
    symbol: 'VISA',
    name: 'VisaCard',
    price: 210.00,
    change: 0.5,
    category: 'Finance',
    risk: 'Low',
    description: 'Payments everywhere.',
    acquisitionCost: 495_000_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.15, label: 'Marketing +15%' },
    isAcquired: false,
    marketCap: 450_000_000_000
  },
  {
    id: 'fin_coin',
    symbol: 'BANK',
    name: 'CoinBank',
    price: 1.50,
    change: -5.0,
    category: 'Finance',
    risk: 'High',
    description: 'Crypto-friendly bank (sketchy).',
    acquisitionCost: 220_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.30, label: 'Loan Rate -30% (Risky)' },
    isAcquired: false,
    marketCap: 200_000_000
  },
  {
    id: 'fin_jpm',
    symbol: 'JPM',
    name: 'JP Morgan Free',
    price: 155.00,
    change: 0.8,
    category: 'Finance',
    risk: 'Low',
    description: 'Too big to fail.',
    acquisitionCost: 418_000_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.15, label: 'Loan Rate -15%' },
    isAcquired: false,
    marketCap: 380_000_000_000
  },
  {
    id: 'fin_shark',
    symbol: 'SHARK',
    name: 'LoanShark Inc.',
    price: 10.00,
    change: 2.0,
    category: 'Finance',
    risk: 'High',
    description: 'Predatory lending at its finest.',
    acquisitionCost: 99_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.25, label: 'Loan Rate -25%' },
    isAcquired: false,
    marketCap: 90_000_000
  },

  // --- NEW ADDITIONS (Tech) ---
  {
    id: 'tech_chat',
    symbol: 'CHAT',
    name: 'ChatAI Corp',
    price: 110.00,
    change: 8.5,
    category: 'Technology',
    risk: 'High',
    description: 'Predicts what you want to say.',
    acquisitionCost: 88_000_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.20, label: 'R&D Speed +20%' },
    isAcquired: false,
    marketCap: 80_000_000_000
  },
  {
    id: 'tech_sales',
    symbol: 'CRM',
    name: 'SalesForceX',
    price: 210.00,
    change: 1.2,
    category: 'Technology',
    risk: 'Low',
    description: 'Cloud CRM for everyone.',
    acquisitionCost: 220_000_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.15, label: 'Marketing +15%' },
    isAcquired: false,
    marketCap: 200_000_000_000
  },
  {
    id: 'tech_intel',
    symbol: 'INTC',
    name: 'Intell Inside',
    price: 30.00,
    change: -2.5,
    category: 'Technology',
    risk: 'Medium',
    description: 'Old chip giant trying to survive.',
    acquisitionCost: 132_000_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.10, label: 'R&D Speed +10%' },
    isAcquired: false,
    marketCap: 120_000_000_000
  },
  {
    id: 'tech_adobe',
    symbol: 'ADBE',
    name: 'AdobeFake',
    price: 450.00,
    change: 2.1,
    category: 'Technology',
    risk: 'Low',
    description: 'Creative software monopoly.',
    acquisitionCost: 242_000_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.12, label: 'Marketing +12%' },
    isAcquired: false,
    marketCap: 220_000_000_000
  },
  {
    id: 'tech_spot',
    symbol: 'SPOT',
    name: 'SpotifyStream',
    price: 180.00,
    change: 3.5,
    category: 'Technology',
    risk: 'Medium',
    description: 'Music for your ears.',
    acquisitionCost: 38_500_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.08, label: 'Marketing +8%' },
    isAcquired: false,
    marketCap: 35_000_000_000
  },

  // --- NEW ADDITIONS (Health) ---
  {
    id: 'health_jnj',
    symbol: 'JNJ',
    name: 'Johnson & Swanson',
    price: 160.00,
    change: 0.5,
    category: 'Health',
    risk: 'Low',
    description: 'Baby powder and vaccines.',
    acquisitionCost: 440_000_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.10, label: 'Cost -10%' },
    isAcquired: false,
    marketCap: 400_000_000_000
  },
  {
    id: 'health_care',
    symbol: 'CARE',
    name: 'MediCare Plus',
    price: 480.00,
    change: 1.1,
    category: 'Health',
    risk: 'Low',
    description: 'Massive health conglomerate.',
    acquisitionCost: 495_000_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.12, label: 'Loan Rate -12%' },
    isAcquired: false,
    marketCap: 450_000_000_000
  },
  {
    id: 'health_vax',
    symbol: 'VAX',
    name: 'VaxScene',
    price: 90.00,
    change: 5.5,
    category: 'Health',
    risk: 'High',
    description: 'mRNA revolutionary.',
    acquisitionCost: 33_000_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.18, label: 'R&D Speed +18%' },
    isAcquired: false,
    marketCap: 30_000_000_000
  },
  {
    id: 'health_pyramid',
    symbol: 'HLF',
    name: 'HerbalLife Scam',
    price: 12.00,
    change: -8.0,
    category: 'Health',
    risk: 'Extreme',
    description: 'Is it a shake or a cult?',
    acquisitionCost: 1_100_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.25, label: 'Marketing +25% (Risky)' },
    isAcquired: false,
    marketCap: 1_000_000_000
  },
  {
    id: 'health_fix',
    symbol: 'ALGN',
    name: 'DentalFix',
    price: 250.00,
    change: 2.5,
    category: 'Health',
    risk: 'Medium',
    description: 'Straight teeth, high prices.',
    acquisitionCost: 22_000_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.05, label: 'Cost -5%' },
    isAcquired: false,
    marketCap: 20_000_000_000
  },

  // --- NEW ADDITIONS (Industrial) ---
  {
    id: 'ind_spce',
    symbol: 'SPCE',
    name: 'SpaceZ',
    price: 15.00,
    change: 12.0,
    category: 'Industrial',
    risk: 'High',
    description: 'Tourism in orbit.',
    acquisitionCost: 8_800_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.20, label: 'R&D Speed +20%' },
    isAcquired: false,
    marketCap: 8_000_000_000
  },
  {
    id: 'ind_lmt',
    symbol: 'LMT',
    name: 'Lockheed Marvin',
    price: 420.00,
    change: 0.8,
    category: 'Industrial',
    risk: 'Low',
    description: 'Defense contractor.',
    acquisitionCost: 110_000_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.08, label: 'Cost -8%' },
    isAcquired: false,
    marketCap: 100_000_000_000
  },
  {
    id: 'ind_cat',
    symbol: 'CAT',
    name: 'Catarpillar',
    price: 280.00,
    change: 1.5,
    category: 'Industrial',
    risk: 'Medium',
    description: 'Big yellow machines.',
    acquisitionCost: 154_000_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.10, label: 'Cost -10%' },
    isAcquired: false,
    marketCap: 140_000_000_000
  },
  {
    id: 'ind_shell',
    symbol: 'SHEL',
    name: 'ShellOil',
    price: 65.00,
    change: 0.5,
    category: 'Industrial',
    risk: 'Low',
    description: 'Fossil fuels forever?',
    acquisitionCost: 220_000_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.15, label: 'Cost -15%' },
    isAcquired: false,
    marketCap: 200_000_000_000
  },
  {
    id: 'ind_solar',
    symbol: 'RUN',
    name: 'SolarCity 2.0',
    price: 18.00,
    change: 4.5,
    category: 'Industrial',
    risk: 'High',
    description: 'Sun power for everyone.',
    acquisitionCost: 4_400_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.07, label: 'Cost -7%' },
    isAcquired: false,
    marketCap: 4_000_000_000
  },

  // --- NEW ADDITIONS (Finance) ---
  {
    id: 'fin_axp',
    symbol: 'AXP',
    name: 'American Excess',
    price: 190.00,
    change: 1.0,
    category: 'Finance',
    risk: 'Medium',
    description: 'Don\'t leave home without it.',
    acquisitionCost: 143_000_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.10, label: 'Loan Rate -10%' },
    isAcquired: false,
    marketCap: 130_000_000_000
  },
  {
    id: 'fin_brk',
    symbol: 'BRK',
    name: 'Berkshire Hat',
    price: 550000.00,
    change: 0.1,
    category: 'Finance',
    risk: 'Low',
    description: 'The Oracle\'s playground.',
    acquisitionCost: 880_000_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.20, label: 'Loan Rate -20%' },
    isAcquired: false,
    marketCap: 800_000_000_000
  },
  {
    id: 'fin_sq',
    symbol: 'SQ',
    name: 'BlockPay',
    price: 70.00,
    change: 3.2,
    category: 'Finance',
    risk: 'Medium',
    description: 'Payments for the people.',
    acquisitionCost: 44_000_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.10, label: 'Marketing +10%' },
    isAcquired: false,
    marketCap: 40_000_000_000
  },
  {
    id: 'fin_hood',
    symbol: 'HOOD',
    name: 'RobbingHood',
    price: 18.00,
    change: -2.0,
    category: 'Finance',
    risk: 'High',
    description: 'Gamified trading.',
    acquisitionCost: 16_500_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.20, label: 'Marketing +20%' },
    isAcquired: false,
    marketCap: 15_000_000_000
  },
  {
    id: 'fin_ma',
    symbol: 'MA',
    name: 'MasterCharge',
    price: 400.00,
    change: 0.9,
    category: 'Finance',
    risk: 'Low',
    description: 'Plastic money.',
    acquisitionCost: 418_000_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.15, label: 'Loan Rate -15%' },
    isAcquired: false,
    marketCap: 380_000_000_000
  }
];

export const STOCKS = {
  Technology: INITIAL_STOCKS.filter(i => i.category === 'Technology'),
  Industrial: INITIAL_STOCKS.filter(i => i.category === 'Industrial'),
  Finance: INITIAL_STOCKS.filter(i => i.category === 'Finance'),
  Health: INITIAL_STOCKS.filter(i => i.category === 'Health'),
};

// --- CRYPTO (Weighted by Price) ---
export const INITIAL_CRYPTO: CryptoAsset[] = [
  {
    id: 'crypto_btc',
    symbol: 'BTC',
    name: 'BitCash',
    price: 64200.00,
    change: 5.5,
    volatility: 'Medium',
    risk: 'High',
    description: 'Digital Gold.',
    marketCap: 1_200_000_000_000
  },
  {
    id: 'crypto_eth',
    symbol: 'ETH',
    name: 'Etherium',
    price: 3400.00,
    change: 3.2,
    volatility: 'High',
    risk: 'High',
    description: 'Smart contracts platform.',
    marketCap: 400_000_000_000
  },
  {
    id: 'crypto_sol',
    symbol: 'SOL',
    name: 'SolanaX',
    price: 145.00,
    change: 8.5,
    volatility: 'High',
    risk: 'High',
    description: 'Fast, cheap, occasionally offline.',
    marketCap: 65_000_000_000
  },
  {
    id: 'crypto_doge',
    symbol: 'DOGE',
    name: 'DogeMeme',
    price: 0.12,
    change: 15.0,
    volatility: 'Extreme',
    risk: 'Extreme',
    description: 'Much wow, such variance.',
    marketCap: 18_000_000_000
  },
  {
    id: 'crypto_pepe',
    symbol: 'PEPE',
    name: 'PepeFake',
    price: 0.0004,
    change: -25.0,
    volatility: 'Extreme',
    risk: 'Extreme',
    description: 'Feels bad man.',
    marketCap: 1_500_000_000
  },
  // --- NEW CRYPTO ---
  {
    id: 'crypto_bnb',
    symbol: 'BNB',
    name: 'BinanceCoinZ',
    price: 600.00,
    change: 2.5,
    volatility: 'Medium',
    risk: 'Medium',
    description: 'Exchange Utility Token.',
    marketCap: 90_000_000_000
  },
  {
    id: 'crypto_ada',
    symbol: 'ADA',
    name: 'CardanoAda',
    price: 0.45,
    change: 1.2,
    volatility: 'Medium',
    risk: 'Medium',
    description: 'Peer reviewed blockchain.',
    marketCap: 15_000_000_000
  },
  {
    id: 'crypto_dot',
    symbol: 'DOT',
    name: 'PolkaDot',
    price: 7.00,
    change: -1.5,
    volatility: 'High',
    risk: 'High',
    description: 'Interoperability chain.',
    marketCap: 9_000_000_000
  },
  {
    id: 'crypto_link',
    symbol: 'LINK',
    name: 'ChainLinker',
    price: 18.00,
    change: 4.2,
    volatility: 'High',
    risk: 'Medium',
    description: 'Oracle network.',
    marketCap: 10_000_000_000
  },
  {
    id: 'crypto_shib',
    symbol: 'SHIB',
    name: 'ShibaInuFake',
    price: 0.00002,
    change: 12.0,
    volatility: 'Extreme',
    risk: 'Extreme',
    description: 'Doge killer?',
    marketCap: 12_000_000_000
  },
  {
    id: 'crypto_ltc',
    symbol: 'LTC',
    name: 'LiteCoinClassic',
    price: 85.00,
    change: 0.5,
    volatility: 'Medium',
    risk: 'Medium',
    description: 'Silver to Bitcoin\'s Gold.',
    marketCap: 6_000_000_000
  },
  {
    id: 'crypto_xmr',
    symbol: 'XMR',
    name: 'MoneroX',
    price: 150.00,
    change: -2.0,
    volatility: 'High',
    risk: 'High',
    description: 'Private and untraceable.',
    marketCap: 2_500_000_000
  },
  {
    id: 'crypto_matic',
    symbol: 'MATIC',
    name: 'PolygonMat',
    price: 0.90,
    change: 3.0,
    volatility: 'High',
    risk: 'Medium-High',
    description: 'Ethereum sidechain.',
    marketCap: 8_000_000_000
  },
  {
    id: 'crypto_sfm',
    symbol: 'SFM',
    name: 'SafeMoonScam',
    price: 0.000001,
    change: -50.0,
    volatility: 'Extreme',
    risk: 'Extreme',
    description: 'Safely to the moon... or zero.',
    marketCap: 200_000_000
  },
  {
    id: 'crypto_ape',
    symbol: 'APE',
    name: 'NFT Art Coin',
    price: 1.50,
    change: 15.0,
    volatility: 'Extreme',
    risk: 'High',
    description: 'For the jpeg collectors.',
    marketCap: 500_000_000
  }
];

// --- FUNDS ---
// --- FUNDS ---
export const INITIAL_FUNDS: FundItem[] = [
  {
    id: 'fund_spy',
    symbol: 'SPY',
    name: 'S&P 500 ETF',
    price: 450.00,
    change: 0.5,
    expenseRatio: 0.0003, // 0.03%
    category: 'Index',
    risk: 'Low',
    description: 'Market average return.',
    topHoldings: ['Pear Inc', 'Microhard', 'SalesForceX']
  },
  {
    id: 'fund_qqq',
    symbol: 'QQQ',
    name: 'Global Tech ETF',
    price: 380.00,
    change: 1.2,
    expenseRatio: 0.006, // 0.6%
    category: 'Sector',
    risk: 'Medium',
    description: 'Heavy tech exposure.',
    topHoldings: ['Novidia', 'ChatAI', 'FaceSpace']
  },
  {
    id: 'fund_icln',
    symbol: 'ICLN',
    name: 'Green Energy Fund',
    price: 25.00,
    change: 2.1,
    expenseRatio: 0.008, // 0.8%
    category: 'Sector',
    risk: 'High',
    description: 'Solar, wind, and hope.',
    topHoldings: ['SolarCity', 'Edison Motors', 'WindFarm Corp']
  },
  {
    id: 'fund_gld',
    symbol: 'GLD',
    name: 'Gold Bullion Trust',
    price: 185.00,
    change: 0.1,
    expenseRatio: 0.004, // 0.4%
    category: 'Commodity',
    risk: 'Low',
    description: 'Hedge against inflation.',
    topHoldings: ['Physical Gold Bars']
  },
  {
    id: 'fund_vym',
    symbol: 'VYM',
    name: 'High Dividend ETF',
    price: 110.00,
    change: 0.3,
    expenseRatio: 0.005, // 0.5%
    category: 'Index',
    risk: 'Low',
    description: 'Steady income generators.',
    topHoldings: ['Johnson & Swanson', 'CocaColaFake', 'ShellOil']
  }
];

// --- BONDS ---
export const INITIAL_BONDS: BondItem[] = [
  {
    id: 'bond_us10y',
    name: 'US Treasury 10Y',
    faceValue: 1000,
    couponRate: 0.042, // 4.2%
    duration: 10,
    risk: 'Very Low',
    issuerType: 'Government',
    creditRating: 'AAA',
    maturityDate: '2035-01-01'
  },
  {
    id: 'bond_muni',
    name: 'Municipal Bond',
    faceValue: 100,
    couponRate: 0.035, // 3.5%
    duration: 7,
    risk: 'Low',
    issuerType: 'Municipal',
    creditRating: 'AA',
    maturityDate: '2032-06-15'
  },
  {
    id: 'bond_corp_a',
    name: 'MegaCorp Blue Chip Bond',
    faceValue: 1000,
    couponRate: 0.055, // 5.5%
    duration: 5,
    risk: 'Low',
    issuerType: 'Corporate',
    creditRating: 'A',
    maturityDate: '2030-12-31'
  },
  {
    id: 'bond_startup',
    name: 'Tech Startup Convertible',
    faceValue: 500,
    couponRate: 0.08, // 8.0%
    duration: 3,
    risk: 'High',
    issuerType: 'Corporate',
    creditRating: 'B',
    maturityDate: '2028-01-01'
  },
  {
    id: 'bond_junk',
    name: 'Junk Bond High Yield',
    faceValue: 100,
    couponRate: 0.12, // 12.0%
    duration: 5,
    risk: 'Extreme',
    issuerType: 'Corporate',
    creditRating: 'CCC',
    maturityDate: '2030-01-01'
  }
];

export const INITIAL_MARKET_ITEMS: MarketItem[] = [
  ...INITIAL_STOCKS,
  ...INITIAL_CRYPTO,
  ...INITIAL_FUNDS,
  ...INITIAL_BONDS
];