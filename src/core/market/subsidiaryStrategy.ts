// src/core/market/subsidiaryStrategy.ts
//
// ============================================================================
//  THE EMPIRE NOBODY COULD READ
// ============================================================================
//
//  Reported as "nobody understands My Empire". It is not a presentation
//  problem, or not only one. Two things were wrong underneath it.
//
//  ONE: A THIRD OF THE COMPANIES COULD NOT BE RUN WELL AT ALL.
//  `evaluateSubsidiaries` recognised four sectors - Technology, Industrial,
//  Retail and Finance - and the market data ships:
//
//      Technology  12 buyable      rule
//      Industrial  10 buyable      rule
//      Health       8 buyable      NO RULE
//      Finance      7 buyable      rule
//      Retail       0 buyable      rule, and nothing to apply it to
//
//  So eight of the thirty seven companies a player can buy were incapable of
//  a good quarter whatever the player did: they fell through to the bad
//  branch every time, which is 52% chance of a decline and 8% chance of a
//  crash, forever. The player reads that as their own mistake, because there
//  is nothing on screen to tell them the sector simply has no answer. And
//  Retail's rule was dead code guarding a shelf with nothing on it.
//
//  Worse, `sector` is not a field in the market data at all - it is read off
//  `category`, and anything missing falls back to 'Conglomerate', which also
//  matched nothing. The failure mode for an unknown sector was silent doom.
//
//  TWO: THE RULE WAS A COMBINATION LOCK. Four sliders, ten points, and one
//  hint that named two of the four sectors and none of the numbers. The
//  player moved dials and read a percentage, with no way to connect them,
//  because the connection was never shown.
//
//  ---------------------------------------------------------------------------
//  SO: A TABLE, NOT A CHAIN OF IFS
//  ---------------------------------------------------------------------------
//  Every sector names the dials it cares about and the level it wants them
//  at. A sector nobody wrote an entry for gets the default rather than a
//  guaranteed decline - "we forgot" should never be a difficulty setting.
//
//  Asked for as "show the threshold but do not make it too obvious, or it
//  gets simple". So this file does NOT produce "R&D must be 4". It produces
//  an OUTLOOK - a word that changes as the sliders move - and the player
//  finds the edge by walking into it. The information is all there; it is
//  just priced in attention rather than handed over.
//
//  PURE. No stores, no clock, no random.
// ============================================================================

export interface Strategy {
    marketing: number;
    rnd: number;
    production: number;
    workforce: number;
}

export type Dial = keyof Strategy;

/** Total points a player has to spread across the four dials. */
export const STRATEGY_POINTS = 10;

/**
 * Below this on workforce, nothing else matters.
 *
 * The one rule that was already visible on screen, and it stays: a company
 * whose people are neglected does not get to be well run in any other
 * respect. It is also the reason a sector's focus is never `workforce`.
 */
export const WORKFORCE_FLOOR = 2;

export interface SectorFocus {
    /** Every one of these has to be at `min` or above. */
    dials: Dial[];
    min: number;
}

/**
 * What each sector needs to be run well.
 *
 * HEALTH IS THE NEW ONE and it is deliberately the awkward one: research AND
 * people, both at three, which costs six of the ten points before anything
 * else. A pharmaceutical company is the hardest thing in the portfolio to run
 * and it should feel like it. Finance already had that shape and it is the
 * reason the shape exists.
 *
 * RETAIL STAYS even though no company ships with that category. It is one
 * line, it is correct, and deleting it would mean rediscovering it the day
 * somebody adds a retailer.
 */
export const SECTOR_FOCUS: Readonly<Record<string, SectorFocus>> = {
    Technology: { dials: ['rnd'], min: 4 },
    Industrial: { dials: ['production'], min: 4 },
    Retail: { dials: ['marketing'], min: 4 },
    Finance: { dials: ['marketing', 'rnd'], min: 3 },
    Health: { dials: ['rnd', 'workforce'], min: 3 },
};

/**
 * What a sector nobody wrote down needs.
 *
 * A conglomerate, an unknown category, a company invented by a story event.
 * Balanced rather than specialised, which is what "we do a bit of everything"
 * should ask for - and, crucially, ACHIEVABLE. The old behaviour for an
 * unrecognised sector was a guaranteed decline forever.
 */
export const DEFAULT_FOCUS: SectorFocus = { dials: ['marketing', 'production'], min: 3 };

export const focusFor = (sector: string): SectorFocus =>
    SECTOR_FOCUS[sector] ?? DEFAULT_FOCUS;

/** Every sector's focus is affordable inside the points budget. */
export const focusCost = (f: SectorFocus): number =>
    f.dials.length * f.min + (f.dials.includes('workforce') ? 0 : WORKFORCE_FLOOR);

// ============================================================================
//  THE VERDICT
// ============================================================================

export interface StrategyVerdict {
    /** Is this company being run well this quarter. */
    good: boolean;
    /** The dials the sector cares about, so a screen can point at them. */
    focus: Dial[];
    /** How far the WEAKEST focus dial is from where it needs to be. 0 when met. */
    shortfall: number;
    /** True when workforce alone is what is wrong. It overrides everything. */
    neglected: boolean;
}

const value = (s: Strategy | undefined, d: Dial): number =>
    Math.max(0, Number.isFinite(s?.[d]) ? (s as Strategy)[d] : 0);

export const strategyVerdict = (sector: string, strategy: Strategy): StrategyVerdict => {
    const f = focusFor(sector);
    const neglected = value(strategy, 'workforce') < WORKFORCE_FLOOR;
    const shortfall = Math.max(
        0,
        ...f.dials.map(d => f.min - value(strategy, d)),
    );
    return {
        good: !neglected && shortfall === 0,
        focus: f.dials,
        shortfall,
        neglected,
    };
};

// ============================================================================
//  AND WHAT THE PLAYER IS TOLD ABOUT IT
// ============================================================================
//
//  Four words, not four numbers. "Under-resourced" does not say which dial or
//  by how much; it says there is a dial, and the player has four of them and
//  ten points. Finding it takes one or two experiments, which is a puzzle.
//  Printing "R&D needs 4" takes none, which is a form.
// ============================================================================

export type Outlook = 'compounding' | 'steady' | 'underResourced' | 'neglected';

export const outlookOf = (sector: string, strategy: Strategy): Outlook => {
    const v = strategyVerdict(sector, strategy);
    if (v.neglected) return 'neglected';
    if (!v.good) return 'underResourced';
    // Met the bar, and then some. Not a mechanical difference - the quarterly
    // roll is the same - but "you are comfortably right" is worth seeing, or
    // the player who overshoots cannot tell they overshot.
    const spare = Math.min(...v.focus.map(d => value(strategy, d))) - focusFor(sector).min;
    return spare >= 1 ? 'compounding' : 'steady';
};

// ============================================================================
//  THE LINE IN THE QUARTERLY REPORT
// ============================================================================
//
//  Asked for as "one sentence of feedback per company, in a fold-out section
//  at the end of the bill". The point of it is to join the two halves the
//  player could never connect: the percentage they saw, and the dials they
//  set three months ago.
//
//  A KEY AND ITS ARGUMENTS, not a rendered string, because the player can
//  change language and a sentence baked into the save would not follow them.
// ============================================================================

export interface SubsidiaryNote {
    key: string;
    /** The dial to name, where naming one helps. */
    dial?: Dial;
}

export const noteFor = (
    sector: string,
    strategy: Strategy,
    changePercent: number,
): SubsidiaryNote => {
    const v = strategyVerdict(sector, strategy);

    if (v.neglected) return { key: 'empire.noteNeglected' };
    if (!v.good) {
        // Name the weakest focus dial. This is the ONE place a dial is named,
        // and only once the quarter has already gone badly - a hint bought
        // with a bad result rather than given away on the strategy screen.
        const weakest = v.focus.reduce((a, b) => (value(strategy, a) <= value(strategy, b) ? a : b));
        return { key: 'empire.noteUnderResourced', dial: weakest };
    }
    if (changePercent >= 0.10) return { key: 'empire.noteSurge' };
    if (changePercent > 0) return { key: 'empire.noteGrowing' };
    // Well run and still down. It happens, and saying so is what stops the
    // player concluding the dials do nothing the first time it does.
    return { key: 'empire.noteWellRunButDown' };
};
