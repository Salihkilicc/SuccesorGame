// src/features/assets/data/marketData.ts
//
// ============================================================================
//  WHAT IS TRANSLATED HERE AND WHAT IS DELIBERATELY NOT
// ============================================================================
//
//  DESCRIPTIONS ARE. Sixty seven of them, every one a sentence a player reads
//  on the market list and the detail screen, and every one of them English
//  until now. They reached the screen through a variable from a .ts file,
//  which is the shape `scripts/untranslated.js` cannot see, so the sweep said
//  "nothing on a reachable screen" while the market was entirely in English.
//
//  COMPANY AND COIN NAMES ARE NOT. `Pear Inc.` is `Pear Inc.` in Turkish, the
//  same way a real company is. Translating a proper noun is not translation,
//  it is renaming, and it would also mean two different players discussing the
//  same stock under two different names.
//
//  THE FIVE INSTRUMENTS ARE. `Gold Bullion Trust` is not anybody's name, it is
//  a description of what the thing holds, and a Turkish player reads it as one.
//
//  A GETTER RATHER THAN A VALUE: a value is read once at module load, in
//  whatever language was active then, and does not follow the player when they
//  change language in Settings.
//
//  See marketText.test.ts for the rule, and noRealTickers.test.ts for the
//  separate question of whose names these were allowed to be.
// ============================================================================

import { t } from '../../../core/i18n';
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
    price: 30000.0,
    change: 1.2,
    category: 'Technology',
    risk: 'Medium',
    get description() { return t('mkt.tech_pear.desc'); },
    acquisitionCost: 3_000_000_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.15, label: 'R&D Speed +15%' },
    isAcquired: false,
    marketCap: 3_000_000_000_000
  },
  {
    id: 'tech_micro',
    symbol: 'GSFT',
    name: 'Gigasoft',
    price: 9500.0,
    change: 0.8,
    category: 'Technology',
    risk: 'Low',
    get description() { return t('mkt.tech_micro.desc'); },
    acquisitionCost: 950_000_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.12, label: 'R&D Speed +12%' },
    isAcquired: false,
    marketCap: 950_000_000_000
  },
  {
    id: 'tech_start',
    symbol: 'LPAD',
    name: 'Launchpad IO',
    price: 0.5,
    change: 12.5,
    category: 'Technology',
    risk: 'High',
    get description() { return t('mkt.tech_start.desc'); },
    acquisitionCost: 10_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.20, label: 'R&D Speed +20%' },
    isAcquired: false,
    marketCap: 10_000_000
  },
  {
    id: 'tech_face',
    symbol: 'CRCL',
    name: 'Circles',
    price: 960.0,
    change: -2.0,
    category: 'Technology',
    risk: 'Medium',
    get description() { return t('mkt.tech_face.desc'); },
    acquisitionCost: 96_000_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.10, label: 'Marketing +10%' },
    isAcquired: false,
    marketCap: 96_000_000_000
  },
  {
    id: 'tech_gpt',
    symbol: 'COGN',
    name: 'Cognita Labs',
    price: 3.1,
    change: 5.0,
    category: 'Technology',
    risk: 'High',
    get description() { return t('mkt.tech_gpt.desc'); },
    acquisitionCost: 310_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.25, label: 'R&D Speed +25%' },
    isAcquired: false,
    marketCap: 310_000_000
  },
  {
    id: 'tech_chip',
    symbol: 'LMCH',
    name: 'Lumenchip',
    price: 3000.0,
    change: 3.5,
    category: 'Technology',
    risk: 'Medium-High',
    get description() { return t('mkt.tech_chip.desc'); },
    acquisitionCost: 300_000_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.18, label: 'R&D Speed +18%' },
    isAcquired: false,
    marketCap: 300_000_000_000
  },
  {
    id: 'tech_stream',
    symbol: 'BNGE',
    name: 'Binge Network',
    price: 31.0,
    change: -1.0,
    category: 'Technology',
    risk: 'Medium',
    get description() { return t('mkt.tech_stream.desc'); },
    acquisitionCost: 3_100_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.05, label: 'Marketing +5%' },
    isAcquired: false,
    marketCap: 3_100_000_000
  },

  // ==========================================================================
  //  THE THREE WITH NAMES ON THE DOOR
  // ==========================================================================
  //  These existed in data/AcquisitionData.ts, a file whose DATA is imported
  //  by nothing - only its type is. The acquisition screen has always listed
  //  INITIAL_MARKET_ITEMS, so SkyNet, VoltMotors and Earworm have never
  //  been buyable in a shipped build. They were three companies written down
  //  and then never wired to anything.
  //
  //  Each comes with a real person who takes a board seat - see
  //  data/market/founders.ts. That is what makes them worth listing
  //  separately rather than being three more rows: buying one of these is a
  //  decision about who you will be arguing with for the rest of the game.
  //
  //  SIZED TO THE GAME, NOT TO THE OLD FILE. AcquisitionData priced them at
  //  $2.5B / $40B / $120B, which is unreachable for most of a campaign. They
  //  are placed here at three different rungs so that one is an early
  //  temptation, one a mid-game decision and one a late statement.
  // ==========================================================================
  {
    id: 'tech_streamify',
    symbol: 'EARW',
    name: 'Earworm',
    price: 62.0,
    change: 2.4,
    category: 'Technology',
    // Profitable but thin-margined, and he sold at the top. The risk rating
    // no longer picks his temperament - the founder file does - but it still
    // decides the earnings the deal model pays you.
    risk: 'Medium',
    get description() { return t('mkt.tech_streamify.desc'); },
    acquisitionCost: 1_240_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.10, label: 'Marketing +10%' },
    isAcquired: false,
    marketCap: 1_240_000_000,
  },
  {
    id: 'ind_voltmotors',
    symbol: 'VLTM',
    name: 'VoltMotors',
    price: 175.0,
    change: 0.6,
    category: 'Industrial',
    // Dull and reliable, which is the whole character. Low risk here means a
    // high, steady earnings yield in mergers.ts - this is the one that pays
    // for itself.
    risk: 'Low',
    get description() { return t('mkt.ind_voltmotors.desc'); },
    acquisitionCost: 9_800_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.08, label: 'Cost -8%' },
    isAcquired: false,
    marketCap: 9_800_000_000,
  },
  {
    id: 'tech_skynet',
    symbol: 'SENT',
    name: 'Sentinel AI',
    price: 1_250.0,
    change: 11.5,
    category: 'Technology',
    // Extreme, and it means something now: mergers.ts gives a burning
    // company little or no EBIT, so synergy is near zero and the goodwill
    // impairs on schedule unless it grows into the price. Buying this is
    // buying a belief.
    risk: 'Extreme',
    get description() { return t('mkt.tech_skynet.desc'); },
    acquisitionCost: 44_000_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.30, label: 'R&D Speed +30%' },
    isAcquired: false,
    marketCap: 44_000_000_000,
  },

  // ==========================================================================
  //  PLANORA — the friend's company
  // ==========================================================================
  //  Listed because a story reward has to be a real one. "He will sell it to
  //  you cheap" is worth nothing if the acquisition screen has never heard of
  //  the company, and the player would rightly read the offer as flavour.
  //
  //  Small, unprofitable and growing fast: the shape of a company run by
  //  somebody who is good at the product and learning the rest in public. It
  //  is buyable by anybody at the listed price - the friendship only changes
  //  what it costs, through the anchor. See the `reprice` effect.
  // ==========================================================================
  {
    id: 'tech_planora',
    symbol: 'PLNR',
    name: 'Planora',
    price: 46.0,
    change: 4.1,
    category: 'Technology',
    risk: 'High',
    get description() { return t('mkt.tech_planora.desc'); },
    acquisitionCost: 640_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.10, label: 'R&D Speed +10%' },
    isAcquired: false,
    marketCap: 640_000_000,
  },

  // HEALTH (Defensive, Steady)
  {
    id: 'health_pfiz',
    symbol: 'ZNRX',
    name: 'Zenorex Pharma',
    price: 140.0,
    change: 0.2,
    category: 'Health',
    risk: 'Low',
    get description() { return t('mkt.health_pfiz.desc'); },
    acquisitionCost: 14_000_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.05, label: 'Cost -5%' },
    isAcquired: false,
    marketCap: 14_000_000_000
  },
  {
    id: 'health_bio',
    symbol: 'HLXB',
    name: 'Helix Bio',
    price: 0.5,
    change: 25.0,
    category: 'Health',
    risk: 'Extreme',
    get description() { return t('mkt.health_bio.desc'); },
    acquisitionCost: 10_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.30, label: 'R&D Speed +30%' },
    isAcquired: false,
    marketCap: 10_000_000
  },
  {
    id: 'health_cure',
    symbol: 'CRAL',
    name: 'CureAll Corp',
    price: 43.0,
    change: 1.5,
    category: 'Health',
    risk: 'Medium',
    get description() { return t('mkt.health_cure.desc'); },
    acquisitionCost: 4_300_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.10, label: 'Cost -10%' },
    isAcquired: false,
    marketCap: 4_300_000_000
  },
  {
    id: 'health_insure',
    symbol: 'MRDH',
    name: 'Meridian Health',
    price: 5500.0,
    change: 0.5,
    category: 'Health',
    risk: 'Low',
    get description() { return t('mkt.health_insure.desc'); },
    acquisitionCost: 550_000_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.10, label: 'Loan Rate -10%' },
    isAcquired: false,
    marketCap: 550_000_000_000
  },
  {
    id: 'health_med',
    symbol: 'MDEV',
    name: 'MediDevice',
    price: 13.0,
    change: 1.1,
    category: 'Health',
    risk: 'Medium',
    get description() { return t('mkt.health_med.desc'); },
    acquisitionCost: 1_300_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.08, label: 'Cost -8%' },
    isAcquired: false,
    marketCap: 1_300_000_000
  },

  // INDUSTRIAL (Cyclical, Production)
  {
    id: 'ind_edison',
    symbol: 'DYNM',
    name: 'Dynamo Motors',
    price: 6500.0,
    change: 4.2,
    category: 'Industrial',
    risk: 'High',
    get description() { return t('mkt.ind_edison.desc'); },
    acquisitionCost: 650_000_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.15, label: 'Cost -15%' },
    isAcquired: false,
    marketCap: 650_000_000_000
  },
  {
    id: 'ind_rust',
    symbol: 'RSTL',
    name: 'RustBelt Steel',
    price: 2.8,
    change: -0.5,
    category: 'Industrial',
    risk: 'Medium',
    get description() { return t('mkt.ind_rust.desc'); },
    acquisitionCost: 280_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.12, label: 'Cost -12%' },
    isAcquired: false,
    marketCap: 280_000_000
  },
  {
    id: 'ind_mine',
    symbol: 'LCKM',
    name: 'Lucky Mining',
    price: 0.5,
    change: 15.0,
    category: 'Industrial',
    risk: 'Extreme',
    get description() { return t('mkt.ind_mine.desc'); },
    acquisitionCost: 10_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.20, label: 'Cost -20% (Risky)' },
    isAcquired: false,
    marketCap: 10_000_000
  },
  {
    id: 'ind_gm',
    symbol: 'CNTM',
    name: 'Continental Motorworks',
    price: 8.4,
    change: 0.9,
    category: 'Industrial',
    risk: 'Medium',
    get description() { return t('mkt.ind_gm.desc'); },
    acquisitionCost: 840_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.08, label: 'Cost -8%' },
    isAcquired: false,
    marketCap: 840_000_000
  },
  {
    id: 'ind_space',
    symbol: 'ORBD',
    name: 'Orbital Dawn',
    price: 710.0,
    change: 8.0,
    category: 'Industrial',
    risk: 'High',
    get description() { return t('mkt.ind_space.desc'); },
    acquisitionCost: 71_000_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.18, label: 'R&D Speed +18%' },
    isAcquired: false,
    marketCap: 71_000_000_000
  },
  {
    id: 'ind_air',
    symbol: 'SKBS',
    name: 'Skybus Consortium',
    price: 25.0,
    change: 1.2,
    category: 'Industrial',
    risk: 'Medium',
    get description() { return t('mkt.ind_air.desc'); },
    acquisitionCost: 2_500_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.10, label: 'Cost -10%' },
    isAcquired: false,
    marketCap: 2_500_000_000
  },

  // FINANCE (Monetary, Loans)
  {
    id: 'fin_gs',
    symbol: 'STMK',
    name: 'Sterling Marks',
    price: 14.0,
    change: 1.5,
    category: 'Finance',
    risk: 'Medium',
    get description() { return t('mkt.fin_gs.desc'); },
    acquisitionCost: 1_400_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.20, label: 'Loan Rate -20%' },
    isAcquired: false,
    marketCap: 1_400_000_000
  },
  {
    id: 'fin_visa',
    symbol: 'PSPT',
    name: 'Passport Payments',
    price: 2000.0,
    change: 0.5,
    category: 'Finance',
    risk: 'Low',
    get description() { return t('mkt.fin_visa.desc'); },
    acquisitionCost: 200_000_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.15, label: 'Marketing +15%' },
    isAcquired: false,
    marketCap: 200_000_000_000
  },
  {
    id: 'fin_coin',
    symbol: 'VLTB',
    name: 'Vaultbank',
    price: 0.5,
    change: -5.0,
    category: 'Finance',
    risk: 'High',
    get description() { return t('mkt.fin_coin.desc'); },
    acquisitionCost: 35_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.30, label: 'Loan Rate -30% (Risky)' },
    isAcquired: false,
    marketCap: 35_000_000
  },
  {
    id: 'fin_jpm',
    symbol: 'HRTW',
    name: 'Hartwell Trust',
    price: 590.0,
    change: 0.8,
    category: 'Finance',
    risk: 'Low',
    get description() { return t('mkt.fin_jpm.desc'); },
    acquisitionCost: 59_000_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.15, label: 'Loan Rate -15%' },
    isAcquired: false,
    marketCap: 59_000_000_000
  },
  {
    id: 'fin_shark',
    symbol: 'SHRK',
    name: 'LoanShark Inc.',
    price: 0.5,
    change: 2.0,
    category: 'Finance',
    risk: 'High',
    get description() { return t('mkt.fin_shark.desc'); },
    acquisitionCost: 10_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.25, label: 'Loan Rate -25%' },
    isAcquired: false,
    marketCap: 10_000_000
  },

  // --- NEW ADDITIONS (Tech) ---
  {
    id: 'tech_chat',
    symbol: 'CHTL',
    name: 'Chatterling',
    price: 0.99,
    change: 8.5,
    category: 'Technology',
    risk: 'High',
    get description() { return t('mkt.tech_chat.desc'); },
    acquisitionCost: 99_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.20, label: 'R&D Speed +20%' },
    isAcquired: false,
    marketCap: 99_000_000
  },
  {
    id: 'tech_sales',
    symbol: 'DLFW',
    name: 'Dealflow Systems',
    price: 97.0,
    change: 1.2,
    category: 'Technology',
    risk: 'Low',
    get description() { return t('mkt.tech_sales.desc'); },
    acquisitionCost: 9_700_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.15, label: 'Marketing +15%' },
    isAcquired: false,
    marketCap: 9_700_000_000
  },
  {
    id: 'tech_intel',
    symbol: 'CRCS',
    name: 'Corecast Semi',
    price: 9.8,
    change: -2.5,
    category: 'Technology',
    risk: 'Medium',
    get description() { return t('mkt.tech_intel.desc'); },
    acquisitionCost: 980_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.10, label: 'R&D Speed +10%' },
    isAcquired: false,
    marketCap: 980_000_000
  },
  {
    id: 'tech_adobe',
    symbol: 'PLTT',
    name: 'Palette Creative',
    price: 310.0,
    change: 2.1,
    category: 'Technology',
    risk: 'Low',
    get description() { return t('mkt.tech_adobe.desc'); },
    acquisitionCost: 31_000_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.12, label: 'Marketing +12%' },
    isAcquired: false,
    marketCap: 31_000_000_000
  },
  {
    id: 'tech_spot',
    symbol: 'SNDW',
    name: 'Soundwave Audio',
    price: 0.5,
    change: 3.5,
    category: 'Technology',
    risk: 'Medium',
    get description() { return t('mkt.tech_spot.desc'); },
    acquisitionCost: 31_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.08, label: 'Marketing +8%' },
    isAcquired: false,
    marketCap: 31_000_000
  },

  // --- NEW ADDITIONS (Health) ---
  {
    id: 'health_jnj',
    symbol: 'HRPV',
    name: 'Harper & Vance',
    price: 490.0,
    change: 0.5,
    category: 'Health',
    risk: 'Low',
    get description() { return t('mkt.health_jnj.desc'); },
    acquisitionCost: 49_000_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.10, label: 'Cost -10%' },
    isAcquired: false,
    marketCap: 49_000_000_000
  },
  {
    id: 'health_care',
    symbol: 'CRVL',
    name: 'Caravel Care',
    price: 1600.0,
    change: 1.1,
    category: 'Health',
    risk: 'Low',
    get description() { return t('mkt.health_care.desc'); },
    acquisitionCost: 160_000_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.12, label: 'Loan Rate -12%' },
    isAcquired: false,
    marketCap: 160_000_000_000
  },
  {
    id: 'health_vax',
    symbol: 'VXSN',
    name: 'VaxScene',
    price: 3.8,
    change: 5.5,
    category: 'Health',
    risk: 'High',
    get description() { return t('mkt.health_vax.desc'); },
    acquisitionCost: 380_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.18, label: 'R&D Speed +18%' },
    isAcquired: false,
    marketCap: 380_000_000
  },
  {
    id: 'health_pyramid',
    symbol: 'PYRW',
    name: 'Pyramid Wellness',
    price: 0.5,
    change: -8.0,
    category: 'Health',
    risk: 'Extreme',
    get description() { return t('mkt.health_pyramid.desc'); },
    acquisitionCost: 34_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.25, label: 'Marketing +25% (Risky)' },
    isAcquired: false,
    marketCap: 34_000_000
  },
  {
    id: 'health_fix',
    symbol: 'DNTF',
    name: 'DentalFix',
    price: 1.1,
    change: 2.5,
    category: 'Health',
    risk: 'Medium',
    get description() { return t('mkt.health_fix.desc'); },
    acquisitionCost: 110_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.05, label: 'Cost -5%' },
    isAcquired: false,
    marketCap: 110_000_000
  },

  // --- NEW ADDITIONS (Industrial) ---
  {
    id: 'ind_spce',
    symbol: 'VCTA',
    name: 'Vector Ascent',
    price: 0.92,
    change: 12.0,
    category: 'Industrial',
    risk: 'High',
    get description() { return t('mkt.ind_spce.desc'); },
    acquisitionCost: 92_000_000,
    acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.20, label: 'R&D Speed +20%' },
    isAcquired: false,
    marketCap: 92_000_000
  },
  {
    id: 'ind_lmt',
    symbol: 'IRNV',
    name: 'Ironvale Defense',
    price: 77.0,
    change: 0.8,
    category: 'Industrial',
    risk: 'Low',
    get description() { return t('mkt.ind_lmt.desc'); },
    acquisitionCost: 7_700_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.08, label: 'Cost -8%' },
    isAcquired: false,
    marketCap: 7_700_000_000
  },
  {
    id: 'ind_cat',
    symbol: 'MSTD',
    name: 'Mastodon Machinery',
    price: 230.0,
    change: 1.5,
    category: 'Industrial',
    risk: 'Medium',
    get description() { return t('mkt.ind_cat.desc'); },
    acquisitionCost: 23_000_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.10, label: 'Cost -10%' },
    isAcquired: false,
    marketCap: 23_000_000_000
  },
  {
    id: 'ind_shell',
    symbol: 'KRKN',
    name: 'Kraken Petroleum',
    price: 2100.0,
    change: 0.5,
    category: 'Industrial',
    risk: 'Low',
    get description() { return t('mkt.ind_shell.desc'); },
    acquisitionCost: 210_000_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.15, label: 'Cost -15%' },
    isAcquired: false,
    marketCap: 210_000_000_000
  },
  {
    id: 'ind_solar',
    symbol: 'HLGD',
    name: 'Helios Grid',
    price: 0.5,
    change: 4.5,
    category: 'Industrial',
    risk: 'High',
    get description() { return t('mkt.ind_solar.desc'); },
    acquisitionCost: 30_000_000,
    acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.07, label: 'Cost -7%' },
    isAcquired: false,
    marketCap: 30_000_000
  },

  // --- NEW ADDITIONS (Finance) ---
  {
    id: 'fin_axp',
    symbol: 'IMPC',
    name: 'Imperial Charge',
    price: 49.0,
    change: 1.0,
    category: 'Finance',
    risk: 'Medium',
    get description() { return t('mkt.fin_axp.desc'); },
    acquisitionCost: 4_900_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.10, label: 'Loan Rate -10%' },
    isAcquired: false,
    marketCap: 4_900_000_000
  },
  {
    id: 'fin_brk',
    symbol: 'OKMT',
    name: 'Oakmont Holdings',
    price: 7000.0,
    change: 0.1,
    category: 'Finance',
    risk: 'Low',
    get description() { return t('mkt.fin_brk.desc'); },
    acquisitionCost: 700_000_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.20, label: 'Loan Rate -20%' },
    isAcquired: false,
    marketCap: 700_000_000_000
  },
  {
    id: 'fin_sq',
    symbol: 'BLKP',
    name: 'BlockPay',
    price: 4.1,
    change: 3.2,
    category: 'Finance',
    risk: 'Medium',
    get description() { return t('mkt.fin_sq.desc'); },
    acquisitionCost: 410_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.10, label: 'Marketing +10%' },
    isAcquired: false,
    marketCap: 410_000_000
  },
  {
    id: 'fin_hood',
    symbol: 'ZROB',
    name: 'Zeroes Brokerage',
    price: 1.2,
    change: -2.0,
    category: 'Finance',
    risk: 'High',
    get description() { return t('mkt.fin_hood.desc'); },
    acquisitionCost: 120_000_000,
    acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.20, label: 'Marketing +20%' },
    isAcquired: false,
    marketCap: 120_000_000
  },
  {
    id: 'fin_ma',
    symbol: 'KYST',
    name: 'Keystone Card',
    price: 170.0,
    change: 0.9,
    category: 'Finance',
    risk: 'Low',
    get description() { return t('mkt.fin_ma.desc'); },
    acquisitionCost: 17_000_000_000,
    acquisitionBuff: { type: 'LOAN_INTEREST', value: 0.15, label: 'Loan Rate -15%' },
    isAcquired: false,
    marketCap: 17_000_000_000
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
    symbol: 'AURC',
    name: 'Aurum Coin',
    price: 64200.00,
    change: 5.5,
    volatility: 'Medium',
    risk: 'High',
    get description() { return t('mkt.crypto_btc.desc'); },
    marketCap: 1_200_000_000_000
  },
  {
    id: 'crypto_eth',
    symbol: 'NXCH',
    name: 'Nexus Chain',
    price: 3400.00,
    change: 3.2,
    volatility: 'High',
    risk: 'High',
    get description() { return t('mkt.crypto_eth.desc'); },
    marketCap: 400_000_000_000
  },
  {
    id: 'crypto_sol',
    symbol: 'VLCE',
    name: 'Veloce',
    price: 145.00,
    change: 8.5,
    volatility: 'High',
    risk: 'High',
    get description() { return t('mkt.crypto_sol.desc'); },
    marketCap: 65_000_000_000
  },
  {
    id: 'crypto_doge',
    symbol: 'PUPC',
    name: 'Pupcoin',
    price: 0.12,
    change: 15.0,
    volatility: 'Extreme',
    risk: 'Extreme',
    get description() { return t('mkt.crypto_doge.desc'); },
    marketCap: 18_000_000_000
  },
  {
    id: 'crypto_pepe',
    symbol: 'FRGC',
    name: 'Frogcoin',
    price: 0.0004,
    change: -25.0,
    volatility: 'Extreme',
    risk: 'Extreme',
    get description() { return t('mkt.crypto_pepe.desc'); },
    marketCap: 1_500_000_000
  },
  // --- NEW CRYPTO ---
  {
    id: 'crypto_bnb',
    symbol: 'BZRT',
    name: 'Bazaar Token',
    price: 600.00,
    change: 2.5,
    volatility: 'Medium',
    risk: 'Medium',
    get description() { return t('mkt.crypto_bnb.desc'); },
    marketCap: 90_000_000_000
  },
  {
    id: 'crypto_ada',
    symbol: 'SCHL',
    name: 'Scholar Chain',
    price: 0.45,
    change: 1.2,
    volatility: 'Medium',
    risk: 'Medium',
    get description() { return t('mkt.crypto_ada.desc'); },
    marketCap: 15_000_000_000
  },
  {
    id: 'crypto_dot',
    symbol: 'LTTC',
    name: 'Latticecoin',
    price: 7.00,
    change: -1.5,
    volatility: 'High',
    risk: 'High',
    get description() { return t('mkt.crypto_dot.desc'); },
    marketCap: 9_000_000_000
  },
  {
    id: 'crypto_link',
    symbol: 'ORBG',
    name: 'Oracle Bridge',
    price: 18.00,
    change: 4.2,
    volatility: 'High',
    risk: 'Medium',
    get description() { return t('mkt.crypto_link.desc'); },
    marketCap: 10_000_000_000
  },
  {
    id: 'crypto_shib',
    symbol: 'MMTT',
    name: 'Meme Mutt',
    price: 0.00002,
    change: 12.0,
    volatility: 'Extreme',
    risk: 'Extreme',
    get description() { return t('mkt.crypto_shib.desc'); },
    marketCap: 12_000_000_000
  },
  {
    id: 'crypto_ltc',
    symbol: 'FTHR',
    name: 'Featherpay',
    price: 85.00,
    change: 0.5,
    volatility: 'Medium',
    risk: 'Medium',
    get description() { return t('mkt.crypto_ltc.desc'); },
    marketCap: 6_000_000_000
  },
  {
    id: 'crypto_xmr',
    symbol: 'VEIL',
    name: 'Veilcoin',
    price: 150.00,
    change: -2.0,
    volatility: 'High',
    risk: 'High',
    get description() { return t('mkt.crypto_xmr.desc'); },
    marketCap: 2_500_000_000
  },
  {
    id: 'crypto_matic',
    symbol: 'HEXC',
    name: 'Hexachain',
    price: 0.90,
    change: 3.0,
    volatility: 'High',
    risk: 'Medium-High',
    get description() { return t('mkt.crypto_matic.desc'); },
    marketCap: 8_000_000_000
  },
  {
    id: 'crypto_sfm',
    symbol: 'MNVT',
    name: 'MoonVault',
    price: 0.000001,
    change: -50.0,
    volatility: 'Extreme',
    risk: 'Extreme',
    get description() { return t('mkt.crypto_sfm.desc'); },
    marketCap: 200_000_000
  },
  {
    id: 'crypto_ape',
    symbol: 'PXLT',
    name: 'Pixel Art Token',
    price: 1.50,
    change: 15.0,
    volatility: 'Extreme',
    risk: 'High',
    get description() { return t('mkt.crypto_ape.desc'); },
    marketCap: 500_000_000
  }
];

// --- FUNDS ---
// --- FUNDS ---
export const INITIAL_FUNDS: FundItem[] = [
  {
    id: 'fund_spy',
    symbol: 'BRD5',
    get name() { return t('mkt.fund_spy.name'); },
    price: 450.00,
    change: 0.5,
    expenseRatio: 0.0003, // 0.03%
    category: 'Index',
    risk: 'Low',
    get description() { return t('mkt.fund_spy.desc'); },
    topHoldings: ['Pear Inc', 'Gigasoft', 'Dealflow Systems']
  },
  {
    id: 'fund_qqq',
    symbol: 'GTEC',
    get name() { return t('mkt.fund_qqq.name'); },
    price: 380.00,
    change: 1.2,
    expenseRatio: 0.006, // 0.6%
    category: 'Sector',
    risk: 'Medium',
    get description() { return t('mkt.fund_qqq.desc'); },
    topHoldings: ['Lumenchip', 'ChatAI', 'Circles']
  },
  {
    id: 'fund_icln',
    symbol: 'GREN',
    get name() { return t('mkt.fund_icln.name'); },
    price: 25.00,
    change: 2.1,
    expenseRatio: 0.008, // 0.8%
    category: 'Sector',
    risk: 'High',
    get description() { return t('mkt.fund_icln.desc'); },
    topHoldings: ['SolarCity', 'Dynamo Motors', 'WindFarm Corp']
  },
  {
    id: 'fund_gld',
    symbol: 'GBUL',
    get name() { return t('mkt.fund_gld.name'); },
    price: 185.00,
    change: 0.1,
    expenseRatio: 0.004, // 0.4%
    category: 'Commodity',
    risk: 'Low',
    get description() { return t('mkt.fund_gld.desc'); },
    topHoldings: ['Physical Gold Bars']
  },
  {
    id: 'fund_vym',
    symbol: 'HDIV',
    get name() { return t('mkt.fund_vym.name'); },
    price: 110.00,
    change: 0.3,
    expenseRatio: 0.005, // 0.5%
    category: 'Index',
    risk: 'Low',
    get description() { return t('mkt.fund_vym.desc'); },
    topHoldings: ['Harper & Vance', 'CocaColaFake', 'Kraken Petroleum']
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