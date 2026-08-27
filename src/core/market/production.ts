// @orphan-ok-symbol plannedUnits - superseded by resolveTargetUnits() - production is absolute units now
// @orphan-ok-symbol utilizationForUnits - only needed by the old percentage-based production UI
// @orphan-ok-symbol allocateCapacity - the engine allocates inline so it can carry contract units too
// src/core/market/production.ts
//
// ============================================================================
//  ÜRETİM KAPASİTESİ — tek kaynak
// ============================================================================
//
//  NEDEN BU DOSYA VAR:
//  Ayni sey icin iki farkli formul vardi ve kimse fark etmemisti.
//
//    Motor  (useGameStore):     calisan * 500 / karmasiklik
//    Ekran  (useProductsLogic): calisan * 468.75      <-- karmasiklik YOK
//
//  20 calisan ve Smart Phone (karmasiklik 50) icin:
//    ekran "4.687 adet" yaziyordu, motor 100 adet uretiyordu. 47 KAT fark.
//
//  KURAL: Uretim adedi hesaplanan HER yer bu dosyayi cagirir.
//
//  ---------------------------------------------------------------------------
//  ONEMLI DEGISIKLIK — kapasite artik TESISTEN gelir
//  ---------------------------------------------------------------------------
//  Once uretim tamamen calisan sayisina bagliydi ve fabrika hicbir ise
//  yaramiyordu. Simdi:
//
//      uretim = tesis kapasitesi x personel orani x fire orani
//
//  Tesis kademesi capacity.ts'te. Bu dosya artik o modulun uzerine
//  URUN BAZINDA bir katman: standart birimi urun adedine cevirir ve
//  oyuncunun hedeflerini paylastirir.
//
//  Eski `BASE_OUTPUT_PER_EMPLOYEE` yaklasimi emekliye ayrildi ama
//  fonksiyon imzalari korundu; cagiran yerler tek tek tasindi.
// ============================================================================

import {
    STANDARD_COMPLEXITY,
    availableStandardUnits,
    standardToUnits,
    unitsToStandard,
} from './capacity';

/**
 * Tesisin tamami tek bir urune ayrilsa ceyrekte kac adet cikardi.
 *
 * Karmasiklik bolen: Smart Phone 50, Fusion Reactor 8000. Yani ayni
 * tesisten telefondan 160 kat fazla cikar. Urun secimi bu yuzden
 * gercek bir karardir.
 */
export const maxUnitsPerQuarter = (
    employeeCount: number,
    complexity: number,
    facilityTier: number = 1,
    isBuilding: boolean = false,
): number =>
    standardToUnits(
        availableStandardUnits(employeeCount, facilityTier, isBuilding),
        complexity,
    );

/**
 * Kullanim oranina gore gercek uretim.
 * @param utilizationPercent 0-100 arasi uretim seviyesi
 */
export const plannedUnits = (
    employeeCount: number,
    complexity: number,
    utilizationPercent: number,
    quarters: number = 1,
    facilityTier: number = 1,
    isBuilding: boolean = false,
): number => {
    const max = maxUnitsPerQuarter(employeeCount, complexity, facilityTier, isBuilding);
    const utilization = Math.min(100, Math.max(0, utilizationPercent ?? 0)) / 100;
    return Math.floor(max * utilization * Math.max(1, quarters));
};

/** Belirli bir adedi uretmek icin gereken kullanim orani (0-100). */
export const utilizationForUnits = (
    employeeCount: number,
    complexity: number,
    targetUnits: number,
    facilityTier: number = 1,
    isBuilding: boolean = false,
): number => {
    const max = maxUnitsPerQuarter(employeeCount, complexity, facilityTier, isBuilding);
    if (max <= 0) return 0;
    const raw = (targetUnits / max) * 100;
    return Math.min(100, Math.max(0, Math.ceil(raw)));
};

// ============================================================================
//  HEDEF ADET — uretim ayarinin bicimi
// ============================================================================
//  ONCEDEN: uretim ayari YUZDE idi (productionLevel 0-100).
//  Sorun: kapasiteni 10 katina cikardiginda %50 ayari otomatik olarak
//  10 kat daha cok uretiyordu. Yani buyume kararinin uretim tarafi
//  kendiliginden hallolyordu, oyuncunun tekrar karar vermesi gerekmiyordu.
//
//  SIMDI: ayar MUTLAK ADET. Kapasiten buyudugunde hedefin oldugu yerde
//  kalir; artirmak istiyorsan bilerek artirirsin.
// ============================================================================

export interface ProductionTargetSource {
    productionUnits?: number;
    productionLevel?: number;
    complexity?: number;
}

/** Ceyreklik uretim hedefini cozer; eski yuzdeli kayitlari da tasir. */
export const resolveTargetUnits = (
    product: ProductionTargetSource,
    employeeCount: number,
    facilityTier: number = 1,
    isBuilding: boolean = false,
): number => {
    const max = maxUnitsPerQuarter(
        employeeCount,
        product.complexity ?? STANDARD_COMPLEXITY,
        facilityTier,
        isBuilding,
    );

    // Yeni alan varsa onu kullan.
    if (typeof product.productionUnits === 'number') {
        return Math.max(0, Math.min(max, Math.floor(product.productionUnits)));
    }

    // TASIMA: eski kayitlar yuzde tutuyordu. Bir kereligine adede cevir.
    const percent = Math.min(100, Math.max(0, product.productionLevel ?? 50));
    return Math.floor((max * percent) / 100);
};

// ============================================================================
//  THE PLUS AND MINUS BUTTONS
// ============================================================================
//
//  Reported as "the production steppers jump by enormous amounts, 15k straight
//  to 55k". They did: the step was a flat 5% of MAX CAPACITY.
//
//      unitStep = max(1, round(maxUnits * 0.05))
//
//  So the step was a property of the factory, not of the number under your
//  thumb. On a line that can do 800,000 a quarter every tap moved 40,000,
//  whether you were sitting at 15,000 or at 700,000. Near the bottom of the
//  range the control had about three usable positions.
//
//  The step is a tenth of the CURRENT value now, with a floor of a thousand so
//  it never becomes a control you have to tap forty times. That gives roughly
//  the same number of taps to cross any part of the range, which is what
//  "smooth" means for a stepper.
//
//  NOT SYMMETRIC, AND THAT IS ARITHMETIC RATHER THAN AN OVERSIGHT. Up ten per
//  cent then down ten per cent does not return you to where you were, because
//  the second step is measured against the bigger number: 15,000 up is 16,500
//  and back down is 14,850.
//
//  The drift is exactly one per cent of the value, EVERYWHERE. I first wrote
//  here that it shrinks at the top; the test measured it at 700,000 and got
//  the same one per cent, because the round trip is ratio squared and the
//  number cancels out. Below the floor of a thousand it is larger still.
//
//  Left as it is. Making it reversible would mean remembering where a run of
//  taps started, which is state the button does not have and a rule the
//  player would have to be told about.
// ============================================================================

/** Smallest a stepper tap will ever move, so the control stays usable low down. */
export const NUDGE_MIN_STEP = 1_000;

/** A tap is worth this share of what is already there. */
export const NUDGE_RATIO = 0.10;

/** How far one tap of plus or minus moves, given where you are now. */
export const nudgeStep = (current: number): number =>
    Math.max(NUDGE_MIN_STEP, Math.floor(Math.max(0, current || 0) * NUDGE_RATIO));

/**
 * Where one tap of plus or minus lands.
 *
 * Clamped at both ends here rather than at the call site, because the hold
 * repeats this every 100ms and a clamp that lives in the component is a clamp
 * that the repeat can outrun.
 */
export const nudgeUnits = (
    current: number,
    direction: 1 | -1,
    maxUnits: number,
): number => {
    const now = Math.max(0, current || 0);
    const ceiling = Math.max(0, maxUnits || 0);
    return Math.max(0, Math.min(ceiling, now + direction * nudgeStep(now)));
};

// ============================================================================
//  AND HOLDING IS NOT TAPPING VERY FAST
// ============================================================================
//
//  Reported as "when I hold it, it should not rise as if I had tapped. It
//  should go up little by little, and with acceleration".
//
//  The first hold applied the whole tap step every 100ms. A tap step is a
//  tenth of the value, so holding compounded ten per cent ten times a second:
//  2.6x per SECOND. The first tick was already a full tap and the second was
//  bigger than the first. There was no slow part to aim with.
//
//  A hold is a different gesture from a tap and needs its own size. It starts
//  at three per cent of a tap and ramps to sixty per cent over two seconds,
//  so the beginning is fine enough to land on a number and the end is fast
//  enough to cross the range.
//
//  MEASURED, not guessed. I wrote a table here from the constants before
//  running it and every figure was wrong, so these come off the simulation:
//
//                  holding + from 15,000     from 0
//      0.5s              15,931                606
//      1.0s              18,091              1,893
//      2.0s              28,667              6,607
//      3.0s              51,328             12,883
//      5.0s             164,592             41,294
//      8.0s             800,000  ceiling   237,119
//
//  The first half second moves six per cent, which is the "azar azar" part,
//  and the full range takes about eight seconds, which is the acceleration.
//
//  THE ALTERNATIVES WERE MEASURED TOO, because a number chosen by feel is a
//  number nobody can argue with later:
//
//      start .08 max .75 ramp 1.5s   half a second already moved 12%
//      start .02 max .45 ramp 2.5s   eight seconds only reached 308k
//      start .03 max .35 ramp 2.0s   eight seconds only reached 175k
// ============================================================================

/** How often a held button repeats. */
export const HOLD_TICK_MS = 100;

/** How long a hold takes to reach full speed. */
export const HOLD_RAMP_MS = 2_000;

/** A hold's first ticks are worth this much of one tap. */
export const HOLD_START_FRACTION = 0.03;

/** And its fastest ticks are worth this much, deliberately under a whole tap. */
export const HOLD_MAX_FRACTION = 0.60;

/**
 * How much of a tap one tick of a hold is worth, this far into the press.
 *
 * Linear rather than eased. The value it multiplies already grows with the
 * number, so the movement compounds on its own; an eased ramp on top of a
 * compounding step is two accelerations and it runs away.
 */
export const holdFraction = (elapsedMs: number): number => {
    const t = Math.min(1, Math.max(0, elapsedMs || 0) / HOLD_RAMP_MS);
    return HOLD_START_FRACTION + (HOLD_MAX_FRACTION - HOLD_START_FRACTION) * t;
};

/**
 * Where one tick of a held button lands.
 *
 * At least one unit, so the very start of a hold is never a press that does
 * nothing at all. Clamped at both ends here, like the tap, because the caller
 * repeats this ten times a second.
 */
export const holdNudge = (
    current: number,
    direction: 1 | -1,
    maxUnits: number,
    elapsedMs: number,
): number => {
    const now = Math.max(0, current || 0);
    const ceiling = Math.max(0, maxUnits || 0);
    const step = Math.max(1, Math.floor(nudgeStep(now) * holdFraction(elapsedMs)));
    return Math.max(0, Math.min(ceiling, now + direction * step));
};

// ============================================================================
//  WHAT "MATCH DEMAND" HAS TO ACTUALLY BUILD
// ============================================================================
//
//  Reported as "the button says X but I need several times X to stop running
//  out". Measured, the demand figure on that screen is exact - it matched the
//  engine to the unit over six quarters - so the number was never the lie.
//  Three things sat between it and a shelf that stays full:
//
//  1. FIRE. A tier one line scraps about 9% of what it builds, and more as
//     morale falls. The button divided by the yield already.
//
//  2. THE CAP CAME AFTERWARDS. The label compared RAW need against capacity
//     and then set `min(capacity, need / yield)`. So at need 3800, yield 0.9
//     and capacity 4050 it announced "build 4222" and quietly set 4050. The
//     button promised a number it did not deliver.
//
//  3. DEMAND MOVES WHILE YOU BUILD. Serving a quarter well raises the reach
//     index and the brand, both of which raise next quarter's demand. Aiming
//     at exactly this quarter's figure means arriving slightly short every
//     time, and being slightly short is what costs the reach index.
//
//  So the target carries a margin. Ten per cent, asked for as "%10 alti olsa
//  her sey cozulecek" - the demand you are shown should sit just under what
//  you build, not just over it.
//
//  Why ten and not more: `overBuilding` warns at a fifth of demand left on
//  the shelf, and storage is charged per unit per quarter. Ten per cent is
//  comfortably inside the warning and cheap enough to be the safe default.
// ============================================================================

/** Safety margin on a "match demand" build, over and above the scrap rate. */
export const DEMAND_BUFFER = 0.10;

export interface MatchDemandInput {
    /** Units the market will ask for, less whatever is already on the shelf. */
    neededUnits: number;
    /** Share of a build that comes out sellable. */
    effectiveYield: number;
    /** Most this line can put through in a quarter. */
    maxUnits: number;
}

export interface MatchDemandPlan {
    /** What to build to cover demand with the margin. Ignores capacity. */
    target: number;
    /** What the line can actually build, which is what the button sets. */
    build: number;
    /** True when capacity is the binding constraint, not the player's choice. */
    capped: boolean;
    /** Sellable units short of demand if `build` is what gets made. */
    shortfall: number;
}

/**
 * The one place that decides what "match demand" means.
 *
 * Pure, so the label and the press cannot disagree - they were computed
 * separately before, which is how the button came to announce a number it
 * then clamped away.
 */
export const matchDemandPlan = (input: MatchDemandInput): MatchDemandPlan => {
    const needed = Math.max(0, input.neededUnits || 0);
    const yieldRate = Math.min(1, Math.max(0.01, input.effectiveYield || 1));
    const max = Math.max(0, input.maxUnits || 0);

    const target = Math.ceil((needed / yieldRate) * (1 + DEMAND_BUFFER));
    const build = Math.min(max, target);
    // Measured in SELLABLE units, because that is what a customer walks away
    // over. The margin is not part of the shortfall: falling back to exactly
    // covering demand is not being short.
    const shortfall = Math.max(0, needed - Math.floor(build * yieldRate));

    return { target, build, capped: build < target, shortfall };
};

// ============================================================================
//  PAYLASTIRMA — birden fazla urun ayni tesisi kullanir
// ============================================================================
//  Kapasite ORTAK. Iki urunun varsa ikisi ayni hatti paylasir; ikisinin
//  hedefi toplam kapasiteyi asiyorsa TALEP ORANINDA kirpilir.
//
//  Neden orantili kirpma: oyuncuyu "hangi urun oncelikli" diye ayri bir
//  ekrana sokmadan adil bir sonuc verir. Oyuncu bir urune daha cok pay
//  vermek istiyorsa digerinin hedefini kendisi dusurur — karar yine onda.
// ============================================================================

export interface AllocationRequest {
    id: string;
    /** Oyuncunun istedigi adet */
    targetUnits: number;
    complexity: number;
}

export interface AllocationResult {
    /** urun id -> gercekten uretilecek adet */
    unitsById: Record<string, number>;
    /** Talep edilen toplam standart birim */
    requestedStandard: number;
    /** Kullanilabilir toplam standart birim */
    availableStandard: number;
    /** 1'den kucukse kapasite yetmedi ve kirpma yapildi */
    fulfilledRatio: number;
}

export const allocateCapacity = (
    requests: AllocationRequest[],
    employeeCount: number,
    facilityTier: number,
    isBuilding: boolean,
    quarters: number = 1,
): AllocationResult => {
    const q = Math.max(1, quarters);
    const availableStandard =
        availableStandardUnits(employeeCount, facilityTier, isBuilding) * q;

    const requestedStandard = requests.reduce(
        (sum, r) => sum + unitsToStandard(r.targetUnits * q, r.complexity),
        0,
    );

    const ratio =
        requestedStandard > 0 ? Math.min(1, availableStandard / requestedStandard) : 1;

    const unitsById: Record<string, number> = {};
    requests.forEach(r => {
        unitsById[r.id] = Math.floor(Math.max(0, r.targetUnits) * q * ratio);
    });

    return {
        unitsById,
        requestedStandard,
        availableStandard,
        fulfilledRatio: ratio,
    };
};

// ============================================================================
//  ÜRÜN YÜKSELTME MALİYETİ (RP)
// ============================================================================
//  ONCE IKI AYRI FORMUL VARDI ve ekran biriyle, kasa digeriyle konusuyordu:
//
//    Ekran (ProductModals):  sqrt(karmasiklik) x 2.150 x 1,55^seviye
//    Kasa  (useProductStore): karmasiklik x 100 x 1,5^seviye
//
//  Karmasikligi 3.481 olan Industrial Arm icin ekran 197.000 RP yaziyor,
//  kasa 522.000 RP cekiyordu. Yani oyuncu gordugu fiyatin UC KATINI
//  oduyordu ve nedenini bilmiyordu.
//
//  Eski formul karmasiklikla DOGRUSAL buyuyordu; karmasikligi 10.000.000
//  olan Fusion Reactor'da tek yukseltme 1,5 MILYAR RP ediyordu — tum tech
//  tree'nin toplamindan fazla. Karekok buyuk urunu pahali tutar ama
//  imkansiz yapmaz.
// ============================================================================

/** Bir urunun bir sonraki seviye yukseltmesinin RP maliyeti. */
export const productUpgradeRP = (complexity: number, currentLevel: number): number =>
    Math.floor(
        Math.sqrt(Math.max(1, complexity || 50)) * 2_150 * Math.pow(1.55, Math.max(1, currentLevel || 1)),
    );
