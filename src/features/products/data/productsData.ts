export type ProductStatus = 'locked' | 'active' | 'retired';

export interface Product {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: ProductStatus;
  
  // Kilit Açma Gereksinimleri
  rndCost: number;
  
  // Pazar Verileri (Analizden önce gizli olabilir, şimdilik sabit veriyoruz)
  marketDemand: number; // 0-100
  competition: 'Low' | 'Medium' | 'High';
  baseProductionCost: number;
  suggestedPrice: number;

  // Aktif Durum Verileri (Kullanıcı Ayarları)
  sellingPrice?: number;
  marketingBudget?: number;
  productionLevel?: number; // 0-100 Kapasite
  supplierId?: string; // 'local' | 'global'
}

export const INITIAL_PRODUCTS: Product[] = [
  // --- AKTİF ÜRÜNLER (Başlangıçta açık) ---
  {
    id: 'prod_basic',
    name: 'Basic Widget',
    icon: '⚙️',
    description: 'Simple household mechanism.',
    status: 'active',
    rndCost: 0,
    marketDemand: 80,
    competition: 'High',
    baseProductionCost: 5,
    suggestedPrice: 12,
    sellingPrice: 12,
    marketingBudget: 1000,
    productionLevel: 80, // Demand ile eşit başlar
    supplierId: 'local',
  },
  {
    id: 'prod_toaster',
    name: 'Smart Toaster',
    icon: '🍞',
    description: 'Wifi enabled toasting device.',
    status: 'active',
    rndCost: 0,
    marketDemand: 65,
    competition: 'Medium',
    baseProductionCost: 25,
    suggestedPrice: 55,
    sellingPrice: 55,
    marketingBudget: 2500,
    productionLevel: 65,
    supplierId: 'global',
  },

  // --- KİLİTLİ ÜRÜNLER (Ar-Ge ile açılacak) ---
  { id: 'prod_vr', name: 'VR Headset', icon: '🥽', description: 'Immersive virtual reality gear.', status: 'locked', rndCost: 500, marketDemand: 45, competition: 'Low', baseProductionCost: 150, suggestedPrice: 450 },
  { id: 'prod_ai', name: 'AI Chip', icon: '🧠', description: 'Neural processing unit.', status: 'locked', rndCost: 1200, marketDemand: 90, competition: 'High', baseProductionCost: 80, suggestedPrice: 250 },
  { id: 'prod_drone', name: 'Delivery Drone', icon: '🚁', description: 'Autonomous package delivery.', status: 'locked', rndCost: 2500, marketDemand: 60, competition: 'Medium', baseProductionCost: 300, suggestedPrice: 900 },
  { id: 'prod_quantum', name: 'Quantum Sensor', icon: '⚛️', description: 'High precision physics tool.', status: 'locked', rndCost: 5000, marketDemand: 20, competition: 'Low', baseProductionCost: 1200, suggestedPrice: 3500 },
  { id: 'prod_battery', name: 'Eco Battery', icon: '🔋', description: 'Long lasting green energy.', status: 'locked', rndCost: 800, marketDemand: 75, competition: 'Medium', baseProductionCost: 40, suggestedPrice: 120 },
  { id: 'prod_car', name: 'Flying Car', icon: '🛸', description: 'Personal aerial vehicle.', status: 'locked', rndCost: 15000, marketDemand: 95, competition: 'Low', baseProductionCost: 25000, suggestedPrice: 60000 },
];