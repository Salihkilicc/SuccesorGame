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

  // Pazar Verileri (Analizden önce gizli olabilir, şimdilik sabit veriyoruz)
  marketDemand: number; // 0-100
  competition: 'Low' | 'Medium' | 'High';
  baseProductionCost: number;
  unitCost?: number; // User-facing cost (can be lowered via R&D)
  suggestedPrice: number;

  // R&D Upgrade Levels (0-10)
  costLevel?: number; // Production cost optimization level
  priceLevel?: number; // Feature enhancement level

  // Aktif Durum Verileri (Kullanıcı Ayarları)
  sellingPrice?: number;
  marketingBudget?: number; // DEPRECATED - kept for migration
  marketingSpendPerUnit?: number; // NEW: $0-$500 per unit sold
  productionLevel?: number; // 0-100 Kapasite
  supplierId?: string; // 'local' | 'global'
  inventory?: number; // Stock count (unsold units)
}

export const INITIAL_PRODUCTS: Product[] = [
  // --- AKTİF ÜRÜNLER (Başlangıçta açık) ---
  {
    id: 'prod_basic',
    name: 'Basic Widget',
    icon: '⚙️',
    description: 'Simple household mechanism.',
    status: 'active',
    category: 'other',
    rndCost: 0,
    marketDemand: 80,
    competition: 'High',
    baseProductionCost: 5,
    suggestedPrice: 12,
    sellingPrice: 12,
    marketingBudget: 1000,
    productionLevel: 80, // Demand ile eşit başlar
    supplierId: 'local',
    costLevel: 0,
    priceLevel: 0,
  },
  {
    id: 'prod_toaster',
    name: 'Smart Toaster',
    icon: '🍞',
    description: 'Wifi enabled toasting device.',
    status: 'active',
    category: 'other',
    rndCost: 0,
    marketDemand: 65,
    competition: 'Medium',
    baseProductionCost: 25,
    suggestedPrice: 55,
    sellingPrice: 55,
    marketingBudget: 2500,
    productionLevel: 65,
    supplierId: 'global',
    costLevel: 0,
    priceLevel: 0,
  },

  // --- KİLİTLİ ÜRÜNLER (Ar-Ge ile açılacak) ---
  { id: 'prod_vr', name: 'VR Headset', icon: '🥽', description: 'Immersive virtual reality gear.', status: 'locked', category: 'other', rndCost: 500, marketDemand: 45, competition: 'Low', baseProductionCost: 150, suggestedPrice: 450, costLevel: 0, priceLevel: 0 },
  { id: 'prod_ai', name: 'AI Chip', icon: '🧠', description: 'Neural processing unit.', status: 'locked', category: 'other', rndCost: 1200, marketDemand: 90, competition: 'High', baseProductionCost: 80, suggestedPrice: 250, costLevel: 0, priceLevel: 0 },
  { id: 'prod_drone', name: 'Delivery Drone', icon: '🚁', description: 'Autonomous package delivery.', status: 'locked', category: 'other', rndCost: 2500, marketDemand: 60, competition: 'Medium', baseProductionCost: 300, suggestedPrice: 900, costLevel: 0, priceLevel: 0 },
  { id: 'prod_quantum', name: 'Quantum Sensor', icon: '⚛️', description: 'High precision physics tool.', status: 'locked', category: 'other', rndCost: 5000, marketDemand: 20, competition: 'Low', baseProductionCost: 1200, suggestedPrice: 3500, costLevel: 0, priceLevel: 0 },
  { id: 'prod_battery', name: 'Eco Battery', icon: '🔋', description: 'Long lasting green energy.', status: 'locked', category: 'other', rndCost: 800, marketDemand: 75, competition: 'Medium', baseProductionCost: 40, suggestedPrice: 120, costLevel: 0, priceLevel: 0 },
  { id: 'prod_car', name: 'Flying Car', icon: '🛸', description: 'Personal aerial vehicle.', status: 'locked', category: 'other', rndCost: 15000, marketDemand: 95, competition: 'Low', baseProductionCost: 25000, suggestedPrice: 60000, costLevel: 0, priceLevel: 0 },
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