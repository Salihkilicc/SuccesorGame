// src/data/story/castGenerations.ts
//
// ============================================================================
//  ARTHUR VANCE WOULD HAVE BEEN A HUNDRED AND FORTY
// ============================================================================
//
//  data/story/cast.ts is static, and it has to be: the scenes are written for
//  these people and validated against their ids. But a dynasty runs for
//  generations, and nothing in that file ever changed hands. By the fifth
//  Hale the chief financial officer was still Arthur Vance - a man whose own
//  tone line says he "has outlived four CEOs", which stopped being a joke and
//  became a fact about a corpse.
//
//  The board already turns over. `boardSuccession.succeedBoard` gives every
//  seat a new name, a new face and a new age each generation, and has done
//  since the first succession bug. The executives, the friend and the rival
//  heads were the ones nobody had got to.
//
//  ---------------------------------------------------------------------------
//  THE SEAT KEEPS ITS CHARACTER. THE PERSON CHANGES.
//  ---------------------------------------------------------------------------
//  Only the NAME, the GENDER and the AGE are here. The role and the tone stay
//  in cast.ts, untouched, and that is deliberate rather than lazy:
//
//    The scenes are written FOR the tone. The chief financial officer who
//    gives the board position first and his own second is not a personality
//    trait of Arthur Vance, it is what the seat does to whoever sits in it,
//    and every conversation in the game leans on it. Rewriting the tone per
//    generation would mean rewriting the scenes per generation.
//
//  So: a different person, the same job, the same way of doing it. Which is
//  also, as it happens, true of large companies.
//
//  ---------------------------------------------------------------------------
//  WHO IS NOT HERE, AND WHY
//  ---------------------------------------------------------------------------
//    father, brother   Generation one's story. The father dies in the script
//                      and the brother is the founding sibling; a later
//                      generation's siblings are real generated children and
//                      `succeedBoard` already seats them.
//    heir              Named by the player. See core/story/deliver.ts.
//    vulture, unknown  A fund, a withheld number, two institutions. None of
//    regulator, fbi    them is a person and none of them ages.
//    hacker            Cipher is a handle. Handles outlive their owners.
//
//  ---------------------------------------------------------------------------
//  GENERATION ONE IS EXACTLY WHAT THE CAST FILE ALREADY SAYS
//  ---------------------------------------------------------------------------
//  Copied, not referenced, so that this table can be read as a whole and so a
//  test can assert the two agree. If they ever disagree, the founder's game
//  changed without anybody meaning to, which is the one thing this file must
//  not be able to do.
//
//  PURE DATA. Who holds a seat in a given generation is core/story/castNow.ts.
// ============================================================================

/** One person, in one generation, in one seat. */
export type SeatHolder = {
    name: string;
    /** Which way they were drawn, and which pool they fall back to. */
    gender: 'male' | 'female';
    /** How old they read. Executives are not thirty. */
    age: number;
};

/**
 * The id a portrait for this person is filed under.
 *
 * ---------------------------------------------------------------------------
 *  THE SEAT IS NOT THE PERSON, AND THE POOL COULD NOT TELL
 * ---------------------------------------------------------------------------
 *  The pool picks a face by hashing an id, and the id being passed was the
 *  THREAD id - 'cfo' - which is the same for every holder of that seat. So
 *  the hash was the same, and the only thing separating one holder from
 *  another was whether they happened to be a different sex or age band.
 *
 *  MEASURED: thirteen collisions across the eight seats. Ingrid Sollberg and
 *  Mariela Fontana, the second and fourth chief financial officers, were the
 *  same photograph.
 *
 *  So every holder gets an id of their own. It doubles as the filename when
 *  a portrait is drawn for them - `cfo_g2.png` - which is how the thirty two
 *  stop being pool faces at all.
 */
export const seatPortraitId = (seat: string, generation: number): string =>
    `${seat}_g${Math.max(1, Math.floor(generation || 1))}`;

/**
 * Five deep, then it comes round again.
 *
 * FIVE because that is roughly as far as anybody plays and because a sixth
 * set would be four more names nobody reads. The loop is in castNow.ts and it
 * returns to the SECOND set rather than the first: generation one's people
 * are the founder's, and having the founder's chief financial officer walk
 * back in six generations later would read as the bug this file fixes.
 */
export const CAST_GENERATIONS: Record<string, readonly SeatHolder[]> = {
    // ------------------------------------------------------------------
    //  THE THREE WHO RUN IT WITH YOU
    // ------------------------------------------------------------------
    cfo: [
        { name: 'Arthur Vance', gender: 'male', age: 61 },
        { name: 'Ingrid Sollberg', gender: 'female', age: 54 },
        { name: 'Desmond Achebe', gender: 'male', age: 58 },
        { name: 'Mariela Fontana', gender: 'female', age: 63 },
        { name: 'Rasmus Thorsby', gender: 'male', age: 49 },
    ],
    coo: [
        { name: 'Dana Whitfield', gender: 'female', age: 52 },
        { name: 'Tomasz Wieczorek', gender: 'male', age: 57 },
        { name: 'Nadia Benali', gender: 'female', age: 46 },
        { name: 'Gerhard Muhl', gender: 'male', age: 60 },
        { name: 'Awa Coulibaly', gender: 'female', age: 51 },
    ],
    cto: [
        { name: 'Priya Raman', gender: 'female', age: 41 },
        { name: 'Sun-woo Baek', gender: 'male', age: 38 },
        { name: 'Elif Duran', gender: 'female', age: 44 },
        { name: 'Yohannes Girmay', gender: 'male', age: 36 },
        { name: 'Camila Bustos', gender: 'female', age: 43 },
    ],

    // ------------------------------------------------------------------
    //  THE ONE WHO IS NOT ON THE PAYROLL
    // ------------------------------------------------------------------
    //  Roughly the player's own age each time, because the point of him is
    //  that you came up together. Not exactly, because he is not a mirror.
    friend: [
        { name: 'Marco Alvarez', gender: 'male', age: 34 },
        { name: 'Beatrix Loewe', gender: 'female', age: 37 },
        { name: 'Kofi Mensah-Doyle', gender: 'male', age: 33 },
        { name: 'Sanne Vervoort', gender: 'female', age: 39 },
        { name: 'Emre Kavuncu', gender: 'male', age: 35 },
    ],

    // ------------------------------------------------------------------
    //  AND THE FOUR OUTSIDE
    // ------------------------------------------------------------------
    //  The companies persist and the people running them do not, which is
    //  the whole reason a rival is a company and not a man.
    pear: [
        { name: 'Nathan Vogel', gender: 'male', age: 47 },
        { name: 'Lucienne Barre', gender: 'female', age: 50 },
        { name: 'Anand Sreenivasan', gender: 'male', age: 44 },
        { name: 'Freya Oskarsdottir', gender: 'female', age: 53 },
        { name: 'Malik Ouedraogo', gender: 'male', age: 45 },
    ],
    edison: [
        { name: 'Hal Brennerman', gender: 'male', age: 59 },
        { name: 'Rosalind Ikeda', gender: 'female', age: 55 },
        { name: 'Viktor Halstead', gender: 'male', age: 62 },
        { name: 'Amara Nwachukwu', gender: 'female', age: 48 },
        { name: 'Cesare Lombardo', gender: 'male', age: 56 },
    ],
    openai: [
        { name: 'Wen Zhao-Lindqvist', gender: 'female', age: 43 },
        { name: 'Idris Farooqi', gender: 'male', age: 40 },
        { name: 'Hanne Bruun', gender: 'female', age: 47 },
        { name: 'Tarek Melhem', gender: 'male', age: 42 },
        { name: 'Xiomara Peralta', gender: 'female', age: 39 },
    ],
    swanson: [
        { name: 'Dr. Eleanor Ratliff', gender: 'female', age: 64 },
        { name: 'Dr. Osman Kaya', gender: 'male', age: 59 },
        { name: 'Dr. Ingeborg Rasch', gender: 'female', age: 67 },
        { name: 'Dr. Femi Adeyemi', gender: 'male', age: 61 },
        { name: 'Dr. Solveig Aune', gender: 'female', age: 58 },
    ],
};

/** How many are written before the table comes round again. */
export const GENERATIONS_WRITTEN = 5;
