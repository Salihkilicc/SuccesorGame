// src/core/story/state.ts
//
// ============================================================================
//  THE STORY'S MEMORY — WHAT IT REMEMBERS AND WHAT IT REFUSES TO
// ============================================================================
//
//  There are two ways to build "every choice affects everything", and only one
//  of them can be written.
//
//  THE ONE THAT COLLAPSES: remember every individual choice. `choice_47_taken`,
//  `choice_48_taken`. Two hundred choices is a space nobody can author against,
//  because a reaction has to ask about a combination rather than a fact. It
//  does not fail on day one - it fails in month six, when adding a scene means
//  reading every scene that came before it.
//
//  THE ONE THAT WORKS: choices move a handful of DIALS. Reactions read the
//  dials, never the choices. Someone who refused Pear three times and someone
//  who refused once but publicly are both simply hostile, and the writing for
//  "hostile" is written once.
//
//  The player cannot tell the difference. That is the point: it FEELS like
//  everything is remembered, while the content stays finite.
//
//  ---------------------------------------------------------------------------
//  DIALS vs FLAGS, and why both exist
//  ---------------------------------------------------------------------------
//  A DIAL is a relationship, 0-100, and it moves both ways. Trust can be
//  rebuilt; hostility can cool. Dials answer "how does this person feel about
//  me right now".
//
//  A FLAG is a fact that happened and cannot unhappen. Your father is dead.
//  You sold to Pear. The FBI cleared you. Flags answer "is this true".
//
//  Keeping them apart matters: a fact stored as a dial invites nonsense
//  (a father 40% dead), and a relationship stored as a flag throws away
//  everything between yes and no.
// ============================================================================

/**
 * The five relationships the story tracks.
 *
 * Five, and not more, on purpose. Every dial is a thing every scene may have
 * to react to, so the cost of one more is paid in every scene forever. These
 * five cover the cast that recurs; anyone else is written against the flags.
 */
export type Dial =
    /** Pear: 0 you took the deal and shut up, 100 open war. */
    | 'pearHostility'
    /** The rookie CEO: 0 he has written you off, 100 he would take a bullet. */
    | 'friendLoyalty'
    /** Your brother: 0 he is counting votes against you, 100 he is family. */
    | 'brotherTrust'
    /** The old CFO: 0 drafting his resignation, 100 he tells you everything. */
    | 'cfoTrust'
    /** The public: 0 a punchline, 100 the industry's story of the year. */
    | 'publicReputation';

export const DIALS: readonly Dial[] = [
    'pearHostility',
    'friendLoyalty',
    'brotherTrust',
    'cfoTrust',
    'publicReputation',
] as const;

export type Dials = Record<Dial, number>;

/**
 * WHERE EACH DIAL STARTS, and each of these is a story decision.
 *
 * Pear does not hate you yet - it has not noticed you. The rookie already
 * likes you; you came up together. Your brother is not hostile on day one,
 * he is disappointed, which is worse and more useful. The CFO is loyal to
 * your father rather than to you, so he starts guarded. The public has no
 * opinion at all, which is what 50 means here.
 */
export const INITIAL_DIALS: Dials = {
    pearHostility: 10,
    friendLoyalty: 60,
    brotherTrust: 40,
    cfoTrust: 50,
    publicReputation: 50,
};

/**
 * Facts. Adding one is cheap; the discipline is that a flag must name
 * something IRREVERSIBLE. If it can become false again, it is a dial.
 */
export type StoryFlag =
    // --- Year one
    | 'fatherDead'
    | 'soldToPear'
    // --- Unlocks
    | 'moleUnlocked'
    | 'brotherPlottedOpenly'
    // --- Verdicts
    | 'fbiCleared'
    | 'fbiGuilty'
    | 'casinoScandal';

export const clampDial = (v: number): number => Math.max(0, Math.min(100, Math.round(v)));

/**
 * Read a dial as a band rather than a number.
 *
 * Writing against `pearHostility >= 73` is how a story becomes unmaintainable:
 * the number means nothing to the next person, and every scene picks its own.
 * Four bands, named, and the boundaries live here once.
 */
export type Band = 'none' | 'low' | 'high' | 'extreme';

export const band = (value: number): Band => {
    if (value < 25) return 'none';
    if (value < 50) return 'low';
    if (value < 75) return 'high';
    return 'extreme';
};
