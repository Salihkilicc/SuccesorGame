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
    // --- Bookkeeping
    /**
     * The opening scene has been put in the queue.
     *
     * A flag rather than a check on `pending`, because pending is DRAINED -
     * once the father's first message has been delivered there is nothing
     * left to look at, and the seeding would run again every time the player
     * passed through onboarding.
     */
    | 'openingQueued'
    // --- Year one
    | 'fatherDead'
    | 'soldToPear'
    /**
     * The refusal was public - it went in the news with the words in it.
     *
     * The quiet refusal and the loud one are the same decision and a
     * completely different fact about the player, and everybody who writes to
     * them afterwards knows which one happened. Without this the condolence
     * wave has to guess, and four characters guessing the same way is how a
     * cast starts sounding like one person.
     */
    /**
     * Pear was told no, either way.
     *
     * Separate from `refusedPearPublicly` because it answers a different
     * question. This one is "has the player replied at all" - and the
     * condolence wave waits on it, because every one of those four letters is
     * written by somebody who already knows the answer. Queued before the
     * player has given one, they would be guessing.
     */
    | 'refusedPear'
    | 'refusedPearPublicly'
    // --- Unlocks
    | 'moleUnlocked'
    // --- The CFO's arc. Staged with flags rather than finer dial bands:
    //     cfoTrust starts at 50, which is already the 'high' band, so the only
    //     dial gates that mean anything are the two ENDS. The dial decides
    //     whether he opens up at all and whether he leaves; the flags decide
    //     how far along the telling has got.
    | 'cfoToldBoardRoom'
    | 'cfoToldBragaName'
    | 'cfoToldBragaTruth'
    | 'cfoResigned'
    /** The player kept paying Braga after learning what it was. */
    | 'bragaKeptPaying'
    /** The player stopped it. */
    | 'bragaStopped'
    | 'brotherPlottedOpenly'
    // --- The friend's arc.
    //
    //     `friendRefused` is the one that matters and it is the reason this
    //     arc needs flags at all. Every later friend scene requires its
    //     absence, so refusing him does not produce a scene, a warning or a
    //     closing door - it produces nothing, forever. See data/story/friend.
    | 'friendHelped'
    | 'friendRefused'
    | 'friendGrewUp'
    /** He told you where Pear is soft. Once. */
    | 'knowsPearWeakness'
    /** Planora is on the market at a price only you were offered. */
    | 'planoraOffered'
    // --- The mole.
    //
    //     `moleUnlocked` already existed and was raised in two places without
    //     ever being read. It is the door: the friend has given you a number.
    //     Walking through it is `moleEngaged`, and that is a different fact -
    //     the player who keeps the number and never uses it has done nothing.
    | 'moleEngaged'
    /** Used more than once. The FBI's odds change on this, not on the first. */
    | 'moleRepeated'
    /** Somebody federal has been in touch. Once is a courtesy; twice is not. */
    | 'fbiContacted'
    // --- The floor and the lab.
    //
    //     The COO and the CTO get FLAGS AND NO DIAL, and that is the design
    //     rather than a shortcut. Five dials is a stated ceiling ("the cost of
    //     one more is paid in every scene forever") and these two do not need
    //     a sixth, because they already have one each and the engine owns it:
    //     Dana's standing with you is employee morale, Priya's is the size of
    //     the lab. Both are numbers the player is already managing on a screen,
    //     which means neither of them can be repaired by picking the nice
    //     dialogue option - the only way to be on good terms with your COO is
    //     to pay the floor properly.
    /** She told you the line was short and you left it short. */
    | 'cooOverruled'
    /** The floor stopped. Not a metaphor - staffing and morale both gave way. */
    | 'plantWalkout'
    /**
     * You told the CTO yes.
     *
     * NAMED FOR WHAT IT ACTUALLY KNOWS. The obvious name was `labFunded`, and
     * it would have been a lie: no effect in the vocabulary can hire a
     * researcher, so a scene can only ever record that the player SAID yes.
     * Whether anybody was hired is a live number (`researchers`), and asking
     * both at once - backed it, still empty - is a scene she gets to have.
     */
    | 'labBacked'
    // --- Walking into somebody else's market.
    //
    //     THE ENTRY FLAGS ARE RAISED BY THE TICK, off units actually sold -
    //     not off owning a product. A design nobody has shipped is not a
    //     territorial fact and the incumbent has no way of knowing about it.
    //
    //     Consumer has no entry flag on purpose: the starter product is a
    //     phone, so the player has been in that market since the first
    //     quarter. Its incumbent is triggered by SHARE instead.
    | 'enteredRobotics'
    | 'enteredDeepTech'
    | 'enteredBioTech'
    //     And the two facts about the PLAYER rather than about a category.
    //     Which market you knelt in is bookkeeping and lives in
    //     useTerritoryStore; that you are somebody who knelt is a fact, and
    //     later scenes read it.
    | 'kneltToAGiant'
    | 'declaredWarOnAGiant'
    // --- Pear.
    /** You bid for Pear itself, hostile or otherwise. He noticed. */
    | 'movedOnPear'
    /** The night he texted. Once, ever. */
    | 'droveHimToIt'
    // --- Teaching. Raised by the screens the first year points at, so a
    //     lock clears on the ACTION rather than on a screen being opened.
    | 'tutorialProductionSet'
    | 'tutorialBonusPaid'
    | 'tutorialMarketingSet'
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
