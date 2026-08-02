// src/core/reportTypes.ts
//
// ============================================================================
//  ÇEYREK RAPORU — tek gerçek kaynak
// ============================================================================
//
//  NEDEN BU DOSYA VAR: Projede birbirinden habersiz ÜÇ finans hesabı vardı:
//
//    1. useGameStore.advanceMonth      -> parayi gercekten hareket ettiren
//    2. useStatsStore.recalculateFinancials -> ekranda gorunen ozet
//    3. useFinancialReportLogic        -> rapor ekraninin kendi tahmini
//                                        (fabrika giderini 30.000.000/adet
//                                         sayiyordu!)
//
//  Ucu de farkli sayi uretiyordu. Oyuncu raporda gordugu rakamla sermayeden
//  dusen rakami eslestiremiyordu — yani oyun ogretilemez haldeydi.
//
//  Artik motor bir QuarterReport uretir, TUM rapor ekranlari bunu okur.
//  Yeni bir gider kalemi eklerken: once motora ekle, sonra buraya.
//
// ============================================================================

/** Tek bir ürünün çeyreklik performansı. */
export interface ProductQuarterLine {
    id: string;
    name: string;
    /** Pazar payi hesabi icin gerekli — bkz. core/market/productMarkets.ts */
    category?: string;
    /** Bu çeyrek üretilen adet */
    produced: number;
    /** Bu çeyrek satılan adet */
    sold: number;
    /** Çeyrek sonunda elde kalan stok */
    stock: number;
    /** Satılan mal hasılatı */
    revenue: number;
    /** Bu ürüne yazılan toplam gider (üretim + pazarlama + depo) */
    expense: number;
    /** revenue - expense */
    profit: number;
    /** Birim satış fiyatı */
    unitPrice: number;
    /** Birim üretim maliyeti */
    unitCost: number;
    /** Bu ürüne bu çeyrek harcanan pazarlama BÜTÇESİ (birim başına değil) */
    marketingBudget: number;
    /**
     * Satış oranı: satılan / (stok + üretim).
     * Oyuncunun en çok ihtiyaç duyduğu sayı — "ürettiğimin ne kadarı satıldı".
     */
    sellThrough: number;
    /** Üretilip satılamayan adet (stoğa eklenen) */
    unsold: number;
    /** Üretim hattında fire olan adet — maliyeti ödendi, satılamaz */
    scrapped?: number;

    // --- Pazar ---
    /** Pazarin bu urunden istedigi adet. Uretimden BAGIMSIZ. */
    marketDemandUnits?: number;
    /** Kategorideki pazar payi (yuzde) */
    marketShare?: number;
    /** Talep olup da mal olmadigi icin karsilanamayan adet — rakibe giden musteri */
    unmetDemand?: number;
}

/** Gelir tablosunun gider kalemleri. Hepsi motorda gerçekten tahsil edilir. */
export interface ExpenseLines {
    /** Satılan Malın Maliyeti — DİKKAT: üretime yazılır, satışa değil. */
    cogs: number;
    /** Çeyreklik pazarlama bütçesi — satıştan bağımsız, sabit gider */
    marketing: number;
    /** Satılamayan stoğun depolama maliyeti (birim başına $5/çeyrek) */
    storage: number;
    /** Tesisin çeyreklik sabit işletme gideri — üretsen de üretmesen de */
    factoryOverhead: number;
    /** Üretim personelinin maaşı */
    wages: number;
    /** İşe alım bedeli (headhunter, eğitim, kurulum) */
    hiring: number;
    /** İşten çıkarma tazminatı */
    severance: number;
    /** Araştırmacı maaşları (kişi başı $500K/çeyrek) */
    rnd: number;
    /** Genel sabit giderler */
    fixed: number;
    /** Şirket borcunun faizi */
    interest: number;
}

/**
 * Bir çeyreğin tam finansal fotoğrafı.
 * `useGameStore.lastQuarterReport` içinde saklanır.
 */
export interface QuarterReport {
    /** Rapor dönemi etiketi, ör. "Q3 · Year 2" */
    periodLabel: string;
    /** Kaç ay ilerlendi (genelde 3) */
    months: number;

    // --- Gelir tablosu ---
    revenue: number;
    expenses: ExpenseLines;
    totalExpenses: number;
    /** revenue - cogs */
    grossProfit: number;
    /** Faaliyet giderleri: pazarlama + depo + fabrika + Ar-Ge + sabit */
    operatingExpenses: number;
    /** Faiz ve vergi öncesi kâr */
    ebit: number;
    netProfit: number;
    /** netProfit / revenue (yüzde) */
    netMargin: number;
    /** grossProfit / revenue (yüzde) */
    grossMargin: number;

    // --- Operasyon ---
    unitsProduced: number;
    unitsSold: number;
    endingInventory: number;
    /** Tüm ürünler için toplam satış oranı */
    sellThrough: number;

    // --- Bakiyeler ---
    endingCapital: number;
    endingCash: number;
    /** Bu çeyrek sonunda biriken toplam Ar-Ge puanı */
    researchPoints: number;
    /** Bu çeyrek kazanılan Ar-Ge puanı */
    researchGained: number;

    // --- Olaylar ---
    operationalSetback: boolean;
    setbackMessage: string;
    lostUnits: number;
    lostRevenue: number;
    employeeMorale: number;

    // --- Pazar ---
    /** Tum urunler icin pazarin istedigi toplam adet */
    totalMarketDemand: number;
    /** Mal yetmedigi icin karsilanamayan toplam talep */
    totalUnmetDemand: number;
    /** Ceyrek sonundaki marka degeri */
    brandValue: number;
    /** Bu ceyrek markadaki degisim (+/-) */
    brandChange: number;
    /**
     * Markayi yerinde tutmak icin gereken ceyreklik pazarlama butcesi.
     * Bunun altinda kalirsan marka erir, ustune cikarsan birikir.
     */
    brandMaintenance: number;
    /** Tesis kademesinin marka tavani — burada takilirsan sorun uretimde */
    brandCeiling: number;

    // --- Tesis ve kadro ---
    /** Kademe numarasi (1-11) */
    facilityTier: number;
    facilityName: string;
    /** Kademenin tam kapasitesi (standart birim) */
    facilityCapacity: number;
    /** Bu ceyrek gercekten kullanilan standart birim */
    capacityUsed: number;
    /** capacityUsed / kullanilabilir kapasite (yuzde) */
    utilization: number;
    /** Insaat suruyor mu — evetse kapasite %65'e dusmustur */
    isRetooling: boolean;
    buildTargetTier?: number;
    buildQuartersRemaining?: number;

    /** Ceyrek sonundaki calisan sayisi */
    headcount: number;
    /** Kapasiteyi %100 calistirmak icin gereken ekip */
    crewRequired: number;
    /** Bu ceyrek ise baslayanlar (yari verimle calistilar) */
    hiresArrived: number;
    /** Gelecek ceyrek gelecek olanlar */
    hiresQueued: number;
    /** Bu ceyrek isten cikarilanlar */
    layoffs: number;
    /** Kendi ayrilanlar */
    attrition: number;
    /** Ise alim tavani yuzunden alinamayan kisi sayisi */
    hiresBlocked?: number;
    /** Maasin tek basina tasidigi moral seviyesi */
    moraleWageTarget?: number;
    /** Bu ceyrekki moral degisimi */
    moraleChange?: number;
    /** Moralin uretime carpani */
    moraleEfficiency?: number;
    /** Odenen maasin piyasaya orani */
    salaryRatio?: number;
    /** Fazla mesai acik miydi */
    overtime?: boolean;

    // --- Kırılım ---
    products: ProductQuarterLine[];
}

/** Boş rapor — henüz hiç çeyrek geçilmemişken UI'ın patlamaması için. */
export const EMPTY_QUARTER_REPORT: QuarterReport = {
    periodLabel: '—',
    months: 0,
    revenue: 0,
    expenses: {
        cogs: 0, marketing: 0, storage: 0, factoryOverhead: 0,
        wages: 0, hiring: 0, severance: 0, rnd: 0, fixed: 0, interest: 0,
    },
    totalExpenses: 0,
    grossProfit: 0,
    operatingExpenses: 0,
    ebit: 0,
    netProfit: 0,
    netMargin: 0,
    grossMargin: 0,
    unitsProduced: 0,
    unitsSold: 0,
    endingInventory: 0,
    sellThrough: 0,
    endingCapital: 0,
    endingCash: 0,
    researchPoints: 0,
    researchGained: 0,
    operationalSetback: false,
    setbackMessage: '',
    lostUnits: 0,
    lostRevenue: 0,
    employeeMorale: 0,
    totalMarketDemand: 0,
    totalUnmetDemand: 0,
    brandValue: 0,
    brandChange: 0,
    brandMaintenance: 0,
    brandCeiling: 100,

    facilityTier: 1,
    facilityName: 'Workshop',
    facilityCapacity: 0,
    capacityUsed: 0,
    utilization: 0,
    isRetooling: false,

    headcount: 0,
    crewRequired: 0,
    hiresArrived: 0,
    hiresQueued: 0,
    layoffs: 0,
    attrition: 0,
    hiresBlocked: 0,
    moraleWageTarget: 70,
    moraleChange: 0,
    moraleEfficiency: 1,
    salaryRatio: 1,
    overtime: false,
    products: [],
};

/**
 * Diskten gelen raporu guvenli hale getirir.
 *
 * NEDEN GEREKLI: `lastQuarterReport` AsyncStorage'a kaydediliyor. Rapora yeni
 * bir alan eklendiginde ESKI kayitlarda o alan yok, ve UI `undefined.toFixed()`
 * diyerek patliyor. (Tam olarak bu yasandi: brandChange eklendikten sonra eski
 * kayitla acilan ceyrek raporu render hatasi verdi.)
 *
 * KURAL: lastQuarterReport'u okuyan HER yer once bunu cagirmali.
 * Yeni alan eklerken EMPTY_QUARTER_REPORT'a da eklemen yeterli.
 */
export const normalizeQuarterReport = (
    raw: Partial<QuarterReport> | null | undefined,
): QuarterReport | null => {
    if (!raw) return null;

    return {
        ...EMPTY_QUARTER_REPORT,
        ...raw,
        // Ic ice objeler yayilmayla birlesmez, elle tamamlanmali.
        expenses: { ...EMPTY_QUARTER_REPORT.expenses, ...(raw.expenses ?? {}) },
        products: (raw.products ?? []).map(p => ({
            ...p,
            marketDemandUnits: p.marketDemandUnits ?? 0,
            marketShare: p.marketShare ?? 0,
            unmetDemand: p.unmetDemand ?? 0,
            marketingBudget: p.marketingBudget ?? 0,
            scrapped: p.scrapped ?? 0,
        })),
    };
};

/**
 * Gelir tablosu satırlarının oyuncuya gösterilecek aciklamalari.
 *
 * Amac: oyuncunun "bu kalem nereden geliyor" sorusunu ekranda cevaplamak.
 * Motor formulu degisirse buradaki metin de degismeli.
 */
export const EXPENSE_EXPLANATIONS: Record<keyof ExpenseLines, string> = {
    cogs: 'Charged on units PRODUCED, not sold. Overproduce and you burn cash on goods sitting in a warehouse.',
    wages: 'Production headcount, charged every quarter whether the line runs or not. This is why hiring is a real decision and not a free lever.',
    hiring: 'Recruiting, onboarding and equipping new people — roughly 25% of a year of their pay. New hires arrive next quarter and work at half speed for their first one.',
    severance: 'One quarter of pay per person let go. The cash cost lands immediately; the morale damage lasts longer, and it is worse if you just reported a profit.',
    marketing: 'A fixed quarterly budget, charged whether you sell or not. What matters is your budget against the market benchmark: match it and you own roughly half the attention in your category. Beating the benchmark builds Brand Value; falling under the maintenance level lets it erode.',
    storage: '$5 per unsold unit, every quarter. This is what overproduction actually costs you.',
    factoryOverhead: 'Your facility\'s fixed running cost, paid whether the line runs or not. This is the line that punishes idle capacity — a bigger tier is cheaper per unit but brutal if you cannot fill it.',
    rnd: '$500K per researcher per quarter. Buys Research Points, which is the only way to improve products.',
    fixed: 'General running costs. Independent of how much you produce.',
    interest: 'Interest on outstanding company debt.',
};
