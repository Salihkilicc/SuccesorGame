// src/features/love/logic/heirs.ts
//
// ============================================================================
//  THE CHILDREN HAVE WORKED OUT WHAT THE COMPANY IS
// ============================================================================
//
//  A succession system where the heir is a field on a store is a spreadsheet.
//  What makes it a story is that the OTHER ONES KNOW, and that they are people
//  about it: one of them is trying to be liked, one of them is running down
//  their brother, and the one who was chosen is quietly terrified of being
//  unchosen.
//
//  ---------------------------------------------------------------------------
//  WHICH SCENE, NOT WHETHER A SCENE
//  ---------------------------------------------------------------------------
//  Nothing here rolls. The state decides everything:
//
//    HOW OLD they are. Under sixteen a child has not worked out what the
//    company is, and a nine year old lobbying for the chairmanship is a joke
//    the game would only be able to tell once.
//
//    WHETHER THEY ARE ALONE. An only child has nobody to run down, so they
//    sell themselves instead - which is the sadder version and the one that
//    tells you more about them.
//
//    WHETHER THEY WERE CHOSEN. Passed over, they take it out on whoever was
//    not. Chosen, they defend a position nobody has attacked yet.
//
//  ---------------------------------------------------------------------------
//  ONCE A YEAR, AND NOT ALWAYS THE SAME MOUTH
//  ---------------------------------------------------------------------------
//  The first version let the loudest child speak every quarter, which with
//  three teenagers is a letter every three months from whoever is angriest -
//  and after a year it is the same child every time, because `pressure` is
//  stable. That drowns the player and it stops being a family: it becomes one
//  person's grievance on a timer.
//
//  So the speaker is drawn at RANDOM among everybody with something to say,
//  weighted by how much they have to say. The heir can write; so can the one
//  nobody chose; so can the quiet middle child having a bad year.
//
//  WEIGHTED rather than uniform, and that is the one judgement in here. Uniform
//  would make an ambitious passed-over sibling exactly as likely as a
//  contented heir, which throws away the only characterisation `pressure`
//  encodes. Weighted keeps the shape - you hear from the angry one more - while
//  making sure you do not ONLY hear from them.
//
//  PURE. No stores, no clock, no random.
// ============================================================================

/** Only what the rule needs. Keeps it testable without a Child. */
export type Heir = {
    id: string;
    name: string;
    age: number;
    /** 0-100. Drives who speaks first and how hard. */
    ambition: number;
    /** 0-100. The chosen one's anxiety runs off the gap with this. */
    loyalty: number;
};

/**
 * Old enough to understand what is being handed out.
 *
 * Sixteen, which is also the age the succession screen starts calling them a
 * candidate. Below it they are children and this system does not exist.
 */
export const HEIR_VOICE_AGE = 16;

/** Which of the three things a child has to say this quarter. */
export type HeirScene =
    /** The only one. Nobody to compete with, so they compete with nothing. */
    | 'alone'
    /** Somebody else was chosen. This is the one with the digs in it. */
    | 'passedOver'
    /** They were chosen, and there are others who were not. */
    | 'chosen';

export type HeirTurn = {
    speaker: Heir;
    scene: HeirScene;
};

/**
 * Pick one, weighted by how much each has to say.
 *
 * Exported so the test can see the distribution rather than infer it from
 * outcomes, which is the difference between checking a die and checking a
 * design.
 */
export const weightedPick = <T>(
    items: { item: T; weight: number }[],
    roll: () => number,
): T | undefined => {
    const total = items.reduce((sum, i) => sum + Math.max(0, i.weight), 0);
    if (total <= 0) return undefined;
    let n = roll() * total;
    for (const i of items) {
        n -= Math.max(0, i.weight);
        if (n <= 0) return i.item;
    }
    return items[items.length - 1]?.item;
};

/**
 * How much this child has to say.
 *
 * Ambition is most of it, and being passed over is worth a great deal on top -
 * which is the whole point: the loudest person in a succession is rarely the
 * one who won.
 */
export const pressure = (child: Heir, isHeir: boolean, hasSiblings: boolean): number => {
    if (child.age < HEIR_VOICE_AGE) return 0;
    let p = child.ambition;
    if (!isHeir && hasSiblings) p += 30;        // passed over
    // The chosen one only speaks when they are ambitious AND unsure, which is
    // what `loyalty` reads as here: a loyal heir has nothing to prove.
    if (isHeir) p = Math.max(0, p - child.loyalty);
    return p;
};

/**
 * Who speaks this quarter, and about what.
 *
 * `undefined` when nobody is old enough or nobody has anything to say, which
 * is most quarters and has to be. A family that files a grievance every three
 * months is not a family.
 */
export const heirTurnFor = (
    children: Heir[],
    designatedSuccessorId: string | null,
    /** Injected in tests. The game passes nothing. */
    roll: () => number = Math.random,
    /** Below this a child has nothing worth writing about. */
    threshold = 55,
): HeirTurn | undefined => {
    const grown = children.filter(c => c.age >= HEIR_VOICE_AGE);
    if (grown.length === 0) return undefined;

    const hasSiblings = children.length > 1;

    const candidates = grown
        .map(child => {
            const isHeir = !!designatedSuccessorId && child.id === designatedSuccessorId;
            return { child, isHeir, p: pressure(child, isHeir, hasSiblings) };
        })
        .filter(c => c.p >= threshold);

    if (candidates.length === 0) return undefined;

    const picked = weightedPick(
        candidates.map(c => ({ item: c, weight: c.p })),
        roll,
    );
    if (!picked) return undefined;

    const scene: HeirScene = !hasSiblings
        ? 'alone'
        : picked.isHeir ? 'chosen' : 'passedOver';

    return { speaker: picked.child, scene };
};
