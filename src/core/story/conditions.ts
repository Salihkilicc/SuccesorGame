// src/core/story/conditions.ts
//
// ============================================================================
//  WHAT A SCENE IS ALLOWED TO ASK
// ============================================================================
//
//  The mirror of effects.ts. A closed list of questions, described as data,
//  with no predicate a scene can supply.
//
//  Same reasoning, and one more: a condition written as a function cannot be
//  INSPECTED. The audit pass in prompt 2 has to be able to read a scene and
//  answer "can this ever open?" - which is possible when a condition is
//  `{ kind: 'flag', flag: 'fatherDead' }` and impossible when it is
//  `() => somethingComplicated()`.
//
//  A story that can be read by a machine can be checked by one. That is worth
//  more than the flexibility being given up.
//
//  ---------------------------------------------------------------------------
//  BANDS, NOT NUMBERS
//  ---------------------------------------------------------------------------
//  Dial conditions ask for a BAND - none / low / high / extreme - rather than
//  a threshold. `pearHostility >= 73` means nothing to whoever reads it next,
//  and if every scene picks its own number the dial has no shared meaning at
//  all. The bands are defined once in state.ts, and rebalancing them moves
//  every scene together rather than none of them.
// ============================================================================

import { band, type Band, type Dial, type Dials, type StoryFlag } from './state';

export type Condition =
    /** This has happened. */
    | { kind: 'flag'; flag: StoryFlag }
    /** This has NOT happened. */
    | { kind: 'noFlag'; flag: StoryFlag }
    /** A relationship is at least this warm/hostile. */
    | { kind: 'dialAtLeast'; dial: Dial; band: Band }
    /** A relationship is at most this warm/hostile. */
    | { kind: 'dialAtMost'; dial: Dial; band: Band }
    /** The game has reached a quarter. */
    | { kind: 'quarterAtLeast'; quarter: number }
    /** The company can afford something. */
    | { kind: 'capitalAtLeast'; amount: number }
    /**
     * The company is running out.
     *
     * The mirror of the above, and it did not exist - every condition in the
     * vocabulary asked whether the player had ENOUGH of something. A story
     * about a company cannot only be able to ask that: half its scenes are
     * about the quarter where the answer is no.
     */
    | { kind: 'capitalAtMost'; amount: number }
    /** The player personally can. */
    | { kind: 'cashAtLeast'; amount: number }
    /**
     * The workforce has stopped being happy.
     *
     * A raw number rather than a band, unlike the dials, and that is on
     * purpose: morale is not a relationship the story owns, it is an engine
     * figure with its own physics in core/market/workforce.ts. Inventing
     * story bands over it would give the same number two vocabularies.
     */
    | { kind: 'moraleAtMost'; value: number }
    /**
     * The player holds at least this much of the markets they compete in.
     *
     * A percent rather than a band, for the same reason as morale: share is an
     * engine figure with its own physics, not a relationship the story owns.
     * It is what "you took the category off him" actually means.
     */
    | { kind: 'marketShareAtLeast'; percent: number }
    /**
     * ...and the mirror, which is the half that matters more often.
     *
     * Added for the same reason `capitalAtMost` was: the vocabulary keeps
     * growing a way to ask whether the player has ENOUGH of something and then
     * has no way to ask the opposite. Losing is the more common state and the
     * one more scenes are about - the CTO's alarm is not "we are winning", it
     * is "they shipped it and we are not in the room".
     */
    | { kind: 'marketShareAtMost'; percent: number }
    /**
     * The line is short of the crew the plant needs, as a percent.
     *
     * 100 means fully staffed. Below that, `staffingRatio` in market/capacity.ts
     * scales production down by exactly this figure - so this is not a mood, it
     * is the multiplier on everything the company makes.
     *
     * NOT CAPPED AT 100, unlike the engine's own ratio. Overstaffing does not
     * raise output (the engine clamps it, deliberately: "fazla calisan uretimi
     * ARTIRMAZ - maasini odersin, hicbir sey uretmez") but it is a real and
     * expensive mistake, and a story that could only read the clamped figure
     * could not see it.
     */
    | { kind: 'staffingAtMost'; percent: number }
    /**
     * The lab is this small, or this empty.
     *
     * A count rather than a band because the number that matters is ZERO, and
     * zero is where the company starts: `useLaboratoryStore` initialises
     * `researcherCount: 0`. The founder ran this company for thirty years with
     * no research at all, and that is a fact about him sitting in a store
     * default rather than in any scene. It is the CTO's entire opening.
     */
    | { kind: 'researchersAtMost'; count: number }
    /** Every one of these holds. */
    | { kind: 'all'; of: Condition[] }
    /** At least one of these holds. */
    | { kind: 'any'; of: Condition[] }
    /** This does not hold. */
    | { kind: 'not'; of: Condition };

/** Everything a condition needs to know, handed in so it can be tested. */
export type World = {
    dials: Dials;
    flags: Partial<Record<StoryFlag, true>>;
    /** Quarters elapsed since the game began, 1-based. */
    quarter: number;
    capital: number;
    cash: number;
    /**
     * Employee morale, 0-100.
     *
     * READ FROM useGameStore, which is the one the engine actually advances.
     * useStatsStore carries a field of the same name that nothing updates -
     * see the note in core/story/world.ts.
     */
    morale: number;
    /**
     * The player's realised market share across every category, as a percent.
     *
     * The tick already computes this - `totalPlayerShare` - and it was not
     * being handed to the story, so no scene could react to the one number the
     * whole competitive game is about.
     */
    marketShare: number;
    /**
     * Headcount as a percent of the crew the current facility requires.
     *
     * From the last closed quarter's report (`headcount` / `crewRequired`),
     * which is where the tick already puts both halves. Deriving it here from
     * the facility tier and the staff store would be a second implementation
     * of a number the report has computed correctly all along.
     */
    staffing: number;
    /** How many people are in the lab. Zero at the start of every game. */
    researchers: number;
};

const ORDER: Band[] = ['none', 'low', 'high', 'extreme'];
const rank = (b: Band): number => ORDER.indexOf(b);

export const test = (c: Condition, w: World): boolean => {
    switch (c.kind) {
        case 'flag': return !!w.flags[c.flag];
        case 'noFlag': return !w.flags[c.flag];
        case 'dialAtLeast': return rank(band(w.dials[c.dial])) >= rank(c.band);
        case 'dialAtMost': return rank(band(w.dials[c.dial])) <= rank(c.band);
        case 'quarterAtLeast': return w.quarter >= c.quarter;
        case 'capitalAtLeast': return w.capital >= c.amount;
        case 'capitalAtMost': return w.capital <= c.amount;
        case 'cashAtLeast': return w.cash >= c.amount;
        case 'moraleAtMost': return w.morale <= c.value;
        case 'marketShareAtLeast': return w.marketShare >= c.percent;
        case 'marketShareAtMost': return w.marketShare <= c.percent;
        case 'staffingAtMost': return w.staffing <= c.percent;
        case 'researchersAtMost': return w.researchers <= c.count;
        case 'all': return c.of.every(x => test(x, w));
        case 'any': return c.of.some(x => test(x, w));
        case 'not': return !test(c.of, w);
    }
    const never: never = c;
    throw new Error(`Unhandled condition: ${JSON.stringify(never)}`);
};

/**
 * No condition at all means "always". Written out rather than left implicit
 * because most scenes have no gate, and `test(undefined)` is the call every
 * caller would otherwise have to remember to guard.
 */
export const testAll = (conditions: Condition[] | undefined, w: World): boolean =>
    (conditions ?? []).every(c => test(c, w));

/**
 * Which flags a condition mentions.
 *
 * For the audit in prompt 2: a scene gated on a flag nothing ever raises can
 * never open, and that is invisible by reading - the scene looks finished.
 * This walks the tree so the check can be mechanical.
 */
export const flagsMentioned = (c: Condition): StoryFlag[] => {
    switch (c.kind) {
        case 'flag':
        case 'noFlag':
            return [c.flag];
        case 'all':
        case 'any':
            return c.of.flatMap(flagsMentioned);
        case 'not':
            return flagsMentioned(c.of);
        default:
            return [];
    }
};
