export type ProductStatus = 'locked' | 'active' | 'retired';
export type ProductCategory = 'phone' | 'computer' | 'watch' | 'other';

export interface Product {
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
  marketingBudget?: number; // DEPRECATED - kept for migration
  marketingSpendPerUnit?: number; // NEW: $0-$500 per unit sold
  productionLevel?: number; // 0-100 Kapasite
  supplierId?: string; // 'local' | 'global'
  inventory?: number; // Stock count (unsold units)
  revenue?: number; // Calculated revenue from sales
}

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