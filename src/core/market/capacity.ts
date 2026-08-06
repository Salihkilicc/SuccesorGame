// @orphan-ok-symbol maxUnitsForProduct - callers use maxUnitsPerQuarter directly
import { t } from '../i18n';
// src/core/market/capacity.ts
//
// ============================================================================
//  ÜRETİM TESİSİ — kademe merdiveni
// ============================================================================
//
//  NEDEN BU DOSYA VAR
//  ------------------
//  Once fabrika oyunda HICBIR ISE YARAMIYORDU. Uretim tamamen calisan
//  sayisina bagliydi (calisan x 500 / karmasiklik); fabrika sadece
//  ceyrekte 5.000 dolarlik bir giderdi. Ustelik fabrika maliyeti dort
//  ayri yerde dort farkli sayiyla yaziliydi ($50K/ay, $5K/ceyrek, $30M,
//  $1M) ve `minEmployees = fabrika x 300` kurali baslangic durumunun
//  kendisiyle celisiyordu (1 fabrika, 20 calisan).
//
//  Simdi tek bir tesisin var ve onu ADIM ADIM yukseltiyorsun.
//  "Kac fabrika" sorusu tamamen kalkti — o soru hem sikici (tek tek
//  tiklama) hem de anlamsizdi.
//
//  MODEL
//  -----
//      uretim = kapasite x personel orani x fire orani
//      personel orani = min(1, calisan / gereken ekip)
//
//  Iki tarafli hata buradan dogar:
//    - Tesisi buyutup adam almazsan: bos demir, sabit gider, uretim yok
//    - Adam alip tesisi buyutmezsen: maas var, yer yok, fazlasi atil
//
//  KADEME NEYI ETKILER
//  -------------------
//  Sihirli "+%2 pazar payi" YOK. Kademe dort ayri GERCEK kanaldan gecer:
//
//    1. Birim maliyet  -> marji yakmadan fiyat kirabilirsin -> priceFactor
//    2. Kalite tavani  -> Ar-Ge'de kesfettigini URETEBILMEK
//    3. Marka tavani   -> atolyede premium marka olamazsin
//    4. Kapasite       -> talebi karsilamak, stok tuketmemek
//
//  Dordu de zaten var olan cekicilik formulunden gecer (attraction.ts).
//  Yeni bir sistem eklemiyoruz, mevcut sisteme tutamak veriyoruz.
//
//  MARKA TABANI DA KADEMEDEN GELIR
//  --------------------------------
//  Simulasyonun ilk turunda marka herkeste 5'e yapisiyordu: pay buyuyunce
//  talep kapasiteyi asiyor, stok tukeniyor, marka yaniyordu. Yani oyuncuyu
//  KENDI BASARISI cezalandiriyordu. Kurumsal bir ureticinin itibari
//  sifirlanmaz — bu yuzden her kademenin bir marka TABANI var.
//
//  DENGE NOTU
//  ----------
//  Sayilar simulasyonla ayarlandi. Dogrulanan sey: hem cok erken hem cok
//  gec yukseltmek para kaybettiriyor, ortada bir tatli nokta var.
//  Merdivenin tepesi asagida anlatildigi gibi TURETILDI, elle secilmedi.
//
// ============================================================================

/**
 * Bir tesis kademesi.
 *
 * `capacity` STANDART BIRIM cinsindendir: karmasikligi 50 olan bir urunun
 * adedi. Karmasikligi 100 olan urun ayni kapasiteden iki kat yer.
 */
export interface FacilityTier {
    /** 1'den baslayan kademe numarasi */
    level: number;
    name: string;
    /** Ceyreklik azami uretim (standart birim) */
    capacity: number;
    /** Kapasiteyi %100 calistirmak icin gereken uretim personeli */
    crew: number;
    /** Bu kademeye YUKSELMENIN tek seferlik bedeli */
    upgradeCost: number;
    /**
     * Bu kademeye cikmak icin gereken ARASTIRMA PUANI.
     *
     * Para tek basina yetmez. Ilk uc kademe sifirdir (tezgah kurmak
     * arastirma istemez), sonrasi hizla artar. Bu olmadan oyuncu
     * sadece nakit biriktirerek merdiveni tirmaniyordu — yani tek
     * bir kaynak tum ilerlemeyi aciyordu.
     *
     * Artik uretim kabiliyeti Ar-Ge'ye BAGLI: laboratuvara yatirim
     * yapmadan fabrika buyutemezsin.
     */
    upgradeRP: number;
    /** Yukseltmenin kac ceyrek surdugu */
    buildQuarters: number;
    /**
     * Insaat sirasinda kapasitenin ne kadari calisir.
     *
     * Alt kademelerde tek hat vardir, yukseltirsen uretim ciddi duser (%65).
     * Ust kademelerde birden fazla hat oldugu icin biri yenilenirken
     * digerleri sevkiyata devam eder (%90'a kadar). Bu olmadan ust
     * kademelerdeki 6 ceyreklik insaatlar oyunu durduruyordu.
     */
    retoolingRatio: number;
    /** Ceyreklik sabit isletme gideri (uretsen de uretmesen de) */
    opexPerQuarter: number;
    /** Birim uretim maliyeti carpani — olcek ekonomisi */
    unitCostMultiplier: number;
    /** Saglam cikan urun orani. Kalani fire. */
    yieldRate: number;
    /** Marka bu kademede en fazla buraya cikar */
    brandCeiling: number;
    /** Marka bu kademede bunun altina DUSMEZ */
    brandFloor: number;
    /** Uretilebilecek en yuksek kalite seviyesi */
    qualityCeiling: number;
    /** Oyuncuya gosterilecek tek cumlelik tarif */
    description: string;
}

/**
 * MERDIVEN — 20 kademe, adim basina ~1.63x.
 *
 * NEDEN 20 VE NEDEN BU KADAR YUKARI:
 * Ilk tasarimda tepe 150.000 standart birimdi. Sonra urun verisine
 * bakildi: tek bir Fusion Reactor 200.000 standart birim, Mind Upload
 * 1.000.000. Yani oyunun son urunleri URETILEMEZ durumdaydi.
 *
 * Urun verisi aslinda tutarli: standart birim basina gelir her uruunde
 * ~700 dolar. Yani karmasiklik, urunun "buyuklugu" demek. Buradan tek
 * bir denklem cikiyor:
 *
 *     ceyreklik ciro  ~=  standart kapasite x 700 dolar
 *
 * Dunyanin en buyuk sirketlerinden biri olmak ceyrekte ~35 milyar dolar
 * ciro demek; bu da ~50 milyon standart kapasite eder. Merdivenin tepesi
 * oradan turetildi, elle secilmedi.
 *
 * SERMAYE YOGUNLUGU YUKARI DOGRU ARTAR. Geri odeme suresi 0.8 yildan
 * 1.9 yila cikar. Bu gercek: yari iletken fabrikasi dunyanin en sermaye
 * yogun uretim tesisidir, el tezgahi degildir. Kisi basi uretim de
 * 205'ten 1.200'e cikar — otomasyon emek payini duşurur.
 *
 * YUKSELTME ARTIK RP DE ISTER (tier 4'ten itibaren). Oyuncu "surekli
 * fabrika kasarak" ilerleyemesin diye: tek bir kaynak (nakit) tum
 * merdiveni acmiyor, laboratuvara da yatirim yapman gerekiyor.
 *
 * ILK UC KADEME ELLE UCUZLATILDI. Formul tier 2 icin 2.2M veriyordu ama
 * oyuncu 2M sermayeyle basliyor; ilk yukseltmeyi gorene kadar 8 ceyrek
 * beklemesi mekanigi ogrenmesini geciktiriyordu. Ikinci tezgahi almak
 * zaten ucuzdur, fabrika kurmak degil.
 *
 * ONEMLI: merdivenin uzunlugu OYUNUN HIZINI belirlemez. Tek urunle
 * tier 8'i bile dolduramazsin — talep yetmez. Asil buyume motoru urun
 * portfoyu ve kategori genislemesidir; kapasite onu TAKIP eder.
 */
export const FACILITY_TIERS: FacilityTier[] = [
    {
        level: 1,
        get name() { return t('data.capacity.workshop'); },
        capacity: 4_500,
        crew: 22,
        upgradeCost: 0,
        upgradeRP: 0,
        buildQuarters: 0,
        retoolingRatio: 0.65,
        opexPerQuarter: 135_000,
        unitCostMultiplier: 1.150,
        yieldRate: 0.9000,
        brandCeiling: 22,
        brandFloor: 5,
        qualityCeiling: 2,
        get description() { return t('data.capacity.aRentedFloorWithHand'); },
    },
    {
        level: 2,
        get name() { return t('data.capacity.smallAssemblyLine'); },
        capacity: 7_350,
        crew: 32,
        upgradeCost: 1_800_000,
        upgradeRP: 0,
        buildQuarters: 1,
        retoolingRatio: 0.65,
        opexPerQuarter: 213_000,
        unitCostMultiplier: 1.106,
        yieldRate: 0.9052,
        brandCeiling: 26,
        brandFloor: 8,
        qualityCeiling: 2,
        get description() { return t('data.capacity.oneRealLineWithA'); },
    },
    {
        level: 3,
        get name() { return t('data.capacity.assemblyPlant'); },
        capacity: 12_000,
        crew: 48,
        upgradeCost: 3_500_000,
        upgradeRP: 0,
        buildQuarters: 1,
        retoolingRatio: 0.65,
        opexPerQuarter: 337_000,
        unitCostMultiplier: 1.064,
        yieldRate: 0.9103,
        brandCeiling: 30,
        brandFloor: 10,
        qualityCeiling: 3,
        get description() { return t('data.capacity.aProperPlantWithShifts'); },
    },
    {
        level: 4,
        get name() { return t('data.capacity.expandedPlant'); },
        capacity: 19_600,
        crew: 72,
        upgradeCost: 6_500_000,
        upgradeRP: 28_600,
        buildQuarters: 1,
        retoolingRatio: 0.68,
        opexPerQuarter: 532_000,
        unitCostMultiplier: 1.024,
        yieldRate: 0.9155,
        brandCeiling: 34,
        brandFloor: 12,
        qualityCeiling: 3,
        get description() { return t('data.capacity.secondHallSecondShiftScrap'); },
    },
    {
        level: 5,
        get name() { return t('data.capacity.regionalPlant'); },
        capacity: 32_000,
        crew: 108,
        upgradeCost: 12_200_000,
        upgradeRP: 46_400,
        buildQuarters: 2,
        retoolingRatio: 0.7,
        opexPerQuarter: 841_000,
        unitCostMultiplier: 0.985,
        yieldRate: 0.9206,
        brandCeiling: 38,
        brandFloor: 14,
        qualityCeiling: 4,
        get description() { return t('data.capacity.suppliesAWholeRegionOn'); },
    },
    {
        level: 6,
        get name() { return t('data.capacity.dualLinePlant'); },
        capacity: 52_200,
        crew: 160,
        upgradeCost: 21_600_000,
        upgradeRP: 71_400,
        buildQuarters: 2,
        retoolingRatio: 0.75,
        opexPerQuarter: 1_330_000,
        unitCostMultiplier: 0.947,
        yieldRate: 0.9258,
        brandCeiling: 43,
        brandFloor: 16,
        qualityCeiling: 4,
        get description() { return t('data.capacity.twoIndependentLinesOneCan'); },
    },
    {
        level: 7,
        get name() { return t('data.capacity.automatedPlant'); },
        capacity: 85_300,
        crew: 238,
        upgradeCost: 38_500_000,
        upgradeRP: 121_000,
        buildQuarters: 2,
        retoolingRatio: 0.75,
        opexPerQuarter: 2_100_000,
        unitCostMultiplier: 0.911,
        yieldRate: 0.9309,
        brandCeiling: 47,
        brandFloor: 18,
        qualityCeiling: 5,
        get description() { return t('data.capacity.robotsOnTheFloorFewer'); },
    },
    {
        level: 8,
        get name() { return t('data.capacity.advancedFab'); },
        capacity: 139_000,
        crew: 354,
        upgradeCost: 68_000_000,
        upgradeRP: 200_000,
        buildQuarters: 2,
        retoolingRatio: 0.76,
        opexPerQuarter: 3_310_000,
        unitCostMultiplier: 0.876,
        yieldRate: 0.9361,
        brandCeiling: 52,
        brandFloor: 20,
        qualityCeiling: 5,
        get description() { return t('data.capacity.cleanRoomsAndTolerancesYour'); },
    },
    {
        level: 9,
        get name() { return t('data.capacity.megafactory'); },
        capacity: 227_000,
        crew: 526,
        upgradeCost: 121_000_000,
        upgradeRP: 321_000,
        buildQuarters: 3,
        retoolingRatio: 0.78,
        opexPerQuarter: 5_230_000,
        unitCostMultiplier: 0.843,
        yieldRate: 0.9413,
        brandCeiling: 56,
        brandFloor: 23,
        qualityCeiling: 6,
        get description() { return t('data.capacity.theSitePeopleFlyIn'); },
    },
    {
        level: 10,
        get name() { return t('data.capacity.integratedComplex'); },
        capacity: 371_000,
        crew: 784,
        upgradeCost: 216_000_000,
        upgradeRP: 514_000,
        buildQuarters: 3,
        retoolingRatio: 0.78,
        opexPerQuarter: 8_260_000,
        unitCostMultiplier: 0.811,
        yieldRate: 0.9464,
        brandCeiling: 61,
        brandFloor: 25,
        qualityCeiling: 6,
        get description() { return t('data.capacity.componentsMadeInHouseYou'); },
    },
    {
        level: 11,
        get name() { return t('data.capacity.continentalHub'); },
        capacity: 606_000,
        crew: 1_170,
        upgradeCost: 384_000_000,
        upgradeRP: 857_000,
        buildQuarters: 3,
        retoolingRatio: 0.8,
        opexPerQuarter: 13_100_000,
        unitCostMultiplier: 0.780,
        yieldRate: 0.9516,
        brandCeiling: 65,
        brandFloor: 28,
        qualityCeiling: 7,
        get description() { return t('data.capacity.severalPlantsRunAsOne'); },
    },
    {
        level: 12,
        get name() { return t('data.capacity.precisionFoundry'); },
        capacity: 990_000,
        crew: 1_740,
        upgradeCost: 682_000_000,
        upgradeRP: 1_360_000,
        buildQuarters: 3,
        retoolingRatio: 0.8,
        opexPerQuarter: 20_600_000,
        unitCostMultiplier: 0.750,
        yieldRate: 0.9567,
        brandCeiling: 70,
        brandFloor: 30,
        qualityCeiling: 7,
        get description() { return t('data.capacity.tolerancesMeasuredInMicronsThis'); },
    },
    {
        level: 13,
        get name() { return t('data.capacity.roboticMegaline'); },
        capacity: 1_620_000,
        crew: 2_590,
        upgradeCost: 1_220_000_000,
        upgradeRP: 2_210_000,
        buildQuarters: 4,
        retoolingRatio: 0.82,
        opexPerQuarter: 32_700_000,
        unitCostMultiplier: 0.722,
        yieldRate: 0.9619,
        brandCeiling: 74,
        brandFloor: 33,
        qualityCeiling: 8,
        get description() { return t('data.capacity.linesThatReconfigureThemselvesBetween'); },
    },
    {
        level: 14,
        get name() { return t('data.capacity.industrialCampus'); },
        capacity: 2_640_000,
        crew: 3_840,
        upgradeCost: 2_150_000_000,
        upgradeRP: 3_570_000,
        buildQuarters: 4,
        retoolingRatio: 0.82,
        opexPerQuarter: 51_500_000,
        unitCostMultiplier: 0.694,
        yieldRate: 0.9671,
        brandCeiling: 79,
        brandFloor: 35,
        qualityCeiling: 8,
        get description() { return t('data.capacity.aCityBuiltAroundProduction'); },
    },
    {
        level: 15,
        get name() { return t('data.capacity.nationalNetwork'); },
        capacity: 4_310_000,
        crew: 5_720,
        upgradeCost: 3_830_000_000,
        upgradeRP: 5_780_000,
        buildQuarters: 4,
        retoolingRatio: 0.84,
        opexPerQuarter: 81_400_000,
        unitCostMultiplier: 0.668,
        yieldRate: 0.9722,
        brandCeiling: 83,
        brandFloor: 38,
        qualityCeiling: 9,
        get description() { return t('data.capacity.everyMajorRegionHasA'); },
    },
    {
        level: 16,
        get name() { return t('data.capacity.adaptiveGigaplant'); },
        capacity: 7_030_000,
        crew: 8_500,
        upgradeCost: 6_780_000_000,
        upgradeRP: 9_280_000,
        buildQuarters: 5,
        retoolingRatio: 0.85,
        opexPerQuarter: 128_000_000,
        unitCostMultiplier: 0.642,
        yieldRate: 0.9774,
        brandCeiling: 88,
        brandFloor: 40,
        qualityCeiling: 9,
        get description() { return t('data.capacity.aPlantThatRetoolsItself'); },
    },
    {
        level: 17,
        get name() { return t('data.capacity.autonomousComplex'); },
        capacity: 11_500_000,
        crew: 12_700,
        upgradeCost: 12_100_000_000,
        upgradeRP: 15_000_000,
        buildQuarters: 5,
        retoolingRatio: 0.85,
        opexPerQuarter: 203_000_000,
        unitCostMultiplier: 0.618,
        yieldRate: 0.9825,
        brandCeiling: 92,
        brandFloor: 43,
        qualityCeiling: 10,
        get description() { return t('data.capacity.runsLightsOutPeopleSupervise'); },
    },
    {
        level: 18,
        get name() { return t('data.capacity.continentalNetwork'); },
        capacity: 18_800_000,
        crew: 18_900,
        upgradeCost: 21_600_000_000,
        upgradeRP: 24_300_000,
        buildQuarters: 5,
        retoolingRatio: 0.86,
        opexPerQuarter: 321_000_000,
        unitCostMultiplier: 0.594,
        yieldRate: 0.9877,
        brandCeiling: 96,
        brandFloor: 45,
        qualityCeiling: 10,
        get description() { return t('data.capacity.continentalNetworksLinkedIntoOne'); },
    },
    {
        level: 19,
        get name() { return t('data.capacity.globalNetwork'); },
        capacity: 30_600_000,
        crew: 28_000,
        upgradeCost: 37_900_000_000,
        upgradeRP: 40_000_000,
        buildQuarters: 6,
        retoolingRatio: 0.88,
        opexPerQuarter: 506_000_000,
        unitCostMultiplier: 0.572,
        yieldRate: 0.9928,
        brandCeiling: 98,
        brandFloor: 48,
        qualityCeiling: 10,
        get description() { return t('data.capacity.everythingEverywhereAsASingle'); },
    },
    {
        level: 20,
        get name() { return t('data.capacity.planetaryIndustrialBase'); },
        capacity: 50_000_000,
        crew: 41_700,
        upgradeCost: 67_900_000_000,
        upgradeRP: 64_300_000,
        buildQuarters: 6,
        retoolingRatio: 0.9,
        opexPerQuarter: 800_000_000,
        unitCostMultiplier: 0.550,
        yieldRate: 0.9980,
        brandCeiling: 100,
        brandFloor: 50,
        qualityCeiling: 10,
        get description() { return t('data.capacity.theIndustrialBaseACountry'); },
    },
];

/**
 * Geriye donuk uyum icin duran varsayilan. Gercek deger kademenin
 * kendi `retoolingRatio` alanindadir.
 */
export const RETOOLING_CAPACITY_RATIO = 0.65;

/** Insaati iptal edersen paranin ne kadarini geri alirsin. */
export const BUILD_CANCEL_REFUND = 0.40;

export const MAX_TIER_LEVEL = FACILITY_TIERS.length;

// ============================================================================
//  YARDIMCILAR
// ============================================================================

/** Kademe numarasindan kademe. Sinir disi degerler kirpilir. */
export const getTier = (level: number | undefined | null): FacilityTier => {
    const clamped = Math.min(MAX_TIER_LEVEL, Math.max(1, Math.floor(level || 1)));
    return FACILITY_TIERS[clamped - 1];
};

/** Bir sonraki kademe. Tepedeysen undefined. */
export const getNextTier = (level: number | undefined | null): FacilityTier | undefined => {
    const current = getTier(level).level;
    return current >= MAX_TIER_LEVEL ? undefined : FACILITY_TIERS[current];
};

/**
 * O anki kullanilabilir kapasite (standart birim).
 * Insaat varsa retooling yuzunden kirpilir.
 */
export const effectiveCapacity = (level: number, isBuilding: boolean): number => {
    const tier = getTier(level);
    return Math.floor(tier.capacity * (isBuilding ? tier.retoolingRatio : 1));
};

/**
 * Personel orani (0-1).
 *
 * Ekip yetmiyorsa uretim orantili duser. Fazla calisan uretimi
 * ARTIRMAZ — maasini odersin, hicbir sey uretmez. Iki tarafli hata.
 */
export const staffingRatio = (employeeCount: number, level: number): number => {
    const tier = getTier(level);
    if (tier.crew <= 0) return 1;
    return Math.min(1, Math.max(0, (employeeCount || 0) / tier.crew));
};

/**
 * Bu ceyrek gercekten uretilebilecek STANDART birim.
 * Fire dahil edilmis haldedir — yani eline gecen saglam adet.
 */
export const availableStandardUnits = (
    employeeCount: number,
    level: number,
    isBuilding: boolean,
): number => {
    const tier = getTier(level);
    const raw = effectiveCapacity(level, isBuilding) * staffingRatio(employeeCount, level);
    return Math.floor(raw * tier.yieldRate);
};

/**
 * STANDART birim <-> URUN adedi cevrimi.
 *
 * Karmasiklik 50 = standart. Karmasikligi 100 olan urunun bir adedi
 * iki standart birim yer. Boylece Fusion Reactor ile telefon ayni
 * tesisten cok farkli adetlerde cikar.
 */
export const STANDARD_COMPLEXITY = 50;

export const unitsToStandard = (units: number, complexity: number): number =>
    Math.max(0, units) * (Math.max(1, complexity || STANDARD_COMPLEXITY) / STANDARD_COMPLEXITY);

export const standardToUnits = (standard: number, complexity: number): number =>
    Math.floor(Math.max(0, standard) / (Math.max(1, complexity || STANDARD_COMPLEXITY) / STANDARD_COMPLEXITY));

/** Tek bir urun tesisin tamamini kullansa kac adet cikardi. */
export const maxUnitsForProduct = (
    employeeCount: number,
    level: number,
    isBuilding: boolean,
    complexity: number,
): number => standardToUnits(availableStandardUnits(employeeCount, level, isBuilding), complexity);

// ============================================================================
//  KADRO — bu dosyadan TASINDI
// ============================================================================
//  Maas, moral, ise alim, tazminat, deneyim, fazla mesai ve etkinlikler
//  artik core/market/workforce.ts icinde. Burada tutulmalari kademe
//  tablosuyla karisiyordu; ikisi ayri konu.
// ============================================================================

// ============================================================================
//  KULLANIM ORANI — oyuncunun bakacagi tek sayi
// ============================================================================
//  %60 alti: bos demire para oduyorsun, sabit gider seni yiyor
//  %95 ustu: yastigin yok, talep ziplarsa stok tukenir ve marka yanar
// ============================================================================

export const UTILIZATION_LOW = 60;
export const UTILIZATION_HIGH = 95;

export type UtilizationVerdict = 'idle' | 'healthy' | 'tight';

export const utilizationVerdict = (percent: number): UtilizationVerdict => {
    if (percent < UTILIZATION_LOW) return 'idle';
    if (percent > UTILIZATION_HIGH) return 'tight';
    return 'healthy';
};

export const UTILIZATION_NOTES: Record<UtilizationVerdict, string> = {
    idle: 'You are paying for plant you are not using. Either sell more or you are burning fixed cost for nothing.',
    healthy: 'Capacity and demand are in balance. This is where you want to sit.',
    tight: 'No slack left. Any jump in demand becomes a stockout, and stockouts burn Brand Value.',
};
