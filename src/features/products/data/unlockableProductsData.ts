import { t } from '../../../core/i18n';
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
        get name() { return t('product.smartPhone'); },
        get description() { return t('product.essentialForModernLifeHigh'); },
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
        get name() { return t('product.smartSpeaker'); },
        get description() { return t('product.voiceAssistantForEveryHome'); },
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
        get name() { return t('product.vrHeadset'); },
        get description() { return t('product.gatewayToTheMetaverse'); },
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
        get name() { return t('product.gameStationX'); },
        get description() { return t('product.nextGenEntertainmentSystem'); },
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
        get name() { return t('product.autoDrone4k'); },
        get description() { return t('product.autonomousCameraDrone'); },
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
        get name() { return t('product.homeBotV1'); },
        get description() { return t('product.cleansCooksAndSecures'); },
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
        get name() { return t('product.deliveryRover'); },
        get description() { return t('product.lastMileLogisticsSolution'); },
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
        get name() { return t('product.industrialArm'); },
        get description() { return t('product.automationForFactories'); },
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
        get name() { return t('product.electricSedan'); },
        get description() { return t('product.longRangeZeroEmissionVehicle'); },
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
        get name() { return t('product.cyberneticLimb'); },
        get description() { return t('product.betterFasterStrongerThanBiological'); },
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
        get name() { return t('product.neuralLink'); },
        get description() { return t('product.directBrainComputerInterface'); },
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
        get description() { return t('product.trafficIsForTheGround'); },
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
        get name() { return t('product.quantumComputer'); },
        get description() { return t('product.simulatingTheUniverse'); },
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
        get name() { return t('product.fusionReactor'); },
        get description() { return t('product.unlimitedCleanEnergyForCities'); },
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
        get name() { return t('product.mindUpload'); },
        get description() { return t('product.digitalImmortalityAsAService'); },
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
