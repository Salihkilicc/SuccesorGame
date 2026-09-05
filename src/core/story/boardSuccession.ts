// src/core/story/boardSuccession.ts
//
// ============================================================================
//  THE BOARD HAS CHILDREN TOO
// ============================================================================
//
//  When the founder died, the player became their own child and the siblings
//  arrived on the register. Everybody ELSE at the table stayed exactly as they
//  were: Elena Vance, Victor K. and Sarah Jen sat in the same chairs with the
//  same names and the same grudges, one generation later, for as long as the
//  dynasty lasted.
//
//  Asked for as "kuruldakiler de degisse, ayni kisiler olamaz". Which is
//  right, and it is the same fiction the whole game is built on: the company
//  outlives the people, and the seat outlives the person in it.
//
//  ---------------------------------------------------------------------------
//  ONE SEAT IN, ONE SEAT OUT
//  ---------------------------------------------------------------------------
//  "Bolunmesin ikiye uce." A director's holding does NOT split among their
//  children the way the founder's estate does. The founder's estate splitting
//  is the point of that scene - it is how the siblings arrive and how control
//  slips. Doing it to every seat as well would double the board every
//  generation and dilute the player's own share against a crowd.
//
//  So: one heir per seat, the whole holding, the same origin. The register is
//  the same length afterwards and the share total is unchanged, and both of
//  those are checked rather than hoped for.
//
//  ---------------------------------------------------------------------------
//  WHAT CARRIES AND WHAT DOES NOT
//  ---------------------------------------------------------------------------
//  CARRIES: the shares, the seat, the trait, the surname, the origin. A
//  Vance is still a Vance and still difficult in the same way, which is more
//  interesting than re-rolling the board into strangers every generation.
//
//  DOES NOT: trust, relationship, the gestures you have paid for and the
//  fatigue you have built up. Those are a history with a PERSON and that
//  person is gone. Everybody starts at neutral, which for a Snake means the
//  same thing as for a Loyalist - see loyaltyOf, which inverts trust for a
//  Snake, so 50 is the one value that reads as neutral either way.
//
//  MOTIVATION AND PET ISSUE carry, for the same reason the trait does: a
//  family that cared about the dividend still cares about the dividend.
// ============================================================================

/** What this module needs from a director. Deliberately narrower than BoardMember. */
export interface SucceedableMember {
    id: string;
    name: string;
    shareCount: number;
    trait: string;
    trust: number;
    relationship?: number;
    motivation?: string;
    petIssue?: string;
    gestureCount?: number;
    fatigue?: Record<string, number>;
    isHostile: boolean;
    origin: string;
}

/**
 * A new person starts level with you.
 *
 * 50 rather than the 40 the siblings get: a sibling has just been passed over
 * and has a reason to be cool. A director's child inherited a seat and has no
 * opinion of you yet.
 */
export const SUCCESSOR_TRUST = 50;

/**
 * First names for the next generation.
 *
 * Authored rather than generated: a pool this size is readable, and a name
 * that lands badly can be taken out by deleting a line. Kept deliberately
 * plain - these are directors, not characters, and a memorable name here
 * would compete with the cast that does have a story.
 */
/**
 * The pool, with the one fact the names alone could not carry.
 *
 * ---------------------------------------------------------------------------
 *  WHY THE GENDER IS WRITTEN DOWN RATHER THAN GUESSED FROM THE NAME
 * ---------------------------------------------------------------------------
 *  It was not here at all, and the whole board went faceless the moment a
 *  generation turned. Measured over four generations: gen 1 had four
 *  portraits and gens 2, 3 and 4 had none, because a successor correctly
 *  misses the ancestor's file and the pool needs a gender to lend a face.
 *
 *  Guessing from the name would be a table of names mapping to genders in
 *  another file, which is this table with an extra step and a way to
 *  disagree with itself. The list is 24 lines long and each line knows.
 */
export const SUCCESSOR_NAMES: readonly { first: string; gender: 'male' | 'female' }[] = [
    { first: 'Adrian', gender: 'male' }, { first: 'Beatrice', gender: 'female' },
    { first: 'Caleb', gender: 'male' }, { first: 'Delia', gender: 'female' },
    { first: 'Emmett', gender: 'male' }, { first: 'Freya', gender: 'female' },
    { first: 'Gideon', gender: 'male' }, { first: 'Helena', gender: 'female' },
    { first: 'Isaac', gender: 'male' }, { first: 'Juno', gender: 'female' },
    { first: 'Konrad', gender: 'male' }, { first: 'Lena', gender: 'female' },
    { first: 'Marcus', gender: 'male' }, { first: 'Nadia', gender: 'female' },
    { first: 'Otto', gender: 'male' }, { first: 'Priya', gender: 'female' },
    { first: 'Quentin', gender: 'male' }, { first: 'Rosa', gender: 'female' },
    { first: 'Silas', gender: 'male' }, { first: 'Tessa', gender: 'female' },
    { first: 'Ulrich', gender: 'male' }, { first: 'Vera', gender: 'female' },
    { first: 'Wendell', gender: 'male' }, { first: 'Yusuf', gender: 'male' },
] as const;

/** The names on their own. Derived, so the two cannot drift apart. */
export const SUCCESSOR_FIRST_NAMES: readonly string[] =
    SUCCESSOR_NAMES.map(n => n.first);

/**
 * How old a director READS, for the portrait band and nothing else.
 *
 * Not a birthday and not simulated: no screen shows a director's age, and
 * inventing one that the rest of the game would then have to keep consistent
 * would be a fact nobody asked for. This exists because a board where every
 * inherited seat looks forty is duller than one with some grey in it, and the
 * pool splits at fifty.
 *
 * Deterministic on the id and the generation, like everything else here.
 */
const AGE_SPREAD = [41, 47, 53, 58, 44, 62, 50, 56] as const;

/**
 * The family name, taken off a full name.
 *
 * Handles the three shapes actually on this board: "Elena Vance" gives Vance,
 * "Victor K." gives K., and a single word gives itself. An initial is a
 * surname here - it is what the family is called, whatever the punctuation.
 */
export const surnameOf = (fullName: string): string => {
    const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';

    // ----------------------------------------------------------------------
    //  AND A NICKNAME IS NOT A FAMILY NAME
    // ----------------------------------------------------------------------
    //  Found by running a real succession rather than by reading: the board
    //  has a "Marcus 'The Wolf'" on it, so the last word came back as `Wolf'`
    //  with the closing quote still attached and his heir was christened
    //  "Helena Wolf'".
    //
    //  Quotes come off; the full stop does NOT, because "Victor K." is
    //  genuinely what that family is called and "Victor K" is a different
    //  looking man.
    // ----------------------------------------------------------------------
    return parts[parts.length - 1].replace(/["'‘’“”]/g, '');
};

/**
 * A stable number from a string.
 *
 * Deterministic on purpose. The same director in the same generation always
 * produces the same heir, so a save reloaded twice does not rename the board,
 * and a test can assert a name rather than a shape.
 */
const hash = (s: string): number => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
};

/**
 * What the heir of this seat is called.
 *
 * The surname is kept and the given name is drawn from the pool by the seat's
 * own id and the generation, so two directors never collide and the same seat
 * gives a different name each generation.
 */
export const heirNameFor = (member: SucceedableMember, generation: number): string => {
    const family = surnameOf(member.name);
    const pick = successorNameFor(member, generation).first;
    return family ? `${pick} ${family}` : pick;
};

/** The pool entry this seat draws in this generation. One index, one truth. */
const successorNameFor = (member: SucceedableMember, generation: number) =>
    SUCCESSOR_NAMES[hash(`${member.id}|${generation}`) % SUCCESSOR_NAMES.length];

/**
 * Which way this seat's heir was born, so a face can be lent to them.
 *
 * Comes from the SAME index that chose their first name, so Helena is never
 * handed a man's portrait. That is the failure the female prompts were
 * rewritten to fix and it would have come straight back here.
 */
export const heirGenderFor = (
    member: SucceedableMember,
    generation: number,
): 'male' | 'female' => successorNameFor(member, generation).gender;

/** How old this seat's heir reads. See the note on AGE_SPREAD. */
export const heirAgeFor = (member: SucceedableMember, generation: number): number =>
    AGE_SPREAD[hash(`${member.id}|age|${generation}`) % AGE_SPREAD.length];

/**
 * The same board, one generation on.
 *
 * ---------------------------------------------------------------------------
 *  IT DOES NOT ADD OR REMOVE ANYBODY
 * ---------------------------------------------------------------------------
 *  A director who was voted out, bought out or otherwise gone is already
 *  absent from this array, and nothing here brings them back - "eger yoksa
 *  gelmesin". Equally nothing here creates a seat that did not exist.
 *
 *  So the only thing that changes is WHO is sitting down. The cap table is
 *  untouched by construction: every share stays on the seat it was on.
 */
export const succeedBoard = <T extends SucceedableMember>(
    members: T[],
    generation: number,
): T[] =>
    (members ?? []).map(m => ({
        ...m,
        // A new id, so nothing that remembered the parent finds the child by
        // accident. Derived rather than random: reloading a save must not
        // shuffle the board.
        id: `${m.id}::g${generation}`,
        name: heirNameFor(m, generation),
        // ------------------------------------------------------------------
        //  AND A FACE TO GO WITH THE NAME
        // ------------------------------------------------------------------
        //  The four founding directors have portraits of their own. Their
        //  heirs cannot - they are generated - so they borrow one from the
        //  pool, and the pool needs to be told who it is lending to.
        //
        //  Without these two the whole board went blank the moment a
        //  generation turned. Measured over four: four portraits in the
        //  first, none in the second, third or fourth.
        //
        //  Both come from the same draw as the name, so Helena is never
        //  handed a man's face.
        // ------------------------------------------------------------------
        gender: heirGenderFor(m, generation),
        age: heirAgeFor(m, generation),
        // Untouched, and this is the load-bearing line: no splitting, no
        // rounding, no drift. The total on the register is identical.
        shareCount: m.shareCount,
        trait: m.trait,
        origin: m.origin,
        motivation: m.motivation,
        petIssue: m.petIssue,
        // A history with a person who is no longer here.
        trust: SUCCESSOR_TRUST,
        relationship: 50,
        gestureCount: 0,
        fatigue: {},
        isHostile: false,
    }));
