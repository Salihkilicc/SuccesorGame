import { t } from '../../../core/i18n';
export type ProductStatus = 'locked' | 'active' | 'retired';
export type ProductCategory = 'phone' | 'computer' | 'watch' | 'other';

export interface Product {
    /**
     * Yumusatilmis kiyas pazarlama butcesi. Motor her ceyrek gunceller;
     * ekran da bunu okur ki gordugun esik ile motorun kullandigi ayni
     * olsun. Bkz. core/market/attraction.ts
     */
    benchmarkSmoothed?: number;
    /** Teslimat karnesi (0..1). Talebi karsilayamadikca duser, payini kirpar.
     *  Bkz. core/market/attraction.ts -> updateReachIndex */
    reachIndex?: number;
    // --- FASON URETIM (bkz. core/market/contract.ts) ---
    /** Fason uretici kimligi. Bos ise yalnizca kendi tesisinde uretilir. */
    contractPartnerId?: string;
    /** Bu ceyrek fasoncuya verilen siparis adedi. Kendi kapasiteni KULLANMAZ. */
    contractUnits?: number;
    /** Bu fasoncuyla sozlesme acilis bedeli odendi mi */
    contractSetupPaid?: boolean;
  id: string;
  name: string;
  icon: string;
  description: string;
  status: ProductStatus;
  category: ProductCategory;

  // Kilit Açma Gereksinimleri
  rndCost: number;
  complexity: number;
  unlockCashCost: number;

  // Pazar Verileri (Analizden önce gizli olabilir, şimdilik sabit veriyoruz)
  marketDemand: number; // 0-100
  competition: 'Low' | 'Medium' | 'High';
  baseProductionCost: number;
  unitCost?: number; // User-facing cost (can be lowered via R&D)
  suggestedPrice: number;

  // R&D Upgrade Levels (0-10)
  costLevel?: number; // Old field, kept for safety
  priceLevel?: number; // Old field, kept for safety

  qualityLevel: number; // NEW: Controls Price Scaling (Default: 1)
  processLevel: number; // NEW: Controls Cost Scaling (Default: 1)

  // Aktif Durum Verileri (Kullanıcı Ayarları)
  sellingPrice?: number;
  /**
   * CEYREKLIK PAZARLAMA BUTCESI (dolar) — pazarlamanin tek kontrolu.
   *
   * Satistan BAGIMSIZ, sabit gider: satsan da satmasan da odenir.
   * Etkisi mutlak degil goreli — kategorinin kiyas butcesine kiyasla
   * ne harcadigin onemli. Bkz. core/market/attraction.ts
   */
  marketingBudget?: number;
  /**
   * ESKI ALAN — satilan birim basina pazarlama.
   * Satmazsan odemiyordun, bu da onu risksiz bir kaldirac yapiyordu.
   * Sadece eski kayitlari tasimak icin okunuyor; yeni kayit yazmiyor.
   */
  marketingSpendPerUnit?: number;
  /**
   * ESKI ALAN — kapasitenin yuzdesi (0-100).
   * Artik uretim MUTLAK ADET ile ayarlaniyor (productionUnits).
   * Sadece eski kayitlari tasimak icin okunuyor; yeni kayit yazmiyor.
   * Bkz. core/market/production.ts -> resolveTargetUnits
   */
  productionLevel?: number;
  /**
   * Ceyreklik uretim HEDEFI (adet).
   *
   * Neden yuzde degil: fabrika/eleman alip kapasiteni buyuttugunde
   * yuzdeli ayar uretimi kendiliginden artiriyordu. Mutlak adette hedef
   * yerinde kalir, artirmak istersen bilerek artirirsin.
   * Kapasiteyi asarsa motor otomatik kirpar.
   */
  productionUnits?: number;
  supplierId?: string; // 'local' | 'global'
  inventory?: number; // Stock count (unsold units)
  revenue?: number; // Calculated revenue from sales
  // Supplier Info
  supplier?: Supplier;
  // Market Info
  market?: {
    demand: number;
    competition: number;
    researched: boolean;
  };
  // Pricing Info
  pricing?: {
    salePrice: number;
  };
  // Production Info
  production?: {
    allocated: number;
    weight?: number; // production weight/cost
  };
}

export interface Supplier {
  name: string;
  cost: number;
  quality: number;
}

export const DEFAULT_SUPPLIERS: Record<string, Supplier[]> = {
  'Electronics': [
    { get name() { return t('product.globalComponentsInc'); }, cost: 100, quality: 75 },
    { get name() { return t('product.budgetTechSupplies'); }, cost: 60, quality: 45 },
    { get name() { return t('product.premiumSiliconWafer'); }, cost: 180, quality: 95 }
  ],
  'Fashion': [ // Just in case
    { get name() { return t('product.textileGlobal'); }, cost: 50, quality: 70 },
    { get name() { return t('product.cheapFabrics'); }, cost: 20, quality: 30 }
  ]
};

export const INITIAL_PRODUCTS: Product[] = [
  // Products are now created dynamically when unlocking from Tech Tree
  // No pre-defined products in this array
];

// Product name lists by category
export const PRODUCT_NAMES: Record<ProductCategory, string[]> = {
  phone: [
    'NexusPhone', 'QuantumCall', 'InfinityEdge', 'PulsePhone', 'EchoLink',
    'VortexMobile', 'ApexCall', 'NovaPhone', 'ZenithEdge', 'PrismCall'
  ],
  computer: [
    'MacroBook', 'ThinkPad Ultra', 'SiliconPro', 'QuantumBook', 'ApexStation',
    'NovaPro', 'ZenithBook', 'InfinityDesk', 'PulseBook', 'VortexPro'
  ],
  watch: [
    'TimeLink', 'PulseWatch', 'ChronoFit', 'ApexTime', 'QuantumWatch',
    'NovaFit', 'ZenithPulse', 'InfinityTime', 'VortexWatch', 'EchoFit'
  ],
  other: [
    'TechGadget', 'SmartDevice', 'InnovatePro', 'FutureGear', 'QuantumTech',
    'ApexDevice', 'NovaGadget', 'ZenithTech', 'InfinityGear', 'VortexDevice'
  ]
};

// Helper function to get random product name
export const getRandomProductName = (category: ProductCategory): string => {
  const names = PRODUCT_NAMES[category];
  return names[Math.floor(Math.random() * names.length)];
};