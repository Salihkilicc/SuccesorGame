// src/core/market/productMarkets.ts
//
// ============================================================================
//  ÜRÜN PAZARLARI — pay sisteminin veri temeli
// ============================================================================
//
//  TASARIM KARARLARI (tartisilarak alindi, degistirmeden once oku):
//
//  1) PAZAR KATEGORIDE, URUNDE DEGIL.
//     16 urun var ama 4 kategori. Ayni kategorideki tum urunlerin
//     (seninkiler dahil) ayni pastadan pay aldigi anlamina gelir.
//     Yani iki telefonun varsa birbirinin payini yer — bu bilincli.
//
//  2) RAKIPLER GERCEK SIRKETLER.
//     Soyut "rakip skoru" yerine borsada zaten var olan sirketler
//     (features/assets/data/marketData.ts) kullaniliyor. Boylece
//     satin alma ile pazar payi ayni sisteme baglanir: Pear'i alirsan
//     Pear'in payini devralirsin.
//     `stockId` alani o baglantiyi kurar.
//
//  3) PAY ELLE YAZILIYOR, MARKET CAP'TEN TURETILMIYOR.
//     Pear 3 trilyon, oyuncu 3 milyon — orandan pay turetmek anlamsiz
//     sonuc verir ve dengelemesi imkansizdir. Market cap satin alma
//     fiyati olarak kalir, pay ayri bir ayar dugmesidir.
//
//  4) BOLGE ALANI SIMDIDEN VAR.
//     Su an tek bolge: US. Dunyaya acilma ileride eklenirse veri
//     eklemek yeter, motoru yeniden yazmak gerekmez.
//
//  DENGE NOTU: Buradaki `sizeUnitsPerQuarter` degerleri gercek ABD
//  rakamlari DEGIL, oyun olcegine indirilmis degerlerdir. Gercek ABD
//  akilli telefon pazari ceyrekte ~35 milyon adet; o olcekte oyuncunun
//  payi %0.0006 cikar ve hic kipirdamaz.
//
//  OLCEK NEREDEN GELIYOR: capraz kisit CALISAN BASINA CIRO'dur. Gercek
//  dunyada tuketici elektroniginde yilda 200 bin - 2.4 milyon dolar
//  arasi. Oyunda bir calisan ceyrekte ~205 adet uretir; 600 dolarlik
//  urunde bu yilda ~490 bin dolar eder — inandirici bant.
//
//  Bu verimlilik sabitlenince pazar boyutu da sabitlenir: baslangicta
//  20 calisanlik bir sirket ~4.500 adet uretebilir ve baslangic payi
//  (~%0.45) o adede denk gelmelidir. 4.500 / 0.0045 = 1.000.000.
//
//  ONCEDEN 150.000'di ve calisan basi uretim 10 adetti; o rakamlarla
//  calisan basina ciro yilda 24 bin dolar cikiyordu, yani maas gideri
//  tahsil edilemiyordu. Oyunun maas odemiyor olmasi bir unutkanlik
//  degil, bu olcek hatasinin sonucuydu.
//
// ============================================================================

/** Ürün kategorileri. unlockableProductsData.ts ile birebir aynı olmalı. */
export type MarketCategory = 'Consumer' | 'Robotics' | 'Deep Tech' | 'Bio-Tech';

export const MARKET_CATEGORIES: MarketCategory[] = [
    'Consumer',
    'Robotics',
    'Deep Tech',
    'Bio-Tech',
];

/** Şu an tek bölge. Dünyaya açılma ileride buraya eklenir. */
export type MarketRegion = 'US';

export interface MarketCompetitor {
    /** features/assets/data/marketData.ts icindeki id — satin alma baglantisi */
    stockId: string;
    name: string;
    symbol: string;
    /** Bu kategorideki pazar payi (yuzde) */
    share: number;
    /**
     * Rekabet gucu: 0-100.
     * Ileride pay hareketini bu belirleyecek (yuksek olan pay kazanir).
     * Su an sadece gosterim ve siralama icin.
     */
    strength: number;
}

export interface ProductMarket {
    category: MarketCategory;
    region: MarketRegion;
    /** Ceyrek basina toplam talep (adet) */
    sizeUnitsPerQuarter: number;
    /** Ceyreklik buyume orani (yuzde). Negatif = daralan pazar. */
    growthPerQuarter: number;
    /**
     * TEMEL PAY (yuzde) — kalibrasyonun tek dugmesi.
     *
     * "Hicbir avantaji olmayan sade bir urun bu pazardan ne kadar pay alir?"
     * Onerilen fiyattan satan, pazarlamasi olmayan, kalitesi 1 olan bir urun
     * yaklasik bu payi alir.
     *
     * Rakiplerin toplam cekiciligi bu sayidan TURETILIR (bkz. attraction.ts),
     * yani rakiplere ayri ayri guc atamana gerek yok. Pazari zorlastirmak
     * istersen bu sayiyi kucult, kolaylastirmak istersen buyut.
     */
    baselineShare: number;
    /**
     * Fiyat esnekligi. Yuksek = fiyata duyarli pazar.
     * Emtiada yuksek, lukste dusuk olur.
     */
    priceElasticity: number;
    /**
     * KIYAS PAZARLAMA BUTCESI (ceyreklik, dolar) — kucuk oyuncu icin TABAN.
     *
     * "Bu pazarda sesini duyurmak icin ne kadar harcamak gerekir?"
     * Bu kadar harcarsan ses payin ~%50 olur (bkz. attraction.ts).
     *
     * Gercek kiyas, kendi cironla birlikte BUYUR: buyudukce payi korumak
     * pahalilasir. Taban sadece daha kucukken gecerli olan alt sinirdir.
     */
    marketingBenchmark: number;
    /** Oyuncuya gosterilecek kisa aciklama */
    description: string;
    competitors: MarketCompetitor[];
}

// ============================================================================
//  PAZARLAR
// ============================================================================
//  Rakip paylari toplami bilincli olarak %100'un ALTINDA birakildi.
//  Kalan kisim "digerleri + sen" demektir; oyuncunun buyuyecek yeri olur.
// ============================================================================

export const PRODUCT_MARKETS: ProductMarket[] = [
    {
        category: 'Consumer',
        region: 'US',
        // Telefon, laptop, hoparlor, VR, konsol. En yuksek hacim, en dusuk karmasiklik.
        sizeUnitsPerQuarter: 1_000_000,
        growthPerQuarter: 1.5,
        baselineShare: 0.15,
        // Fiyata cok duyarli: telefon alicisi 50 dolar farka bakar.
        priceElasticity: 1.4,
        marketingBenchmark: 150_000,
        description: 'Phones, laptops, speakers and home entertainment. High volume, brutal competition.',
        competitors: [
            { stockId: 'tech_pear', name: 'Pear Inc.', symbol: 'PEAR', share: 31.0, strength: 92 },
            { stockId: 'tech_micro', name: 'Microhard', symbol: 'MCRH', share: 24.0, strength: 85 },
            { stockId: 'tech_face', name: 'FaceSpace', symbol: 'FACE', share: 13.5, strength: 68 },
            { stockId: 'tech_intel', name: 'Intell Inside', symbol: 'INTC', share: 9.0, strength: 54 },
            { stockId: 'tech_spot', name: 'SpotifyStream', symbol: 'SPOT', share: 4.5, strength: 38 },
            { stockId: 'tech_start', name: 'StartApp IO', symbol: 'STRT', share: 1.2, strength: 22 },
        ],
    },
    {
        category: 'Robotics',
        region: 'US',
        // Drone, ev robotu, dagitim aracisi, endustriyel kol, elektrikli araba.
        sizeUnitsPerQuarter: 270_000,
        growthPerQuarter: 3.0,
        baselineShare: 0.25,
        // Orta duyarlilik: performans fiyattan once gelir.
        priceElasticity: 1.1,
        marketingBenchmark: 240_000,
        description: 'Drones, autonomous vehicles and industrial automation. Growing fast, capital hungry.',
        competitors: [
            { stockId: 'ind_edison', name: 'Edison Motors', symbol: 'TSLA', share: 27.0, strength: 88 },
            { stockId: 'ind_cat', name: 'Catarpillar', symbol: 'CAT', share: 18.0, strength: 74 },
            { stockId: 'ind_gm', name: 'General Motors Parody', symbol: 'GMP', share: 14.0, strength: 61 },
            { stockId: 'ind_spacey', name: 'SpaceY', symbol: 'SPCY', share: 8.0, strength: 57 },
            { stockId: 'ind_solar', name: 'SolarCity 2.0', symbol: 'RUN', share: 2.5, strength: 29 },
        ],
    },
    {
        category: 'Deep Tech',
        region: 'US',
        // eVTOL, kuantum, fuzyon, zihin yukleme. Dusuk hacim, cok yuksek karmasiklik.
        sizeUnitsPerQuarter: 34_000,
        growthPerQuarter: 6.0,
        baselineShare: 0.40,
        // Fiyat neredeyse onemsiz; alici sayisi az, ihtiyac kritik.
        priceElasticity: 0.7,
        marketingBenchmark: 700_000,
        description: 'Frontier technology. Tiny volumes, enormous margins, only a handful of players.',
        competitors: [
            { stockId: 'tech_gpt', name: 'OpenAI-ish', symbol: 'AI', share: 29.0, strength: 90 },
            { stockId: 'tech_chip', name: 'Novidia', symbol: 'CHIP', share: 26.0, strength: 94 },
            { stockId: 'ind_lmt', name: 'Lockheed Marvin', symbol: 'LMT', share: 16.0, strength: 71 },
            { stockId: 'tech_chat', name: 'ChatAI Corp', symbol: 'CHAT', share: 11.0, strength: 63 },
            { stockId: 'ind_spce', name: 'SpaceZ', symbol: 'SPCE', share: 4.0, strength: 35 },
        ],
    },
    {
        category: 'Bio-Tech',
        region: 'US',
        // Sibernetik uzuv, sinir baglantisi. Duzenlemeye tabi, yavas ama karli.
        sizeUnitsPerQuarter: 80_000,
        growthPerQuarter: 2.0,
        baselineShare: 0.30,
        // Duzenlemeli pazar, fiyat ikincil.
        priceElasticity: 0.9,
        marketingBenchmark: 360_000,
        description: 'Medical devices and human augmentation. Heavily regulated, slow but profitable.',
        competitors: [
            { stockId: 'health_jnj', name: 'Johnson & Swanson', symbol: 'JNJ', share: 25.0, strength: 83 },
            { stockId: 'health_pfiz', name: 'Pfizero', symbol: 'PFE', share: 21.0, strength: 79 },
            { stockId: 'health_med', name: 'MediDevice', symbol: 'MED', share: 15.5, strength: 66 },
            { stockId: 'health_cure', name: 'CureAll Corp', symbol: 'CURE', share: 12.0, strength: 58 },
            { stockId: 'health_bio', name: 'BioGen Start', symbol: 'BIO', share: 2.0, strength: 26 },
        ],
    },
];

// ============================================================================
//  YARDIMCILAR
// ============================================================================

const MARKET_BY_CATEGORY = new Map<string, ProductMarket>(
    PRODUCT_MARKETS.map(m => [m.category, m]),
);

/** Kategoriye göre pazar. Bilinmeyen kategori için undefined. */
export const getMarket = (category: string | undefined): ProductMarket | undefined =>
    category ? MARKET_BY_CATEGORY.get(category) : undefined;

/** Rakiplerin toplam payı. Kalanı "diğerleri + oyuncu" demektir. */
export const competitorShareTotal = (market: ProductMarket): number =>
    market.competitors.reduce((sum, c) => sum + c.share, 0);

/**
 * Bir hisse senedinin hangi pazarda rakip oldugunu bulur.
 * Satin alma ekraninin "bu sirketin pazar payi" satiri icin.
 */
export const findCompetitorByStockId = (
    stockId: string,
): { market: ProductMarket; competitor: MarketCompetitor } | undefined => {
    for (const market of PRODUCT_MARKETS) {
        const competitor = market.competitors.find(c => c.stockId === stockId);
        if (competitor) return { market, competitor };
    }
    return undefined;
};

// ============================================================================
//  KATEGORİNİN DOLAR BÜYÜKLÜĞÜ
// ============================================================================
//  Oyuncunun en cok kafasini karistiran sey: "Smart Speaker 200 bin
//  kazandiriyor, Auto-Drone 2 milyon, neden?"
//
//  Cevap adet degil DOLAR. Consumer pazari ceyrekte 1 milyon adet ama
//  ortalama 600 dolar — yani ~0.6 milyar dolar. Robotics 270 bin adet
//  ama ortalama 25 bin dolar — ~6.8 milyar dolar. ON BIR KAT.
//
//  Yani ayni pazar payi Robotics'te on bir kat daha cok para eder.
//  Bu, oyunun en onemli stratejik gercegi ve hicbir ekranda
//  gorunmuyordu.
// ============================================================================

/** Kategorideki ortalama birim fiyat — dolar buyuklugunu hesaplamak icin. */
export const CATEGORY_AVERAGE_PRICE: Record<MarketCategory, number> = {
    Consumer: 600,
    Robotics: 25_000,
    'Bio-Tech': 300_000,
    'Deep Tech': 5_000_000,
};

/** Kategorinin ceyreklik DOLAR buyuklugu. */
export const marketDollarSize = (market: ProductMarket): number =>
    market.sizeUnitsPerQuarter * (CATEGORY_AVERAGE_PRICE[market.category] ?? 600);

/** Tum kategoriler, dolar buyuklugune gore siralanmis. */
export const marketsByValue = (): { market: ProductMarket; dollarSize: number }[] =>
    PRODUCT_MARKETS
        .map(m => ({ market: m, dollarSize: marketDollarSize(m) }))
        .sort((a, b) => b.dollarSize - a.dollarSize);
