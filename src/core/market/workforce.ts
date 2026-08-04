// src/core/market/workforce.ts
//
// ============================================================================
//  KADRO, MAAŞ VE MORAL — tek kaynak
// ============================================================================
//
//  ONCE NE VARDI (hepsi kirikti)
//  ------------------------------
//  1) IKI AYRI MAAS SISTEMI. `useGameStore.salaryPolicy` motoru besliyordu,
//     `useStatsStore.salaryTier` ekrani besliyordu ve ikisi hic senkron
//     degildi — ikincisi hep 'average'da kaliyor, ekranda yanlis rakam
//     gosteriyordu.
//
//  2) MORAL MATEMATIGI TEK YONLUYDU. Ceyrek basina: dogal -5, yuksek maas
//     +15, dusuk maas -15. Yani:
//       - ortalama maas  -> kacinilmaz cokus (15 ceyrekte 0)
//       - yuksek maas    -> 3 ceyrekte 100'e yapisir ve orada kalir
//     Ikisi de karar degil. "Yuksegi sec, unut" baskin stratejiydi.
//
//  3) MORAL BINARY IDI. Tek etkisi: 50'nin altindaysa teslimat cezasi.
//     51 ile 100 arasinda HICBIR fark yoktu. Yani yuksek moralin odulu
//     yoktu, sadece cezadan kaciniyordun.
//
//  4) ETKINLIKLER SABIT FIYATLIYDI. Yacht Party 2.500 dolar, +35 moral.
//     Ceyrekte 300 bin dolar maas odeyen bir sirkette bedava demek.
//     Olcek buyudukce (tier 17'de ceyreklik kar milyarlarca) busbutun
//     anlamsizlasti.
//
//  5) ISE ALIM SINIRSIZDI. 22 kisilik sirket tek ceyrekte 3.842 kisilik
//     hedef koyup Industrial Campus'un ekibini kurabiliyordu.
//
//  SIMDI: BAKIM SEVIYESI MODELI
//  -----------------------------
//  Maas MUTLAK degil GORELI. Bir piyasa maasi var (kademeyle buyur);
//  sen ona gore bir ORAN belirlersin. Piyasada odersen moral 70'te
//  dengelenir, altinda erir, ustunde birikir — ama bir tavani vardir.
//
//  Bu, pazarlama butcesi ve marka bakim seviyesiyle AYNI fikir. Oyunda
//  ucuncu kez tekrar eden bir kalip olmasi iyi: oyuncu bir kere ogrenir,
//  her yerde ise yarar.
//
//  MORAL ARTIK UC KANALDAN SUREKLI ETKI EDER
//  ------------------------------------------
//    1. Verimlilik  -> kapasitenin ne kadarini gercekten calistirirsin
//    2. Fire        -> dikkatsiz ekip bozuk urun cikarir
//    3. Dogal kayip -> mutsuz insan gider
//
//  DENGE (simulasyonla dogrulandi)
//  --------------------------------
//  Optimum oran ~1.10. Ustune odemek bosa para (moral zaten doyar),
//  altina inmek tasarruftan cok kaybettirir. Her iki yonde de yanlis
//  cevap var — aradigimiz buydu.
//
// ============================================================================

import { MAX_TIER_LEVEL } from './capacity';

// ============================================================================
//  PIYASA MAASI
// ============================================================================
//  Kademeyle buyur. Sebebi gercek: buyuk ve teknik bir tesis daha
//  nitelikli insan ister, o insan da daha pahalidir. Ayrica bu, maas
//  giderinin ciroya oranini makul bir bantta tutar (erken oyunda ~%15,
//  gec oyunda ~%2) — yani maas karari basta cok acitir, sonra
//  onemini kaybeder. Bu da gercek.
// ============================================================================

/** Kademe 1'de bir uretim calisaninin ceyreklik piyasa maasi. */
export const MARKET_WAGE_BASE = 12_000;
/** Kademe 20'de. */
export const MARKET_WAGE_TOP = 42_000;

export const marketWage = (facilityTier: number): number => {
    const t = Math.min(MAX_TIER_LEVEL, Math.max(1, facilityTier || 1));
    const ratio = (t - 1) / Math.max(1, MAX_TIER_LEVEL - 1);
    return Math.round(MARKET_WAGE_BASE * Math.pow(MARKET_WAGE_TOP / MARKET_WAGE_BASE, ratio));
};

/** Oyuncunun belirledigi maas orani bu araliktadir. */
export const SALARY_RATIO_MIN = 0.75;
export const SALARY_RATIO_MAX = 1.35;
export const SALARY_RATIO_DEFAULT = 1.0;

export const clampSalaryRatio = (ratio: number): number =>
    Math.min(SALARY_RATIO_MAX, Math.max(SALARY_RATIO_MIN, ratio || SALARY_RATIO_DEFAULT));

/** Kisi basi gercek ceyreklik maas. */
export const quarterlyWage = (facilityTier: number, salaryRatio: number): number =>
    Math.round(marketWage(facilityTier) * clampSalaryRatio(salaryRatio));

/**
 * ARASTIRMACI MAASI.
 *
 * ONCEDEN SABIT 500.000 DOLARDI ve hicbir seyle olceklenmiyordu.
 * Kademe 1'de ceyreklik ciro ~1.7 milyon; tek bir arastirmaci cironun
 * %30'unu yiyordu. Artik piyasa maasina bagli: uzman insan pahalidir
 * ama sirketin olcegiyle orantilidir.
 */
export const RESEARCHER_WAGE_MULTIPLIER = 1.2;

export const researcherWage = (facilityTier: number, salaryRatio: number): number =>
    Math.round(quarterlyWage(facilityTier, salaryRatio) * RESEARCHER_WAGE_MULTIPLIER);

/**
 * ARASTIRMA CIKTISI — AZALAN GETIRI.
 *
 *     RP = 600 x arastirmaci^0.85
 *
 * Dogrusal DEGIL, ve bu bilincli. Ar-Ge ekibini ikiye katlamak ciktiyi
 * ikiye katlamaz: koordinasyon, ayni fikri iki kez kesfetmek, entegrasyon.
 * Fred Brooks'un klasik gozlemi.
 *
 * Oyun acisindan asil isi sudur: kar geç oyunda binlerce kat artiyor.
 * Dogrusal olsaydi oyuncu parayi laboratuvara gomup tum tech tree'yi bir
 * ceyrekte bitirirdi. Azalan getiri, zamanin gec oyunda da bir kaynak
 * olarak kalmasini saglar.
 *
 * DENGE NOTU (oyun testinden sonra): once kisi basi cikti cok yuksekti
 * (taban 1800) ve maas pahaliydi (piyasa x2.5). Sonuc: tek bir
 * arastirmaci ceyrekte 1.800 RP uretiyordu, yani laboratuvar iki
 * kisilik bir odaydi ve erken oyunda RP "kasmak" fazla kolaydi.
 *
 * Simdi maas ucuz (piyasa x1.2), kisi basi cikti dusuk (taban 600).
 * Ayni butceyle 15 kisi calistirirsin ve ayni RP'yi alirsin — ama
 * laboratuvar gercekten bir EKIP olur, buyutmek anlamli bir karar
 * haline gelir ve azalan getiri hissedilir.
 *
 * Kalibrasyon (asamaya uygun butcelerle):
 *   tier 1-2, 15 arastirmaci   ->  6.000 RP/ceyrek, 2. urun ~8 ceyrek
 *   tier 8,  388 arastirmaci   ->  95.000 RP/ceyrek
 *   tier 17, 28.000 arastirmaci -> 3.66M RP/ceyrek, Mind Upload ~12 ceyrek
 */
export const RP_BASE_OUTPUT = 600;
export const RP_SCALING_EXPONENT = 0.85;

export const researchOutput = (researcherCount: number): number =>
    Math.floor(RP_BASE_OUTPUT * Math.pow(Math.max(0, researcherCount), RP_SCALING_EXPONENT));

/** Ise alim bedeli: yillik maasin %25'i (headhunter, egitim, kurulum). */
export const hiringFee = (facilityTier: number, salaryRatio: number): number =>
    Math.round(quarterlyWage(facilityTier, salaryRatio) * 4 * 0.25);

/** Tazminat: kisi basi bir ceyreklik maas. */
export const severancePay = (facilityTier: number, salaryRatio: number): number =>
    quarterlyWage(facilityTier, salaryRatio);

// ============================================================================
//  MORAL
// ============================================================================

/** Piyasada odersen moral buraya oturur. */
export const MORALE_ANCHOR = 70;
/**
 * MAASLA ULASILABILECEK EN YUKSEK MORAL.
 *
 * Kasten 100 degil. Para tek basina bir ekibi mutlu etmez; kalani
 * etkinlik, ikramiye ve sirketin gercekten iyi gitmesiyle gelir.
 * Bu tavan olmadan "en yuksegi sec" tekrar baskin strateji oluyordu.
 */
export const WAGE_MORALE_CEILING = 85;

/** Maas orani tek basina hangi moral seviyesini tasir. */
export const wageMoraleTarget = (salaryRatio: number): number => {
    const r = clampSalaryRatio(salaryRatio);
    if (r >= 1) {
        // Azalan verim: 1.10'da ~80, 1.30'da ~84, otesi bosa para.
        const over = Math.min(0.5, r - 1);
        return MORALE_ANCHOR + (WAGE_MORALE_CEILING - MORALE_ANCHOR) * (1 - Math.exp(-over * 12));
    }
    // Altina inersen sert duser — ucuza calistirmanin bedeli var.
    return Math.max(0, MORALE_ANCHOR - (1 - r) * 180);
};

/** Moral hedefe bu hizla yurur. 0.30 -> birkac ceyrekte oturur. */
const MORALE_APPROACH = 0.30;

/**
 * MAAS KESINTISI SOKU.
 *
 * Maas artirmak kolay, geri almak degil. Bir kere yukari cikardiysan
 * asagi inmek tek seferlik agir bir moral cezasi getirir. Boylece maas
 * karari da fabrika gibi bir TAAHHUT olur, serbestce oynanan bir dugme
 * degil.
 */
export const payCutShock = (previousRatio: number, nextRatio: number): number => {
    const cut = clampSalaryRatio(previousRatio) - clampSalaryRatio(nextRatio);
    if (cut <= 0.01) return 0;
    return Math.min(30, Math.round(cut * 120));
};

export interface MoraleUpdateInput {
    currentMorale: number;
    salaryRatio: number;
    /** Isten cikarmanin moral bedeli (bkz. layoffMoraleCost) */
    layoffCost?: number;
    /** Maas kesintisi soku (bkz. payCutShock) */
    payCutCost?: number;
    /** Fazla mesai calisildi mi */
    overtime?: boolean;
    /** Bu ceyrek yapilan etkinliklerin toplam etkisi */
    eventBoost?: number;
    /** Ikramiye dagitildiysa */
    bonusBoost?: number;
    quarters?: number;
}

export interface MoraleUpdateResult {
    newMorale: number;
    change: number;
    /** Maasin tek basina tasidigi seviye — ekranda gostermek icin */
    wageTarget: number;
    reasons: string[];
}

export const updateMorale = (input: MoraleUpdateInput): MoraleUpdateResult => {
    const reasons: string[] = [];
    const q = Math.max(1, input.quarters ?? 1);
    const target = wageMoraleTarget(input.salaryRatio);

    let morale = Math.min(100, Math.max(0, input.currentMorale));

    for (let i = 0; i < q; i++) {
        morale += (target - morale) * MORALE_APPROACH;
    }

    if (target < input.currentMorale - 1) reasons.push('pay below market');
    else if (target > input.currentMorale + 1) reasons.push('pay above market');

    if (input.layoffCost) {
        morale -= input.layoffCost;
        reasons.push('layoffs');
    }
    if (input.payCutCost) {
        morale -= input.payCutCost;
        reasons.push('pay cut');
    }
    if (input.overtime) {
        morale -= OVERTIME_MORALE_COST * q;
        reasons.push('overtime');
    }
    if (input.eventBoost) {
        morale += input.eventBoost;
        reasons.push('team events');
    }
    if (input.bonusBoost) {
        morale += input.bonusBoost;
        reasons.push('bonus');
    }

    const newMorale = Math.min(100, Math.max(0, morale));
    return {
        newMorale: Math.round(newMorale * 10) / 10,
        change: Math.round((newMorale - input.currentMorale) * 10) / 10,
        wageTarget: Math.round(target),
        reasons,
    };
};

// ============================================================================
//  MORALIN UC ETKISI
// ============================================================================
//  Hepsi SUREKLI. Eskiden tek bir esik vardi (moral < 50) ve ustunde
//  hicbir sey degismiyordu; yuksek moralin odulu yoktu.
// ============================================================================

/**
 * Verimlilik carpani: kapasitenin ne kadarini gercekten calistirirsin.
 * Moral 0 -> 0.78, 100 -> 1.08. Yuksek moral kapasitenin USTUNE cikarir.
 */
export const efficiencyMultiplier = (morale: number): number =>
    0.78 + 0.30 * (Math.min(100, Math.max(0, morale || 0)) / 100);

/**
 * Fire carpani: dikkatsiz ekip bozuk urun cikarir.
 * Moral 100 -> 1.0 (kademe firesi aynen), moral 0 -> 2.5 kat fire.
 */
export const scrapMultiplier = (morale: number): number =>
    1 + (1 - Math.min(100, Math.max(0, morale || 0)) / 100) * 1.5;

/** Ceyreklik dogal kayip. Mutsuz ve ucuz calistirilan insan gider. */
export const BASE_ATTRITION = 0.03;

export const attritionRate = (morale: number, salaryRatio: number): number => {
    let rate = BASE_ATTRITION;
    if (morale < 50) rate *= 2;
    const r = clampSalaryRatio(salaryRatio);
    if (r < 0.95) rate *= 1.5;
    if (r > 1.1) rate *= 0.7;
    return rate;
};

// ============================================================================
//  İŞE ALIM
// ============================================================================

/** Yeni gelen calisanin ilk ceyrekteki verimi. */
export const RAMP_UP_RATIO = 0.5;

/**
 * ISE ALIM TAVANI — ceyrekte en fazla kac kisi alabilirsin.
 *
 * Sinirsizdi ve bu buyuk bir acikti: parasi olan oyuncu 22 kisiden
 * 3.842 kisiye tek ceyrekte cikabiliyordu. Gercekte bir sirket
 * kadrosunun ~%25'inden fazlasini bir ceyrekte ne bulabilir, ne
 * egitebilir, ne sindirebilir.
 *
 * Marka degeri tavani YUKSELTIR (iyi sirkete insan gelir), dusuk moral
 * DUSURUR (kotu sohret yayilir). Boylece isveren markasi da oyunun
 * parcasi olur.
 */
export const hiringCap = (
    headcount: number,
    brandValue: number,
    morale: number,
): number => {
    const brandPull = 0.7 + (Math.min(100, Math.max(0, brandValue || 0)) / 100) * 0.6;
    const moralePull = 0.7 + (Math.min(100, Math.max(0, morale || 0)) / 100) * 0.5;
    return Math.floor(Math.max(0, headcount) * 0.25 * brandPull * moralePull) + 10;
};

/**
 * Isten cikarmanin moral bedeli.
 * Kesilen ORAN belirler — 10 kisilik sirkette 3 kisi cikarmak,
 * 1000 kisilik sirkette 3 kisi cikarmaktan cok daha agirdir.
 */
export const layoffMoraleCost = (
    cutCount: number,
    headcountBefore: number,
    afterProfitableQuarter: boolean,
): number => {
    if (cutCount <= 0 || headcountBefore <= 0) return 0;
    const ratio = Math.min(1, cutCount / headcountBefore);
    const base = Math.min(20, ratio * 40);
    return Math.round(base + (afterProfitableQuarter ? 5 : 0));
};

// ============================================================================
//  DENEYIM
// ============================================================================
//  Eskiden yeni gelen ilk ceyrek %50, sonra sonsuza kadar %100'du —
//  kidem diye bir sey yoktu. Artik ekip zamanla ustalasir, ama hizli
//  buyume bunu SEYRELTIR: bir ceyrekte kadronu ikiye katlarsan ortalama
//  deneyim yariya iner. Buyumenin gorunmeyen bedeli budur.
// ============================================================================

/** Deneyimin verebilecegi en yuksek verimlilik primi. */
export const EXPERIENCE_MAX_BONUS = 0.12;
/** Prim bu kadar ceyrekte doyar. */
const EXPERIENCE_SATURATION = 16;

export const experienceBonus = (avgTenureQuarters: number): number =>
    EXPERIENCE_MAX_BONUS *
    (1 - Math.exp(-Math.max(0, avgTenureQuarters || 0) / (EXPERIENCE_SATURATION / 2)));

/** Yeni gelenler ortalama kidemi seyreltir. */
export const blendTenure = (
    currentTenure: number,
    currentHeadcount: number,
    arrivals: number,
    quarters: number = 1,
): number => {
    const veterans = Math.max(0, currentHeadcount - arrivals);
    const total = veterans + Math.max(0, arrivals);
    if (total <= 0) return 0;
    const grown = Math.max(0, currentTenure) + quarters;
    return (veterans * grown) / total;
};

// ============================================================================
//  FAZLA MESAI
// ============================================================================
//  Stok tukenmesi krizinde basvurulacak kaldirac. Kapasitenin uzerine
//  cikarir ama pahalidir ve morali yakar — surekli acik birakilirsa
//  ekip erir.
// ============================================================================

export const OVERTIME_MAX_RATIO = 1.15;
export const OVERTIME_WAGE_MULTIPLIER = 1.5;
export const OVERTIME_MORALE_COST = 3;

/** Fazla mesai aciksa maas faturasi bu kadar artar. */
export const overtimeWageCost = (baseWageBill: number): number =>
    Math.round(baseWageBill * (OVERTIME_MAX_RATIO - 1) * OVERTIME_WAGE_MULTIPLIER);

// ============================================================================
//  ETKİNLİKLER
// ============================================================================
//  KISI BASI fiyatlanir. Sabit fiyatliyken 22 kisilik sirkette de
//  12.652 kisilik sirkette de 2.500 dolardi — yani buyudukce bedava
//  hale geliyordu.
//
//  Fiyatlar bir tur oynandiktan sonra ~2.5x yukseltildi: 22 kisilik
//  sirkette gala 55.000 dolardi ve ceyreklik karin sadece %7'siydi,
//  yani moral bir karar degil bir formaliteydi. Artik %16 — gercek
//  bir tercih. Ustelik etkisi kalici degil: moral her ceyrek maasin
//  tasidigi seviyeye geri yurur, yani etkinlik nakit yakarak zaman
//  satin almaktir.
//
//  Ayrica ayni ceyrekte ikinci etkinlik YARI etki eder: ekibi arka
//  arkaya galaya goturerek morali satin alamazsin.
// ============================================================================

export interface TeamEvent {
    id: string;
    name: string;
    /** Kisi basi maliyet (dolar) */
    costPerPerson: number;
    /** Tam etkisi (ilk etkinlik) */
    moraleBoost: number;
    description: string;
}

export const TEAM_EVENTS: TeamEvent[] = [
    {
        id: 'lunch',
        name: 'Team Lunch',
        costPerPerson: 150,
        moraleBoost: 3,
        description: 'Cheap, quick, and forgotten by Friday.',
    },
    {
        id: 'offsite',
        name: 'Offsite Day',
        costPerPerson: 600,
        moraleBoost: 7,
        description: 'A day out of the building. People actually talk to each other.',
    },
    {
        id: 'retreat',
        name: 'Company Retreat',
        costPerPerson: 2_200,
        moraleBoost: 13,
        description: 'Two nights away. Expensive, and people remember it.',
    },
    {
        id: 'gala',
        name: 'Flagship Gala',
        costPerPerson: 6_000,
        moraleBoost: 20,
        description: 'The kind of night that gets photographed. Costs like it too.',
    },
];

/** Ceyrekte en fazla bu kadar etkinlik. */
export const MAX_EVENTS_PER_QUARTER = 2;

export const eventCost = (event: TeamEvent, headcount: number): number =>
    Math.round(event.costPerPerson * Math.max(1, headcount));

/** Ayni ceyrekteki ikinci etkinlik yari eder. */
export const eventMoraleGain = (event: TeamEvent, alreadyHosted: number): number =>
    Math.round(event.moraleBoost * Math.pow(0.5, Math.max(0, alreadyHosted)));

// ============================================================================
//  AÇIKLAMALAR — ekranda ⓘ altinda gosterilir
// ============================================================================

export const WORKFORCE_EXPLANATIONS = {
    salaryRatio:
        'What you pay relative to the market rate for your facility tier. Pay the market and morale settles around 70. Below that it erodes; above it builds, but only up to 85 — money alone cannot make a team love the place.',
    morale:
        'Morale is not a threshold any more. It continuously changes three things: how much of your capacity actually runs, how many units come out defective, and how many people quit.',
    hiringCap:
        'You cannot hire everyone at once. Each quarter you can take on about a quarter of your current headcount. A strong brand and high morale raise that limit; a bad reputation lowers it.',
    overtime:
        'Runs the line above its rated capacity. Useful when demand spikes and a stockout would burn Brand Value — but the hours cost 1.5× and morale drops every quarter it stays on.',
    events:
        'Priced per person, so they never become free as you grow. A second event in the same quarter has half the effect — you cannot simply buy morale.',
} as const;
