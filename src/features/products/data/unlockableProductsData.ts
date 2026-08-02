export type ProductCategory = 'Consumer' | 'Robotics' | 'Bio-Tech' | 'Deep Tech';

// ============================================================================
//  DENGE NOTU — RP ve nakit maliyetleri yeniden olceklendi
// ============================================================================
//  ESKI DEGERLER BASKA BIR OYUNA AITTI. Smart Speaker (2. urun) 100.000 RP
//  istiyordu; bir arastirmaci ceyrekte 10 RP uretiyor ve 500.000 dolar
//  maas aliyordu. Oyuncunun ceyreklik kari ~800.000 dolar. Yani:
//
//    100 arastirmaci = ceyrekte 9.6 milyon dolar maas (karin 12 kati)
//    ve 100.000 RP birikmesi 100 CEYREK, yani 25 YIL surerdi.
//
//  Sadece ikinci urun icin. Tech tree fiilen erisilemezdi.
//
//  YENI EGRI: ~1.68x geometrik. Ikinci urun 50.000 RP; oyuncu karinin
//  ucte birini Ar-Ge'ye ayirirsa (~3 arastirmaci, ceyrekte ~4.600 RP)
//  yaklasik 11 ceyrekte acilir. Tepe (Mind Upload) 42.8 milyon RP — o
//  noktada binlerce arastirmacisi olan bir dev sirketsin.
//
//  RAKAMLARIN BUYUKLUGU BILINCLI. Ilk denemede egri 700 RP'den
//  basliyordu ve tempo aynidi, ama "700 puan" bir urun kesfi icin
//  hafif duruyordu. Tum RP ekonomisi (arastirmaci ciktisi, kademe
//  sartlari, urun yukseltmeleri) ayni katsayiyla buyutuldu — yani
//  DENGE degismedi, sadece olcek okunakli hale geldi.
//
//  Nakit maliyet ayri bir egridir; RP ile birlikte artar ama ayni
//  katsayiyla degil.
// ============================================================================

export interface UnlockableProduct {
    id: string;
    name: string;
    description: string;
    category: ProductCategory;
    unlockRPCost: number;
    unlockCashCost: number;
    baseUnitCost: number;
    baseSellingPrice: number;
    complexity: number;
    stockBoost: number; // Percentage boost to company valuation
    isUnlocked: boolean;
}

export const UNLOCKABLE_PRODUCTS: UnlockableProduct[] = [
    // --- TIER 1: CONSUMER ELECTRONICS (Starter Pack & Early Game) ---
    {
        id: 'smart_phone',
        name: 'Smart Phone',
        description: 'Essential for modern life. High volume.',
        baseSellingPrice: 600,
        baseUnitCost: 250,
        complexity: 50, // BASE DIFFICULTY
        unlockRPCost: 0,
        unlockCashCost: 0,
        category: 'Consumer',
        stockBoost: 1,
        isUnlocked: true // STARTER PRODUCT 1
    },
    // NOT: 'pro_laptop' (Pro Laptop) oyundan tamamen kaldirildi.
    // Baslangic urunuyken 'isUnlocked: true' bayragi uzerinde kalmisti;
    // urun baslangic listesinden cikinca Tech Tree'de "acilmis" gorunuyor
    // ama ortada oynanabilir bir urun olmuyordu.
    // Geri istenirse: id 'pro_laptop', fiyat 1200, maliyet 550,
    // karmasiklik 90, Consumer kategorisi, stockBoost 2.
    {
        id: 'smart_speaker',
        name: 'Smart Speaker',
        description: 'Voice assistant for every home.',
        baseSellingPrice: 150,
        baseUnitCost: 70,
        complexity: 12,
        unlockRPCost: 50_000,
        unlockCashCost: 1_500_000,
        category: 'Consumer',
        stockBoost: 1.5,
        isUnlocked: false
    },
    {
        id: 'vr_headset',
        name: 'VR Headset',
        description: 'Gateway to the metaverse.',
        baseSellingPrice: 800,
        baseUnitCost: 350,
        complexity: 65,
        unlockRPCost: 85_700,
        unlockCashCost: 2_600_000,
        category: 'Consumer',
        stockBoost: 3,
        isUnlocked: false
    },
    {
        id: 'gaming_console',
        name: 'Game Station X',
        description: 'Next-gen entertainment system.',
        baseSellingPrice: 500,
        baseUnitCost: 280,
        complexity: 40,
        unlockRPCost: 143_000,
        unlockCashCost: 4_400_000,
        category: 'Consumer',
        stockBoost: 2.5,
        isUnlocked: false
    },

    // --- TIER 2: ROBOTICS & DRONES (Mid Game) ---
    {
        id: 'drone_4k',
        name: 'Auto-Drone 4K',
        description: 'Autonomous camera drone.',
        baseSellingPrice: 2500,
        baseUnitCost: 1100,
        complexity: 200,
        unlockRPCost: 236_000,
        unlockCashCost: 7_300_000,
        category: 'Robotics',
        stockBoost: 5,
        isUnlocked: false
    },
    {
        id: 'home_robot',
        name: 'Home Bot v1',
        description: 'Cleans, cooks, and secures.',
        baseSellingPrice: 15000,
        baseUnitCost: 6500,
        complexity: 1100,
        unlockRPCost: 400_000,
        unlockCashCost: 12_300_000,
        category: 'Robotics',
        stockBoost: 8,
        isUnlocked: false
    },
    {
        id: 'delivery_bot',
        name: 'Delivery Rover',
        description: 'Last-mile logistics solution.',
        baseSellingPrice: 8000,
        baseUnitCost: 3500,
        complexity: 600,
        unlockRPCost: 671_000,
        unlockCashCost: 20_700_000,
        category: 'Robotics',
        stockBoost: 6,
        isUnlocked: false
    },
    {
        id: 'ind_robot_arm',
        name: 'Industrial Arm',
        description: 'Automation for factories.',
        baseSellingPrice: 50000,
        baseUnitCost: 20000,
        complexity: 3500,
        unlockRPCost: 1_140_000,
        unlockCashCost: 35_200_000,
        category: 'Robotics',
        stockBoost: 10,
        isUnlocked: false
    },
    {
        id: 'electric_car',
        name: 'Electric Sedan',
        description: 'Long range, zero emission vehicle.',
        baseSellingPrice: 45000,
        baseUnitCost: 25000,
        complexity: 3000,
        unlockRPCost: 1_930_000,
        unlockCashCost: 59_400_000,
        category: 'Robotics',
        stockBoost: 12,
        isUnlocked: false
    },

    // --- TIER 3: BIO-TECH & DEEP TECH (Late Game) ---
    {
        id: 'cyber_limb',
        name: 'Cybernetic Limb',
        description: 'Better, faster, stronger than biological.',
        baseSellingPrice: 120000,
        baseUnitCost: 50000,
        complexity: 8000,
        unlockRPCost: 3_210_000,
        unlockCashCost: 99_000_000,
        category: 'Bio-Tech',
        stockBoost: 15,
        isUnlocked: false
    },
    {
        id: 'neural_chip',
        name: 'Neural Link',
        description: 'Direct brain-computer interface.',
        baseSellingPrice: 500000,
        baseUnitCost: 150000,
        complexity: 35000,
        unlockRPCost: 5_360_000,
        unlockCashCost: 165_000_000,
        category: 'Bio-Tech',
        stockBoost: 20,
        isUnlocked: false
    },
    {
        id: 'flying_car',
        name: 'eVTOL SkyCar',
        description: 'Traffic is for the ground dwellers.',
        baseSellingPrice: 2500000,
        baseUnitCost: 1200000,
        complexity: 180000,
        unlockRPCost: 9_280_000,
        unlockCashCost: 286_000_000,
        category: 'Deep Tech',
        stockBoost: 25,
        isUnlocked: false
    },
    {
        id: 'quantum_pc',
        name: 'Quantum Computer',
        description: 'Simulating the universe.',
        baseSellingPrice: 10000000,
        baseUnitCost: 4000000,
        complexity: 700000,
        unlockRPCost: 15_000_000,
        unlockCashCost: 462_000_000,
        category: 'Deep Tech',
        stockBoost: 30,
        isUnlocked: false
    },

    // --- TIER 4: GOD TIER (End Game) ---
    {
        id: 'fusion_reactor',
        name: 'Fusion Reactor',
        description: 'Unlimited clean energy for cities.',
        baseSellingPrice: 150000000, // $150M
        baseUnitCost: 60000000,
        complexity: 10000000, // Very hard to build
        unlockRPCost: 25_700_000,
        unlockCashCost: 792_000_000,
        category: 'Deep Tech',
        stockBoost: 40,
        isUnlocked: false
    },
    {
        id: 'immortality',
        name: 'Mind Upload',
        description: 'Digital immortality as a service.',
        baseSellingPrice: 1000000000, // $1 Billion
        baseUnitCost: 100000000,
        complexity: 50000000,
        unlockRPCost: 42_800_000,
        unlockCashCost: 1_320_000_000,
        category: 'Deep Tech',
        stockBoost: 50,
        isUnlocked: false
    }
];
