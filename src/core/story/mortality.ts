// src/core/story/mortality.ts
//
// ============================================================================
//  THE CLOCK NOBODY WINDS
// ============================================================================
//
//  Until now the only ways out were bankruptcy, the board, and selling. All
//  three are things the player DID. Nothing in the game ended a run on its own,
//  which meant a careful player had no last quarter, and a game about a
//  succession in which nobody dies is a game about an organisation chart.
//
//  This is the prerequisite for the rest of it: an inheritance needs somebody
//  to inherit from.
//
//  ---------------------------------------------------------------------------
//  A CURVE, NOT A NUMBER
//  ---------------------------------------------------------------------------
//  The cheap version is `if (age >= 80) end`. It is worse in a way that is
//  easy to miss: a fixed date makes the last fifteen years of the run a
//  countdown the player can plan around perfectly, so naming a successor
//  becomes a chore performed on schedule rather than a decision made under
//  uncertainty. The entire tension of a succession is not knowing.
//
//  So it is a hazard curve. Gompertz, which is what actual mortality does:
//  a low rate that doubles at a fixed interval. Below `MORTALITY_START_AGE`
//  it is zero, because a player who dies at forty for no reason has had the
//  run taken away rather than ended, and above `MORTALITY_CERTAIN_AGE` it is
//  one, because somebody has to stop.
//
//  ---------------------------------------------------------------------------
//  THE NUMBERS, AND WHAT THEY MEASURE OUT AT
//  ---------------------------------------------------------------------------
//  Measured over 100,000 lives in mortality.test.ts rather than reasoned about,
//  because the compounding of a quarterly roll is not something anybody
//  estimates correctly by looking at an annual rate:
//
//      earliest possible death      55
//      median                       72
//      a quarter of players reach   78
//      one in twenty reach          85
//      one in a hundred reach       89
//      nobody passes                95
//
//  Starting at 20, that is a median run of fifty-two years, or two hundred and
//  eight quarters. If the game ever feels too long, `MORTALITY_START_AGE` is
//  the number to move and the test will tell you what you did to the rest of
//  the distribution.
//
//  HEALTH IS DELIBERATELY NOT IN HERE. It is the obvious modifier and there is
//  a `health` field sitting in usePlayerStore, and it does not move: nothing in
//  the current game writes it. Wiring a parameter to a value nothing changes is
//  the exact failure this codebase keeps finding, so it arrives here as an
//  argument on the day something moves it.
//
//  PURE. No stores, no clock, and the die is injected.
// ============================================================================

/** Below this the curve is zero. Nobody dies of being forty. */
export const MORTALITY_START_AGE = 55;

/** Annual chance of death AT the start age. Everything above compounds off it. */
export const MORTALITY_BASE = 0.015;

/** How many years it takes the annual hazard to double. */
export const MORTALITY_DOUBLING_YEARS = 7;

/**
 * The hard stop.
 *
 * A curve alone has a tail, and a tail means one player in ten thousand runs a
 * company at a hundred and twelve. That is funny once and it is a bug in the
 * screenshot somebody posts.
 */
export const MORTALITY_CERTAIN_AGE = 95;

/**
 * The chance of dying in the next YEAR, at this age.
 *
 * Exported for the test and for anything that wants to show the player a sense
 * of it. Between 0 and 1.
 */
export const annualHazard = (age: number): number => {
    if (!Number.isFinite(age)) return 0;
    if (age >= MORTALITY_CERTAIN_AGE) return 1;
    if (age < MORTALITY_START_AGE) return 0;
    const doublings = (age - MORTALITY_START_AGE) / MORTALITY_DOUBLING_YEARS;
    return Math.min(1, MORTALITY_BASE * Math.pow(2, doublings));
};

/**
 * The same thing per quarter, which is the unit the game actually ticks in.
 *
 * NOT the annual rate divided by four. Four independent rolls of `h/4` do not
 * add up to `h`: they UNDERSHOOT, because two of them landing in the same year
 * only kills you once. The gap widens as the rate climbs, so at eighty the
 * naive version produces a fifteen per cent annual rate where the curve asks
 * for eighteen, and everybody quietly lives longer than the header comment
 * says. The conversion goes through the survival rate instead.
 */
export const quarterlyHazard = (age: number): number => {
    const annual = annualHazard(age);
    if (annual >= 1) return 1;
    if (annual <= 0) return 0;
    return 1 - Math.pow(1 - annual, 1 / 4);
};

/** Does the player die this quarter? The die is injected so the test is real. */
export const diesThisQuarter = (age: number, roll: () => number = Math.random): boolean =>
    roll() < quarterlyHazard(age);

// ============================================================================
//  AND WHO IS LEFT
// ============================================================================

/** Only what the rule needs, so this stays testable without a Child. */
export type Candidate = {
    id: string;
    age: number;
};

/**
 * Old enough to be handed a company.
 *
 * Sixteen, which is the age the succession screen already starts calling them
 * a candidate and the age at which they start writing to you about it. Three
 * places agreeing on one number rather than each picking their own.
 */
export const SUCCESSION_AGE = 16;

/**
 * Who takes over, or null.
 *
 * THE NAMED ONE FIRST, and this is the whole reward for having named anybody.
 * A player who never opened the succession screen falls through to the eldest,
 * which is a real outcome rather than a punishment: it is what happens when
 * you leave it to be decided for you, and the siblings will have views.
 *
 * `null` when there is nobody of age, which is its own ending. It has to be
 * possible or naming a successor costs nothing.
 */
export const successorFor = (
    children: readonly Candidate[],
    designatedSuccessorId: string | null,
): Candidate | null => {
    const grown = children.filter(c => (c?.age ?? 0) >= SUCCESSION_AGE);
    if (grown.length === 0) return null;

    const named = designatedSuccessorId
        ? grown.find(c => c.id === designatedSuccessorId)
        : undefined;
    if (named) return named;

    // Eldest, and ties broken by order in the family rather than by chance:
    // an inheritance that comes out differently on a reload is not an
    // inheritance.
    return grown.reduce((oldest, c) => (c.age > oldest.age ? c : oldest), grown[0]);
};
