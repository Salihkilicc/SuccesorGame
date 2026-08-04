// src/core/market/contract.ts
//
// ============================================================================
//  FASON ÜRETİM — üçüncü taraf fabrikaya sipariş
// ============================================================================
//
//  NEDEN VAR
//  ---------
//  Oyuncunun sorusu suydu: "iki urunde pazari domine etmek istiyorum ama
//  yapamiyorum." Hakliydi — tek tesis, sabit kapasite, ve kapasiteyi
//  buyutmek ceyrekler suren bir insaat. Yani bir urunu buyutmek her zaman
//  digerini kesmek demekti. Bu bir tercih degil, bir duvardi.
//
//  GERCEK HAYATTA CEO NE YAPAR
//  ---------------------------
//  Kendi fabrikasini kurmaz — fason ureticiye gider. Apple'in tek bir
//  iPhone fabrikasi yoktur; Foxconn uretir. Nike ayakkabi uretmez. Bu
//  sektorde standart yapidir ve adi "make or buy" kararidir:
//
//    KENDIN URET  ->  ucuz birim maliyet, ama once sermaye ve zaman
//    FASON VER    ->  aninda kapasite, ama her üründen daha az kazanirsin
//
//  Yani fason bir kestirme degil, PAHALI bir kestirme. Buyume hizini
//  parayla satin alirsin ve bunu marjindan odersin.
//
//  UC GERCEK BEDELI
//  ----------------
//   1) BIRIM MALIYET: fasoncu da kar eder. Senin maliyetinin ustune
//      %30-60 biner. Dusuk marjli urunde bu marji tamamen yer.
//
//   2) KALITE TAVANI: onlarin hattinda uretiyorsun, senin hattinda degil.
//      Ar-Ge'de kesfettigin seviye 9'u ucuz bir fasoncu uretemez.
//
//   3) BAGIMLILIK: siparisin onlarin kapasitesiyle sinirli ve buyuk
//      fasoncular kucuk musteriyi almaz. En iyi sartlar en buyuklerde.
//
//  Kendi tesisini buyutmek H_L_ dogru uzun vadeli hamledir. Fason,
//  "pazar simdi buyuyor ve fabrikam iki yil sonra hazir" anini kurtarir.
//
// ============================================================================

export interface ContractPartner {
    id: string;
    name: string;
    /** Kisa taniticisi */
    description: string;
    /** Senin birim maliyetinin kac katina uretir */
    costMultiplier: number;
    /** Bu hatta cikabilecek en yuksek kalite seviyesi */
    qualityCeiling: number;
    /** Saglam cikma orani */
    yieldRate: number;
    /** Ceyreklik en dusuk siparis (adet) */
    minOrder: number;
    /** Ceyreklik en yuksek siparis (adet) */
    maxOrder: number;
    /** Sozlesme acilis bedeli — bir kez, kalip ve hat kurulumu */
    setupCost: number;
    /** Bu fasoncunun seni musteri olarak kabul etmesi icin gereken marka */
    minBrand: number;
}

/**
 * Merdiven bilincli olarak TERS kurulu: buyudukce daha UCUZ ve daha IYI
 * fasoncuya erisirsin. Gercek hayatta da boyledir — olcek pazarlik
 * gucudur. Ama en iyi fasoncular kucuk musteriyle ugrasmaz, o yuzden
 * marka esigi var.
 */
export const CONTRACT_PARTNERS: ContractPartner[] = [
    {
        id: 'local_assembly',
        name: 'Local Assembly Co.',
        description: 'A shed with twelve people and a soldering station. They will take any order, and it shows.',
        costMultiplier: 1.60,
        qualityCeiling: 4,
        yieldRate: 0.92,
        minOrder: 0,
        maxOrder: 40_000,
        setupCost: 250_000,
        minBrand: 0,
    },
    {
        id: 'meridian',
        name: 'Meridian Contract Mfg.',
        description: 'A real factory with real quality control. The standard choice once you are shipping seriously.',
        costMultiplier: 1.42,
        qualityCeiling: 7,
        yieldRate: 0.96,
        minOrder: 10_000,
        maxOrder: 900_000,
        setupCost: 6_000_000,
        minBrand: 25,
    },
    {
        id: 'apex',
        name: 'Apex Precision',
        description: 'They build for the biggest names in the world. They will not return your call until you are one.',
        costMultiplier: 1.30,
        qualityCeiling: 10,
        yieldRate: 0.985,
        minOrder: 200_000,
        maxOrder: 14_000_000,
        setupCost: 120_000_000,
        minBrand: 60,
    },
];

export const getPartner = (id?: string): ContractPartner | undefined =>
    CONTRACT_PARTNERS.find(p => p.id === id);

/** Bu marka seviyesiyle hangi fasoncular seni musteri olarak alir. */
export const availablePartners = (brandValue: number): ContractPartner[] =>
    CONTRACT_PARTNERS.filter(p => (brandValue || 0) >= p.minBrand);

// ============================================================================
//  ÇEYREKLİK SİPARİŞ
// ============================================================================

export interface ContractOrderResult {
    /** Fasoncunun gercekten uretebildigi adet (min/maks kirpilmis) */
    units: number;
    /** Fire sonrasi satilabilir adet */
    goodUnits: number;
    /** Bu siparisin toplam bedeli */
    cost: number;
    /** Fason birim maliyeti */
    unitCost: number;
    /** Bu partiye uygulanan kalite tavani */
    qualityCeiling: number;
    /** Siparis neden kirpildi (varsa) */
    note?: string;
}

/**
 * Bir ceyreklik fason siparisini hesaplar.
 *
 * DIKKAT: bu uretim SENIN KAPASITENI HIC KULLANMAZ. Fasonun butun
 * mantigi budur — kapasite duvarinin etrafindan dolasmak. Bunun karsiligi
 * her üründe daha dusuk marj ve daha dusuk kalite tavanidir.
 */
export const quoteContractOrder = (
    partner: ContractPartner,
    requestedUnits: number,
    ownUnitCost: number,
): ContractOrderResult => {
    const requested = Math.max(0, Math.floor(requestedUnits || 0));

    if (requested <= 0) {
        return { units: 0, goodUnits: 0, cost: 0, unitCost: 0, qualityCeiling: partner.qualityCeiling };
    }

    let note: string | undefined;
    let units = requested;

    if (units < partner.minOrder) {
        // Asgari siparisin altinda kalirsan hat kurulmaz. Kismen degil,
        // HIC uretmez — gercek fason sozlesmeleri de boyledir.
        return {
            units: 0, goodUnits: 0, cost: 0, unitCost: 0,
            qualityCeiling: partner.qualityCeiling,
            note: `${partner.name} will not run a line below ${partner.minOrder.toLocaleString()} units.`,
        };
    }
    if (units > partner.maxOrder) {
        units = partner.maxOrder;
        note = `${partner.name} capped the order at ${partner.maxOrder.toLocaleString()} units.`;
    }

    const unitCost = Math.max(1, ownUnitCost) * partner.costMultiplier;

    return {
        units,
        goodUnits: Math.floor(units * partner.yieldRate),
        cost: Math.round(units * unitCost),
        unitCost,
        qualityCeiling: partner.qualityCeiling,
        note,
    };
};

/**
 * Kendi uretimin ve fason uretimin karisiminin ETKIN KALITESI.
 *
 * Hepsini ayni kutuya koyup ayni markayla satiyorsun; musteri hangisinin
 * nerede uretildigini bilmiyor. O yuzden kalite hacim agirlikli ortalama
 * olur. Ucuz fasoncuya cok is verirsen urunun algilanan kalitesi duser —
 * gercek hayatta da fason kaymasinin marka bedeli tam olarak budur.
 */
export const blendedQuality = (
    ownUnits: number,
    ownQuality: number,
    contractUnits: number,
    contractCeiling: number,
): number => {
    const own = Math.max(0, ownUnits);
    const con = Math.max(0, contractUnits);
    const total = own + con;
    if (total <= 0) return ownQuality;

    const contractQuality = Math.min(ownQuality, contractCeiling);
    return (own * ownQuality + con * contractQuality) / total;
};

/** Fason uretimin toplam uretimdeki payi (yuzde) — ekranda gostermek icin. */
export const contractShare = (ownUnits: number, contractUnits: number): number => {
    const total = Math.max(0, ownUnits) + Math.max(0, contractUnits);
    return total > 0 ? (Math.max(0, contractUnits) / total) * 100 : 0;
};

/**
 * Marj karsilastirmasi — oyuncunun karari verebilmesi icin tek satir.
 * "Bu üründen kendi hattimda X, fasonda Y kazaniyorum."
 */
export const marginComparison = (
    sellingPrice: number,
    ownUnitCost: number,
    partner: ContractPartner,
): { ownMargin: number; contractMargin: number; marginLost: number } => {
    const price = Math.max(0, sellingPrice || 0);
    const ownMargin = price - Math.max(0, ownUnitCost || 0);
    const contractMargin = price - Math.max(0, ownUnitCost || 0) * partner.costMultiplier;
    return { ownMargin, contractMargin, marginLost: ownMargin - contractMargin };
};
