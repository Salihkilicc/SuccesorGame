// @orphan-ok-symbol categoryStartingBrand - left over from the corporate-halo model; brand is anchored to share now
import { t } from '../i18n';
// src/core/market/brand.ts
//
// ============================================================================
//  MARKA — oyunun en yavaş ve en kalıcı birikimi
// ============================================================================
//
//  OYUNCUNUN SORUSU
//  ----------------
//  "en onemli mekanik bu brand value ama ona pek deginmiyoruz, cok sacma,
//   artisini cozemedim. pazar payini degistirmeli, net worthu degistirmeli."
//
//  Hakliydi. Marka VARDI ama tek yonlu bir borudan ibaretti:
//
//      pazarlama butcesi -> marka -> cekicilik -> pazar payi
//
//  Yani markayi yalnizca PARA insa ediyordu. Gercekte marka paradan cok
//  daha fazlasindan beslenir: kac kisinin urunu kullandigi, kimin satin
//  alindigi, sirketin ne kadar suredir ayakta oldugu. Ve tersine, marka
//  yalnizca satisi degil SIRKETIN DEGERINI de tasir.
//
//  BU DOSYANIN KURDUGU DONGU
//  -------------------------
//      pazarlama ─┐
//      kalite     ├─> MARKA ─┬─> cekicilik -> pazar payi ─┐
//      pazar payi ┘          ├─> degerleme carpani        │
//      devralma              └─> hisse fiyati              │
//           ↑                                              │
//           └──────────────────────────────────────────────┘
//                        (kendini besleyen halka)
//
//  Bu kasitli bir GERI BESLEME dongusudur ve oyunun bilesik buyume
//  motorudur: pay aldikca marka buyur, marka buyudukce pay almak
//  kolaylasir. Ama bilesik buyume kontrolsuz birakilirsa oyunu bitirir,
//  o yuzden uc fren var:
//
//    1) TESIS TAVANI — atolyede premium marka olamazsin (capacity.ts)
//    2) AZALAN VERIM — marka 100'e yaklastikca kazanmak zorlasir
//    3) BAKIM ESIGI  — buyudukce markayi korumak pahalilasir
//
//  ZAMAN BOYUTU: marka kasitli olarak YAVAS. Bir ceyrekte en fazla
//  birkac puan oynar. Sebebi su — oyundaki her sey (uretim, pazarlama,
//  kadro) bir ceyrekte degistirilebilir. Marka degistirilemez. Oyuncunun
//  UZUN VADELI dusunmek zorunda kaldigi tek yer burasi olmali.
//
//  NEWS BAGLANTISI: ileride haber sistemi buraya baglanacak. `BrandShock`
//  tipi ve `applyBrandShock` o yuzden simdiden burada — haber geldiginde
//  tek yapilacak sey bu fonksiyonu cagirmak olacak.
//
// ============================================================================

/** Markanin mutlak tavani. */
export const BRAND_MAX = 100;

// ============================================================================
//  1. PAZAR PAYI → MARKA
// ============================================================================
//  Bir markayi taniyor olmanin en buyuk sebebi cevrendekilerin onu
//  kullaniyor olmasidir. Pazar payi bu yuzden markanin en dogal
//  besleyicisidir ve gercek hayatta reklamdan daha guclu calisir.
//
//  Ama ANINDA degil: pazarin %30'unu bugun alsan bile insanlarin seni
//  "buyuk marka" saymasi yillar alir. O yuzden payin kendisi degil,
//  payin GECMISI onemli — bu da dogal bir gecikme yaratir.
// ============================================================================

/** Pazar payinin markaya cevrilme orani. Ceyrek basina. */
export const SHARE_TO_BRAND_RATE = 0.06;

/**
 * Pazar payinin bu ceyrek markaya katkisi.
 *
 * Payin dengeye getirdigi bir marka seviyesi vardir: pazarin %40'ini
 * elinde tutan bir sirket, hic reklam vermese bile taninir. `equilibrium`
 * o seviyedir; marka ona dogru yavasca kayar.
 *
 * KAREKOK kullaniyoruz cunku ilk %10 pay taninirlik acisindan sonraki
 * %10'dan cok daha degerlidir — sifirdan gorunur olmak, gorunurken daha
 * gorunur olmaktan zordur.
 */
export const brandFromMarketShare = (
    currentBrand: number,
    totalMarketShare: number,
): { delta: number; equilibrium: number } => {
    const share = Math.max(0, Math.min(100, totalMarketShare || 0));
    // %40 pay ~63 marka dengesi verir; %10 pay ~32.
    const equilibrium = Math.min(BRAND_MAX, Math.sqrt(share / 100) * 100);
    const delta = (equilibrium - (currentBrand || 0)) * SHARE_TO_BRAND_RATE;
    return { delta, equilibrium };
};

// ============================================================================
//  2. DEVRALMA → MARKA
// ============================================================================
//  Bir sirketi satin aldiginda onun ITIBARINI da alirsin. Gercek
//  hayattaki en net ornegi budur: kimse Instagram'i Facebook'un
//  aldigini gunluk hayatta dusunmez ama Facebook o marka gucunu
//  bilancosuna yazar.
//
//  Katki hedefin SENIN YANINDA ne kadar buyuk oldugune baglidir. Kendi
//  boyunun onda biri bir sirket markana hicbir sey katmaz; kendinden
//  buyugunu alirsan markan sicrar.
//
//  DUSMANCA DEVRALMADA YARISI: itibar transferi iyi niyet ister. Zorla
//  aldigin sirketin musterisi ve ekibi seninle gelmez.
// ============================================================================

/** Devralmanin verebilecegi en yuksek tek seferlik marka puani. */
export const ACQUISITION_BRAND_MAX = 12;

export const brandFromAcquisition = (
    targetValue: number,
    acquirerValue: number,
    hostile: boolean,
    currentBrand: number,
): number => {
    const ratio = Math.max(0, targetValue) / Math.max(1, acquirerValue);
    // Karekok: kendinden buyugunu almak buyuk katki verir ama dogrusal degil.
    const raw = Math.min(ACQUISITION_BRAND_MAX, Math.sqrt(ratio) * ACQUISITION_BRAND_MAX);
    const realized = raw * (hostile ? 0.5 : 1);
    // AZALAN VERIM: zaten guclu markaya eklemek zordur.
    const headroom = Math.max(0, (BRAND_MAX - (currentBrand || 0)) / BRAND_MAX);
    return realized * headroom;
};

// ============================================================================
//  3. ZAMAN → MARKA
// ============================================================================
//  Ayakta kalmanin kendisi bir itibardir. Yirmi yildir var olan bir
//  sirket, ayni buyuklukteki iki yillik sirketten daha guvenilirdir.
//  Cok kucuk bir katki ama BILESIKTIR ve oyuncunun sabrini odullendiren
//  tek mekanik budur.
//
//  Yalnizca KARLI ceyreklerde isler: hayatta kalmak ayri sey, zar zor
//  ayakta durmak ayri.
// ============================================================================

export const BRAND_TENURE_PER_QUARTER = 0.15;
/** Zamanla erisilebilecek en yuksek marka — tek basina yetmez. */
export const BRAND_TENURE_CAP = 45;

export const brandFromTenure = (currentBrand: number, profitable: boolean): number => {
    if (!profitable || (currentBrand || 0) >= BRAND_TENURE_CAP) return 0;
    return BRAND_TENURE_PER_QUARTER;
};

// ============================================================================
//  4. MARKA → DIŞARI
// ============================================================================

/**
 * Markanin DEGERLEME carpanina etkisi.
 *
 * Guclu marka fiyatlama gucu demektir; fiyatlama gucu marj demektir;
 * marj da carpan demektir. Piyasa bunu her zaman odullendirir — ayni
 * kari eden iki sirketten markali olani daha pahali islem gorur.
 *
 * KARESEL: dusuk markadan orta markaya cikmak degerlemeyi az oynatir,
 * orta markadan guclu markaya cikmak cok oynatir. Gercek hayatta da
 * premium algisi bir esikten sonra devreye girer.
 */
export const BRAND_VALUATION_BONUS = 0.55;

export const brandValuationMultiplier = (brandValue: number): number => {
    const b = Math.min(BRAND_MAX, Math.max(0, brandValue || 0)) / 100;
    return 1 + BRAND_VALUATION_BONUS * (b * b);
};

/**
 * Markanin HISSE OYNAKLIGINA etkisi.
 *
 * Guclu markali sirketin hissesi daha az oynar: yatirimci kotu bir
 * ceyregi "gecici" diye okur. Zayif markada ayni kotu ceyrek "bitiyor"
 * diye okunur. Buna finansta "kalite primi" denir.
 */
export const brandStabilityFactor = (brandValue: number): number => {
    const b = Math.min(BRAND_MAX, Math.max(0, brandValue || 0)) / 100;
    return 1 - 0.35 * b; // marka 100 -> oynaklik %35 daha az
};

// ============================================================================
//  5. HABER ŞOKU — şimdilik boş, sistem hazır
// ============================================================================
//  Haber sistemi yazildiginda tek yapilacak sey burayi cagirmak olacak.
//  Simdiden burada duruyor ki haber eklendiginde markaya BASKA bir yol
//  acilmasin — bu projede ikinci yol biraktigimiz her yerde iki sayi
//  birbirinden ayrildi.
// ============================================================================

export interface BrandShock {
    /** Pozitif ya da negatif ham puan */
    magnitude: number;
    /** Oyuncuya gosterilecek sebep */
    reason: string;
}

/**
 * Bir haberin markaya etkisi.
 *
 * Iyi haber azalan verimle, kotu haber TAM etkiyle uygulanir. Itibar
 * kazanmak yillar alir, kaybetmek bir gun — bu asimetri kasitlidir ve
 * markayi gercekten korumaya deger kilan sey odur.
 */
export const applyBrandShock = (currentBrand: number, shock: BrandShock): number => {
    const b = currentBrand || 0;
    if (shock.magnitude >= 0) {
        const headroom = Math.max(0, (BRAND_MAX - b) / BRAND_MAX);
        return shock.magnitude * headroom;
    }
    return shock.magnitude;
};

// ============================================================================
//  6. ÇEYREKLİK TOPLAM
// ============================================================================

export interface BrandQuarterInput {
    currentBrand: number;
    /** Pazarlama/kalite tarafindan uretilen degisim (attraction.ts) */
    marketingDelta: number;
    /** Oyuncunun tum kategorilerdeki agirlikli toplam pazar payi */
    totalMarketShare: number;
    /** Bu ceyrek karli miydi */
    profitable: boolean;
    /** Bu ceyrek yapilan devralmalarin marka katkisi */
    acquisitionGain: number;
    /** Haber solari (ileride) */
    shocks?: BrandShock[];
    /** Tesis kademesinin marka tavani */
    ceiling: number;
    /** Tesis kademesinin marka tabani */
    floor: number;
}

export interface BrandQuarterResult {
    newBrand: number;
    change: number;
    /** Hangi kaynak ne kadar katti — ekranda gostermek icin */
    sources: { label: string; amount: number }[];
    /** Pazar payinin getirdigi denge seviyesi */
    shareEquilibrium: number;
    cappedByFacility: boolean;
}

/**
 * Bir ceyregin marka hareketinin TAMAMI. Tek kapi.
 *
 * Motor yalnizca bunu cagirir; boylece "marka nereden geliyor" sorusunun
 * tek bir cevabi olur ve ekranda kalem kalem gosterilebilir.
 */
export const advanceBrand = (input: BrandQuarterInput): BrandQuarterResult => {
    const start = Math.max(0, input.currentBrand || 0);
    const sources: { label: string; amount: number }[] = [];

    // 1) Pazarlama ve kalite (attraction.ts'ten gelir)
    if (Math.abs(input.marketingDelta) > 0.01) {
        sources.push({ label: t('data.brand.marketingQuality'), amount: input.marketingDelta });
    }

    // 2) Pazar payi
    const share = brandFromMarketShare(start, input.totalMarketShare);
    if (Math.abs(share.delta) > 0.01) {
        sources.push({
            label: `Market share (${input.totalMarketShare.toFixed(1)}%)`,
            amount: share.delta,
        });
    }

    // 3) Zaman
    const tenure = brandFromTenure(start, input.profitable);
    if (tenure > 0) sources.push({ label: t('data.brand.anotherProfitableQuarter'), amount: tenure });

    // 4) Devralmalar
    if (input.acquisitionGain > 0.01) {
        sources.push({ label: t('data.brand.brandsYouAcquired'), amount: input.acquisitionGain });
    }

    // 5) Haber (ileride)
    let shockTotal = 0;
    (input.shocks || []).forEach(s => {
        const applied = applyBrandShock(start, s);
        shockTotal += applied;
        sources.push({ label: s.reason, amount: applied });
    });

    const raw =
        start + input.marketingDelta + share.delta + tenure + input.acquisitionGain + shockTotal;

    // TESIS TAVANI: atolyede premium marka olamazsin.
    const ceiling = Math.min(BRAND_MAX, input.ceiling ?? BRAND_MAX);
    const capped = raw > ceiling;
    const newBrand = Math.max(input.floor ?? 0, Math.min(ceiling, raw));

    return {
        newBrand,
        change: newBrand - start,
        sources,
        shareEquilibrium: share.equilibrium,
        cappedByFacility: capped,
    };
};

// ============================================================================
//  KATEGORI MARKALARI VE KURUMSAL CATI
// ============================================================================
//  Marka tek bir sayiydi: saglikta kazandigin itibar teknolojide de
//  isine yariyordu. Gercek hayatta boyle degil — Apple telefonda
//  guclu diye ilac satamaz.
//
//  Artik her kategorinin kendi markasi var ve urunun cekiciligi KENDI
//  kategorisinin markasini okur. Dongu kategori icinde kapanir:
//  teknolojide sat -> teknoloji markan buyur -> teknolojide daha cok sat.
//
//  Ustte bir de KURUMSAL MARKA duruyor: kategori markalarinin ciro
//  agirlikli ortalamasi. Kategoriye bagli olmayan her sey bunu okur —
//  hisse istikrari, kredi notu, fasoncuya kabul, ise alim, giris esigi.
// ============================================================================

/** Yeni kategoriye girerken kurumsal markanin ne kadari taban sayilir. */
export const CORPORATE_HALO = 0.20;

/**
 * Kurumsal marka: kategori markalarinin CIRO AGIRLIKLI ortalamasi.
 *
 * Agirlik ciro cunku sirketi taniyan kitle nerede satiyorsan oradadir.
 * Hic ciro yoksa duz ortalamaya duser.
 */
export const corporateBrand = (
    byCategory: Record<string, number>,
    revenueByCategory: Record<string, number>,
): number => {
    const keys = Object.keys(byCategory);
    if (keys.length === 0) return 0;

    const totalRevenue = keys.reduce((sum, k) => sum + Math.max(0, revenueByCategory[k] || 0), 0);
    if (totalRevenue <= 0) {
        return keys.reduce((sum, k) => sum + (byCategory[k] || 0), 0) / keys.length;
    }
    return keys.reduce(
        (sum, k) => sum + (byCategory[k] || 0) * (Math.max(0, revenueByCategory[k] || 0) / totalRevenue),
        0,
    );
};

/**
 * Yeni bir kategoriye ilk girerken markan sifirdan baslamaz.
 * Kurumsal itibarinin bir kismi kapida sana yarar — ama yalnizca bir kismi.
 */
export const categoryStartingBrand = (corporate: number): number =>
    Math.max(0, (corporate || 0) * CORPORATE_HALO);

// ============================================================================
//  BRAND POINTS — the player-facing scale, anchored to market share
// ============================================================================
//
//  The player's design, in his own numbers:
//
//      share 0.6%  -> brand 26
//      share 1.8%  -> brand 78
//      share 4.7%  -> brand 200   (the gate to the next category)
//      share 10%   -> brand 433
//
//  All four sit on one line: 26/0.6 = 78/1.8 = 433/10 = 43.3. So brand points
//  are market share expressed in a bigger unit, and BRAND_POINTS_PER_SHARE is
//  that unit.
//
//  WHY ANCHOR BRAND TO SHARE AT ALL: it makes the loop legible. Buy a company,
//  inherit its share, and your brand jumps the same multiple - which is
//  exactly what the player asked for ("startup'i aldim, 1.2 pay bana gecti,
//  brand 3 katina firlamali"). Marketing, serving demand and news then move
//  you off that line temporarily, and brand feeds back into attraction, which
//  earns more share. The line is the equilibrium, not a hard identity.
//
//  THE 0-100 CONSUMERS: attraction, valuation multiples, hiring pull, contract
//  partners and facility ceilings were all written against a 0-100 brand.
//  Rather than rewrite six modules, points convert to that index:
//
//      index = min(100, points / BRAND_INDEX_SCALE)
//
//  ---------------------------------------------------------------------------
//  AND THE LINE IS NOT A LINE. IT CURVES.
//  ---------------------------------------------------------------------------
//  Reported as "brand value stuck at 100, it does not move any more, it was
//  not like this before". Measured, with the straight line above:
//
//      share  equilibrium (points)   index
//        1%          43               10
//        3%         130               30
//        5%         217               50
//       10%         433              100    <- and it never moves again
//       15%         650              100
//
//  A tenth of one market made you the most recognised company that can exist,
//  and every reader downstream - valuation multiple, hiring pull, attraction -
//  pinned at maximum for the rest of the run. The brand stopped being a game.
//
//  The straight line was never the intent. `brandFromMarketShare`, written
//  first and still in this file, uses a SQUARE ROOT, and its comment says why:
//  the first 10% of a market is worth far more in recognition than the next
//  10%, because becoming visible from nothing is harder than becoming more
//  visible. Moving to points dropped the root and kept the slope, so what had
//  been a curve with diminishing returns became a ramp that hit the roof.
//
//  Restored. The anchor is the same 433 points, but it now sits at TOTAL
//  domination rather than at a tenth of one market:
//
//      share      1%    5%   10%   20%   40%   100%
//      points     43    97   137   194   274    433
//      index      10    22    32    45    63    100
//
//  Which is the original design's own table: 10% share reads 32, 40% reads 63.
//  A hundred means you own the market, and that is why it is a hundred.
// ============================================================================

/**
 * Brand points per point of market share, ON THE STRAIGHT LINE.
 *
 * SHELVED as the equilibrium rule - see `brandEquilibrium`, which is a square
 * root now. Kept exported because it is still the honest answer to "what is a
 * brand point worth" at small share, where the curve and the line agree
 * closely (1% share: 43 points either way), and several comments and tests
 * quote it as the unit.
 */
export const BRAND_POINTS_PER_SHARE = 43.3;

/** Points -> the 0-100 index every older module expects. */
export const BRAND_INDEX_SCALE = 4.33;

/**
 * SHELVED: the gate as a share of what the factory allows.
 *
 * ---------------------------------------------------------------------------
 *  A BAR THAT RISES WITH YOU IS A BAR YOU NEVER FEEL YOURSELF CLEAR
 * ---------------------------------------------------------------------------
 *  This existed because a flat 93 sat two points under the tier one ceiling
 *  of 95, which was not a gate but a coin toss. Making it seven tenths of the
 *  tier ceiling fixed that and introduced something worse, reported after
 *  playing with it:
 *
 *      "the limit is what I do not like. Now it goes 51, then 55, a little at
 *      every tier, and the game became impossible or broken."
 *
 *  Which is exactly what a proportional bar does. Every upgrade raised the
 *  requirement alongside the brand, so the player's number crept up beside a
 *  line that crept up with it and nothing ever felt like arriving.
 *
 *  Kept as a constant rather than deleted because the ratio is the honest
 *  record of what was tried, and because a flat gate has the failure mode
 *  this was written to cure - see CATEGORY_UNLOCK_BRAND, which is 200 rather
 *  than 93 for that reason.
 */
export const CATEGORY_UNLOCK_CEILING_RATIO = 0.70;

/**
 * Brand points needed in a category before another category can be opened.
 *
 * ---------------------------------------------------------------------------
 *  FLAT, AND TWO HUNDRED, WHICH IS WHERE IT STARTED
 * ---------------------------------------------------------------------------
 *  Asked for as "I want to open the second category around a tier twelve
 *  factory, and I want the limit gone". Those turn out to be the same
 *  request. Measured on one run, tier by tier:
 *
 *      the gate a tier proportional rule asks for
 *          T1  67    T5 115    T9 170    T11 197    T12 212
 *
 *  So a flat 200 IS the tier eleven to twelve gate. The same run reached it
 *  at quarter 85 at tier seven and cleared it comfortably by twelve, against
 *  quarter 5 under the proportional rule.
 *
 *  It is also the number the game had before any of this, and the player's
 *  memory of it - "I used to make brand 200 and then move on" - is a memory
 *  of this constant.
 *
 *  IT COINCIDES WITH EARNED_FLOOR_BRAND, deliberately and not by accident:
 *  the market you have proved you can run is the market that never falls back
 *  to nothing. They are separate constants so that either can move alone.
 */
export const CATEGORY_UNLOCK_BRAND = 200;

/**
 * The brand a category has to reach before it can never fall back to nothing.
 *
 * ---------------------------------------------------------------------------
 *  THIS USED TO BE THE SAME CONSTANT AS THE GATE, AND THEY ARE NOT ONE FACT
 * ---------------------------------------------------------------------------
 *  `earnedFloor` read CATEGORY_UNLOCK_BRAND, so "you may open another market"
 *  and "you can never fall below this again" were forced to be the same
 *  number. They only looked like one rule because nothing had ever moved
 *  either of them.
 *
 *  Rescaling the gate for the curve moved this too, and the conviction
 *  measurement caught it immediately: a permanent floor at 93 points is index
 *  21.5, so a convicted company and a clean one both stopped falling there
 *  and three years of a poisoned reputation came out as a gap of 0.7. A floor
 *  that high does not protect the player, it disarms every punishment in the
 *  game.
 *
 *  Left at 200, which is what it has always been. Reaching it now means
 *  roughly 21% of a market rather than 4.6%, which is the right shape for a
 *  promise this permanent: you kept it when you owned the place.
 */
export const EARNED_FLOOR_BRAND = 200;

/** How fast brand walks towards its share-implied level, per quarter. */
export const BRAND_APPROACH = 0.25;

// ============================================================================
//  THE WALK IS ASYMMETRIC — AND IT USED TO BE ASYMMETRIC THE WRONG WAY
// ============================================================================
//  A single rate was applied in both directions, sped up by servedRatio. So a
//  player who failed to deliver walked SLOWER - and when brand was falling,
//  that meant missing demand softened the fall. Failure was cushioned.
//
//  Reputation does not behave like that. Delivering what you promised builds
//  standing quickly and protects it when the numbers dip; promising and not
//  delivering destroys it fast. Four cases, and each rate says what it means:
//
//    rising,  delivered      fast   - you earned it and you can be relied on
//    rising,  missed         slow   - the demand is there, you are not
//    falling, delivered      slow   - a bad quarter, but customers were served
//    falling, missed         FAST   - you promised and did not deliver
//
//  This also makes recovery cheaper than collapse, which is the shape the
//  player asked for: easier to climb back, harsher while you are failing.
// ============================================================================

/** Extra pull when climbing and the demand was actually served. */
export const BRAND_SERVICE_BONUS = 0.12;

/** How much of the base pull is removed when falling despite serving demand. */
export const BRAND_LOYALTY_CUSHION = 0.08;

/** Extra pull downwards for demand created and not delivered. */
export const BRAND_FAILURE_PENALTY = 0.20;

/**
 * The brand figure the PLAYER is shown.
 *
 * ---------------------------------------------------------------------------
 *  THE NUMBER DID NOT COLLAPSE. THE RULER CHANGED.
 * ---------------------------------------------------------------------------
 *  Reported as "I used to make brand 200, and staying in one category I would
 *  reach 600 and over. Now it goes 51, then 55, and the game is broken."
 *
 *  It is not. For a while `stats.brandValue` held POINTS - those are the 200
 *  and the 600 - and it now holds the 0-100 INDEX. The same company reads
 *  differently because the unit under it moved and nothing said so. Measured
 *  on one run, both scales side by side:
 *
 *      T3   index 26.0 = 113 points
 *      T7   index 43.0 = 186 points
 *      T9   index 52.0 = 225 points      <- the player's remembered "200"
 *      T10  index 56.0 = 242 points
 *
 *  So "51 then 55" is "221 then 238" in the money they remember. Their brand
 *  is exactly where they thought it was.
 *
 *  The engine keeps the index, because attraction, the valuation multiple,
 *  the hiring pull, the contract partners and the facility ceilings were all
 *  written against 0-100 and converting six modules to chase a display is the
 *  wrong direction. The SCREEN converts instead, in one place, here.
 *
 *  The honest cost of showing points: it has no visible ceiling, so a player
 *  cannot read "how close am I to the top" off it. The index still exists for
 *  anything that wants to say that.
 */
export const brandDisplay = (index: number): number =>
    Math.round(indexToPoints(Math.max(0, index || 0)));

/** Converts brand points to the 0-100 index used by attraction, valuation etc. */
export const brandIndex = (points: number): number =>
    Math.max(0, Math.min(100, (points || 0) / BRAND_INDEX_SCALE));

/**
 * The other direction, and it exists because two systems were adding index
 * sized numbers to a points sized scale.
 *
 * ---------------------------------------------------------------------------
 *  WHAT IT COST
 * ---------------------------------------------------------------------------
 *  `SPONSOR_PEAK_POINTS` is 40 and its name says points, but it was chosen
 *  when brand ran 0 to 100 - it means "a global sponsorship is worth forty of
 *  a hundred". It was being added straight to a category's equilibrium, which
 *  runs 0 to 433 and beyond. So the biggest contract in the game moved a five
 *  per cent brand by nine per cent, and a local one by HALF OF ONE PER CENT.
 *  Measured, not guessed: local peaks are 1.0 to 1.9 points against an
 *  equilibrium of 216.
 *
 *  The story scenes have the same problem. `brand: -25` was authored to mean a
 *  quarter of the whole scale, and it was landing as five per cent of it.
 *
 *  Both were reported the same way: "sponsor aldim, hicbir sey degismedi" and
 *  "sohbette brand value arti yaziyor ama sifir etkileniyor".
 *
 * ---------------------------------------------------------------------------
 *  WHY CONVERT RATHER THAN RESCALE THE CONSTANTS
 * ---------------------------------------------------------------------------
 *  Because a designer thinks in the index. "A global deal is worth forty
 *  brand" is a sentence somebody can check; 173.2 is a number nobody can.
 *  The authored values stay in the unit they were written in and the
 *  conversion happens once, at the boundary, with its name saying so.
 */
export const indexToPoints = (index: number): number =>
    (index || 0) * BRAND_INDEX_SCALE;

/**
 * How much of the conversion the DECAY side keeps.
 *
 * ---------------------------------------------------------------------------
 *  CONVERTING BOTH DIRECTIONS WAS ARITHMETICALLY RIGHT AND MADE THE GAME WORSE
 * ---------------------------------------------------------------------------
 *  The marketing leg was being fed to the walk unconverted, so it was worth a
 *  4.33th of what it said. Converting it fixed the complaint that brand could
 *  never rise. It also multiplied the PENALTY for underspending by the same
 *  4.33, and I never measured that direction before shipping it.
 *
 *  Measured, at the default budget against the opening benchmark:
 *
 *      67k spend, 250k maintenance -> -0.70 index -> -3.03 points converted
 *
 *  And maintenance is a share of the market's benchmark, so it GROWS as the
 *  company does. A player who raises their budget but not fast enough now
 *  falls behind four times harder than before, which is exactly the report:
 *  meeting demand, spending real money, and watching it drop anyway.
 *
 *  ---------------------------------------------------------------------------
 *  WHY THE TWO SIDES ARE NOT SYMMETRIC
 *  ---------------------------------------------------------------------------
 *  Because their limiters are not. A gain is bounded by the tier ceiling a few
 *  lines later, so converting it in full cannot run away - it just reaches the
 *  ceiling sooner, which is the intent. A loss is bounded only by the floor,
 *  which sits far below where a growing company lives, so converting it in
 *  full changed what the constant MEANS: `BRAND_DECAY_MAX` was authored as
 *  "at worst 1.2 of a hundred a quarter" and became 5.2 points against a
 *  brand that might only be 50.
 *
 *  So the decay keeps its authored severity rather than its converted one.
 *  This is a deliberate asymmetry and it is named rather than buried, because
 *  an unexplained magic number here is how the next person reintroduces the
 *  problem in either direction.
 */
export const DECAY_CONVERSION_KEPT = 1 / BRAND_INDEX_SCALE;

/**
 * A marketing result, in points, with the two directions treated honestly.
 *
 * Positive: converted in full, so spending above maintenance is worth what it
 * says and the brand can climb to the ceiling its factory allows.
 *
 * Negative: converted, then damped back to the strength the constant was
 * written for. See DECAY_CONVERSION_KEPT.
 */
export const marketingToPoints = (indexDelta: number): number => {
    const d = indexDelta || 0;
    return d >= 0 ? indexToPoints(d) : indexToPoints(d) * DECAY_CONVERSION_KEPT;
};

/**
 * The brand level a given market share supports on its own.
 *
 * ---------------------------------------------------------------------------
 *  DIMINISHING RETURNS, WHICH IS THE WHOLE POINT
 * ---------------------------------------------------------------------------
 *  Going from nothing to 1% of a market is a bigger change in how well known
 *  you are than going from 39% to 40%. The square root says exactly that, and
 *  it is the same curve `brandFromMarketShare` has always used.
 *
 *  It is also what stops the index pinning: 433 points - index 100 - now
 *  means the entire market, not a tenth of it. See the table at the top of
 *  the points section.
 */
export const brandEquilibrium = (sharePercent: number): number => {
    const share = Math.max(0, Math.min(100, sharePercent || 0));
    return Math.sqrt(share / 100) * BRAND_MAX * BRAND_INDEX_SCALE;
};

export interface CategoryBrandInput {
    /** Current brand points in this category */
    current: number;
    /**
     * A floor this category can no longer fall below.
     *
     * Once a market has been taken to CATEGORY_UNLOCK_BRAND the standing is
     * kept. Coca-Cola moving into water does not lose its cola brand, and in
     * the game the alternative was worse: opening a second category split the
     * shared factory, the first category's share fell, and its brand followed
     * it down - so the player was punished for progressing. Climbing above the
     * floor still depends entirely on share; only the fall is stopped.
     */
    floor?: number;
    /** Realised market share this quarter (%) */
    share: number;
    /** Of the demand you created, what fraction did you actually deliver (0-1) */
    servedRatio: number;
    /** Marketing and quality contribution, in points */
    marketingDelta?: number;
    /** Points inherited from an acquisition that closed this quarter */
    acquisitionGain?: number;
    /** Negative news, in points */
    shock?: number;
    /**
     * Points added to the LEVEL brand is walking towards, not to brand itself.
     *
     * Sponsorship, and the reason it is here rather than folded into
     * `marketingDelta`: anything added to the VALUE is pulled straight back
     * out by the walk below, with a half life of about four quarters. Moving
     * the destination is a lift that holds while it lasts.
     *
     * See core/market/sponsorship.ts, which measured what the old way was
     * worth and found it was worth almost nothing.
     */
    equilibriumBonus?: number;
    /**
     * Whether the marketing budget covered this quarter's upkeep.
     *
     * ----------------------------------------------------------------------
     *  PAY THE MAINTENANCE AND THE MARKET CANNOT DRAG YOU BACKWARDS
     * ----------------------------------------------------------------------
     *  Reported as: "I am above the benchmark, should it not go up? Is that
     *  not how we built it?" It was not.
     *
     *  Spending above maintenance made the MARKETING term positive and left
     *  the share pull untouched, and the pull is the larger force whenever
     *  brand is above what share supports. Measured at brand 18 with no
     *  share, against a 250k upkeep:
     *
     *      300k spend  -> marketing +0.50   net -2.56
     *      1000k spend -> marketing +4.00   net +0.94
     *
     *  Four times the upkeep to stop going backwards, while the screen said
     *  the budget was above the line. The player's model and the engine
     *  disagreed, and the player's was the one the game had promised.
     *
     *  So: when the upkeep is paid the DOWNWARD pull is zero. Upward pull
     *  still works - growing your share still lifts you - and a scandal can
     *  still take you down, because a shock is not the market forgetting
     *  you. The rule is one sentence: pay the upkeep and you do not slide.
     * ----------------------------------------------------------------------
     */
    maintained?: boolean;
    /**
     * The highest this category may sit, in POINTS, after every penalty.
     *
     * Only consulted when `maintained` is true, and it is the reason that
     * flag is safe. Without it, paying the upkeep froze a company ABOVE its
     * own ceiling forever: the conviction penalty and the sponsorship drought
     * both work by lowering the ceiling, and a brand that could not be pulled
     * down could not be pulled down to meet a lowered one either.
     *
     * Caught by conviction.test.ts, which measured two identical companies -
     * one convicted - landing on exactly the same number.
     */
    ceiling?: number;
}

/**
 * One quarter of a single category's brand.
 *
 * Share sets the destination; the walk is gradual because reputation lags
 * results. Delivering what you promised speeds the walk up - the player's
 * "insanlara yeterince satis yaparsam yavas yavas artmali". An acquisition is
 * the one thing that moves brand in a single step, because you did not build
 * that reputation, you bought it.
 */
export const advanceCategoryBrand = (input: CategoryBrandInput): {
    newBrand: number;
    equilibrium: number;
    sources: { label: string; amount: number }[];
} => {
    const current = Math.max(0, input.current || 0);
    const equilibrium = brandEquilibrium(input.share)
        + Math.max(0, input.equilibriumBonus || 0);
    const served = Math.max(0, Math.min(1, input.servedRatio ?? 1));
    const sources: { label: string; amount: number }[] = [];

    // Walk towards the level your share supports - see the four cases above.
    const rising = equilibrium >= current;
    const rate = rising
        ? BRAND_APPROACH + BRAND_SERVICE_BONUS * served
        : BRAND_APPROACH - BRAND_LOYALTY_CUSHION * served + BRAND_FAILURE_PENALTY * (1 - served);
    const rawPull = (equilibrium - current) * Math.max(0.05, rate);
    // See `maintained`: paying the upkeep buys you out of the slide, not out
    // of the climb. An upward pull is untouched.
    //
    // AND NOT OUT OF YOUR OWN CEILING. Above it the pull works as it always
    // did, or a convicted company would simply stop falling and the penalty
    // would mean nothing.
    const aboveCeiling = input.ceiling !== undefined && current > input.ceiling;
    const pull = input.maintained && rawPull < 0 && !aboveCeiling ? 0 : rawPull;
    if (Math.abs(pull) > 0.05) {
        sources.push({ label: t('data.brand.marketShareLabel'), amount: pull });
    }

    const marketing = input.marketingDelta || 0;
    if (Math.abs(marketing) > 0.05) {
        sources.push({ label: t('data.brand.marketingQuality'), amount: marketing });
    }

    const acquisition = input.acquisitionGain || 0;
    if (acquisition > 0.05) {
        sources.push({ label: t('data.brand.brandsYouAcquired'), amount: acquisition });
    }

    const shock = input.shock || 0;
    if (shock < -0.05) {
        sources.push({ label: t('data.brand.badNews'), amount: shock });
    }

    const floor = Math.max(0, input.floor || 0);
    const newBrand = Math.max(floor, current + pull + marketing + acquisition + shock);
    return { newBrand, equilibrium, sources };
};

// ============================================================================
//  CORPORATE BRAND Q — one number, built from the categories
// ============================================================================
//
//  The player's formula:  q = 0.2x + 0.4y + 0.6z + 0.8...
//  "her kategori daha agir, sonra gelen daha agir"
//
//  The weighting is kept exactly as designed: the harder the market, the more
//  it says about you. Competing in Deep Tech is worth more to your reputation
//  than selling phones, because far fewer companies can.
//
//  ONE CORRECTION, and it matters: the raw sum is NOT normalised. Taken
//  literally, a company operating only in Consumer with a category brand of
//  400 would have q = 0.2 x 400 = 80 - a fifth of its only business. And
//  opening a fourth weak category would RAISE q mechanically, rewarding
//  sprawl. So the weights are divided by the weights of the categories you
//  actually operate in:
//
//      q = SUM(w_i * x_i) / SUM(w_i)      over active categories only
//
//  One category -> q equals that category. Several -> a weighted average that
//  leans towards the hard ones. Same design, correct magnitude.
//
//  WHY Q HAS TO EXIST: the invoice, operations and the news system all need a
//  single company reputation. Bad news about phones drops x, and q follows on
//  its own because q is derived. Bad news about the COMPANY hits q, and that
//  has to travel the other way - down into every category, each taking a share
//  in proportion to its weight. That is what applyCorporateShock does.
// ============================================================================

/** How much each market weighs in the corporate brand. Harder market, heavier. */
export const CATEGORY_BRAND_WEIGHT: Record<string, number> = {
    Consumer: 0.2,
    Robotics: 0.4,
    'Bio-Tech': 0.6,
    'Deep Tech': 0.8,
};

/** Anything not listed counts as an easy market. */
export const categoryWeight = (category: string): number =>
    CATEGORY_BRAND_WEIGHT[category] ?? 0.2;

/**
 * The corporate brand: a weighted average over the categories you are in.
 * Returns 0 when you are in none.
 */
export const corporateBrandFrom = (
    byCategory: Record<string, number>,
    activeCategories?: string[],
): number => {
    const cats = (activeCategories && activeCategories.length
        ? activeCategories
        : Object.keys(byCategory || {})
    ).filter(c => byCategory[c] !== undefined);

    if (cats.length === 0) return 0;

    let weighted = 0;
    let weights = 0;
    cats.forEach(c => {
        const w = categoryWeight(c);
        weighted += w * Math.max(0, byCategory[c] || 0);
        weights += w;
    });
    return weights > 0 ? weighted / weights : 0;
};

/**
 * A company-wide hit travels DOWN into the categories.
 *
 * `amount` is negative. Each category absorbs a slice proportional to its
 * weight, so a scandal hurts your reputation most where that reputation
 * counted for most. Returns a new map; the corporate figure is then simply
 * recomputed from it, which keeps q derived rather than stored twice.
 */
export const applyCorporateShock = (
    byCategory: Record<string, number>,
    amount: number,
    activeCategories?: string[],
): Record<string, number> => {
    const cats = (activeCategories && activeCategories.length
        ? activeCategories
        : Object.keys(byCategory || {})
    ).filter(c => byCategory[c] !== undefined);

    if (cats.length === 0 || !amount) return { ...byCategory };

    const totalWeight = cats.reduce((sum, c) => sum + categoryWeight(c), 0);
    if (totalWeight <= 0) return { ...byCategory };

    // ------------------------------------------------------------------
    //  THE NORMALISER HAS TO BE EXACT
    // ------------------------------------------------------------------
    //  A -50 hit to q must leave q exactly 50 lower. Since
    //  q = SUM(w*x)/SUM(w), spreading the hit as d_i = amount * w_i/SUM(w)
    //  gives dq = amount * SUM(w^2)/SUM(w)^2, which is SMALLER than amount.
    //  A first version multiplied by the category count instead and
    //  overshot badly: -50 landed as -64 on q across three categories.
    //
    //  The exact correction is k = SUM(w)^2 / SUM(w^2).
    // ------------------------------------------------------------------
    const sumSquares = cats.reduce((sum, c) => sum + categoryWeight(c) ** 2, 0);
    const k = sumSquares > 0 ? (totalWeight ** 2) / sumSquares : 1;

    const next = { ...byCategory };
    cats.forEach(c => {
        const slice = amount * (categoryWeight(c) / totalWeight) * k;
        next[c] = Math.max(0, (next[c] || 0) + slice);
    });
    return next;
};

/**
 * Can another category be opened?
 *
 * The chain the player described: reach the threshold where you already are
 * before spreading. Every category you currently operate in must be at or
 * above CATEGORY_UNLOCK_BRAND - you cannot open a fourth market on the back
 * of one strong one while two others sit neglected.
 */
/**
 * What the gate asks for. The same number at every tier, on purpose.
 *
 * Takes no arguments now. It used to take the tier's ceiling, and leaving an
 * ignored parameter behind would be a signature that lies about what the rule
 * depends on.
 */
export const categoryUnlockRequirement = (): number => CATEGORY_UNLOCK_BRAND;

export const canUnlockAnotherCategory = (
    byCategory: Record<string, number>,
    activeCategories: string[],
    /**
     * Categories that have met the requirement at some point.
     *
     * ---------------------------------------------------------------------
     *  A GATE YOU CLEARED STAYS CLEARED
     * ---------------------------------------------------------------------
     *  The requirement is a share of the FACTORY's ceiling, so building a
     *  bigger plant raises the bar. Read against today's figure alone, that
     *  punishes the player for growing: measured over eighty quarters, the
     *  gate opened at q5 and shut at q6, and in another run opened at q4 and
     *  shut at q37, purely because the tier went up.
     *
     *  I FIRST TRIED THE PEAK and it was only half a fix. Comparing the
     *  highest the category has ever been against TODAY'S requirement still
     *  shuts when the bar moves above the peak, which is exactly the case
     *  being complained about: measured again, opened q34 and shut q37.
     *
     *  So the thing to remember is not a number, it is that it HAPPENED.
     *  "You proved you can run this market" does not stop being true because
     *  you bought a second factory.
     *
     *  Neglect is still punished, just not twice: a market you abandon loses
     *  brand, share, and revenue on its own.
     */
    clearedCategories?: Record<string, boolean>,
): { allowed: boolean; weakest?: string; have: number; required: number } => {
    const required = categoryUnlockRequirement();
    const cats = activeCategories.filter(c => byCategory[c] !== undefined);
    if (cats.length === 0) {
        return { allowed: true, have: 0, required: 0 };
    }
    // A cleared category is satisfied whatever it reads today, so it cannot
    // be the weakest link and cannot be the one that shuts the gate.
    const pending = cats.filter(c => !clearedCategories?.[c]);
    if (pending.length === 0) {
        return { allowed: true, have: required, required };
    }
    let weakest = pending[0];
    pending.forEach(c => {
        if ((byCategory[c] || 0) < (byCategory[weakest] || 0)) weakest = c;
    });
    const have = byCategory[weakest] || 0;
    return {
        allowed: have >= required,
        weakest,
        have,
        required,
    };
};

/**
 * The floor a category has earned.
 *
 * Reaching EARNED_FLOOR_BRAND locks it in permanently. Kept as a map rather
 * than a boolean so a second milestone can be added later without a migration.
 *
 * NOT the unlock gate, though it read that constant until the curve landed.
 * See EARNED_FLOOR_BRAND for what separating them was worth.
 */
export const earnedFloor = (currentFloor: number | undefined, brand: number): number => {
    const floor = Math.max(0, currentFloor || 0);
    return brand >= EARNED_FLOOR_BRAND ? Math.max(floor, EARNED_FLOOR_BRAND) : floor;
};
