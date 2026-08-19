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
//  ONE CHILD SPEAKS PER QUARTER, and it is the one with most to say - see
//  `pressure`. Three teenagers arriving in the same tick is a group chat, and
//  a group chat is not a scene.
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
    /** Below this nobody bothers. Keeps the quiet quarters quiet. */
    threshold = 55,
): HeirTurn | undefined => {
    const grown = children.filter(c => c.age >= HEIR_VOICE_AGE);
    if (grown.length === 0) return undefined;

    const hasSiblings = children.length > 1;

    const ranked = grown
        .map(child => ({
            child,
            isHeir: !!designatedSuccessorId && child.id === designatedSuccessorId,
        }))
        .map(({ child, isHeir }) => ({
            child, isHeir, p: pressure(child, isHeir, hasSiblings),
        }))
        .sort((a, b) => b.p - a.p);

    const top = ranked[0];
    if (!top || top.p < threshold) return undefined;

    const scene: HeirScene = !hasSiblings
        ? 'alone'
        : top.isHeir ? 'chosen' : 'passedOver';

    return { speaker: top.child, scene };
};
