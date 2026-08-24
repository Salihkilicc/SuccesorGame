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
 * The player's choice wins even if he is seventy: it is their company and they
 * said so.
 *
 * ---------------------------------------------------------------------------
 *  AND OTHERWISE THE ELDEST WHO IS NOT ALSO NEARLY DEAD
 * ---------------------------------------------------------------------------
 *  Plain "eldest" was the first version and it is wrong in this game
 *  specifically, because the children age alongside the player. A founder who
 *  starts at twenty, has a child at thirty and dies at ninety leaves an eldest
 *  who is SIXTY, and the player who chose to carry on found themselves in the
 *  chair at an age where the mortality curve is already steep. Reported as
 *  "the heir takes over and is a hundred".
 *
 *  So the fallback is the eldest who is still under `MORTALITY_START_AGE` -
 *  the eldest of the ones with a life in front of them. It is still the
 *  traditional answer, it is still not a reward for anything, and the
 *  siblings will still have views.
 *
 *  If every grown child is past it, the YOUNGEST takes over instead. A family
 *  that left this until everybody was old hands to whoever has the most time,
 *  which is the only sensible thing left to do.
 *
 * `null` when there is nobody of age, which is its own ending. It has to be
 * possible or naming a successor costs nothing.
 */
export const successorFor = (
    children: readonly Candidate[],
    designatedSuccessorId: string | null,
): Candidate | null => {
    const grown = children.filter(c => (c?.age ?? 0) >= SUCCESSION_AGE);
    // Nobody old enough TODAY. Not the end of the line - see `heirInWaiting`,
    // which is what planSuccession asks next.
    if (grown.length === 0) return null;

    const named = designatedSuccessorId
        ? grown.find(c => c.id === designatedSuccessorId)
        : undefined;
    if (named) return named;

    // Ties are broken by order in the family rather than by chance: an
    // inheritance that comes out differently on a reload is not an
    // inheritance. `>` rather than `>=` keeps the first one written down.
    const eldestOf = (list: readonly Candidate[]) =>
        list.reduce((oldest, c) => (c.age > oldest.age ? c : oldest), list[0]);

    const withTimeLeft = grown.filter(c => c.age < MORTALITY_START_AGE);
    if (withTimeLeft.length > 0) return eldestOf(withTimeLeft);

    // Everybody is old. Whoever has the most time.
    return grown.reduce((youngest, c) => (c.age < youngest.age ? c : youngest), grown[0]);
};

// ============================================================================
//  AND IF THE ONLY HEIR IS A CHILD
// ============================================================================
//
//  `successorFor` answering null used to end the run: `diedWithoutAnHeir`, the
//  same ending as dying with nobody at all. Which is not the same thing and
//  reads as a punishment for the timing of a death rather than for anything
//  the player did - a founder who had a son at eighty gets the barren ending.
//
//  Reported as "heir kac yasinda olsa da gecilmeli". So a family with a child
//  in it always continues, and the years it takes are simply skipped: the
//  company is held until the eldest turns sixteen, and the game resumes on the
//  morning they take the chair.
//
//  WHY THE ELDEST rather than the named one. Being named is a reward and it is
//  honoured everywhere else - see `successorFor` above, where it wins even at
//  seventy. Here it would cost the family a decade for a preference, because
//  the eldest is by definition the one who arrives soonest. The named heir
//  inherits their share either way; what they do not get is to make everybody
//  wait.
//
//  NO CAP ON THE WAIT, deliberately. A limit puts the dead end back for
//  exactly the case this exists to remove, and a newborn is the case that
//  needs it most.
// ============================================================================

/** Who takes over eventually, and how long the chair stays empty. */
export type HeirInWaiting = {
    heir: Candidate;
    /** Whole years until they reach SUCCESSION_AGE. Always at least one. */
    years: number;
};

export const heirInWaiting = (
    children: readonly Candidate[],
): HeirInWaiting | null => {
    const young = children.filter(c => Number.isFinite(c?.age));
    if (young.length === 0) return null;

    // The eldest, because they are the shortest wait. Ties go to the first
    // written down, like everywhere else in this file.
    const eldest = young.reduce((oldest, c) => (c.age > oldest.age ? c : oldest), young[0]);
    const years = Math.max(1, Math.ceil(SUCCESSION_AGE - eldest.age));
    return { heir: eldest, years };
};
