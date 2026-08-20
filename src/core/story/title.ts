// src/core/story/title.ts
//
// ============================================================================
//  WHAT YOU ARE, IN TWO WORDS, ON THE HOME SCREEN
// ============================================================================
//
//  The line under the player's name said "Beta Tester, CEO Edition". It came
//  from `useUserStore.bio`, whose setter is never called from anywhere: a field
//  the player could not change, holding a placeholder, in the second most
//  looked at piece of text in the app.
//
//  ---------------------------------------------------------------------------
//  A CATALOGUE, NOT A LADDER
//  ---------------------------------------------------------------------------
//  The first version was one ladder off `companyValue` with an adjective on
//  front. It was correct and it was thin: two hundred quarters of play and the
//  line changed six times, so the thing meant to make progress felt was the
//  slowest moving text on the screen.
//
//  So it is a catalogue now. Every entry knows when it is earned and how much
//  it outranks the others, and the player wears the BEST ONE THEY HAVE. Four
//  tracks run at once and they overlap on purpose:
//
//    THE COMPANY      eight rungs, and the one everybody climbs.
//    THE HOUSE        eight more, and only a successor can reach them.
//    THE TABLES       two, off the casino, for a life the balance sheet does
//                     not record.
//    AND FOUR THINGS  that are not a rung at all.
//
//  ---------------------------------------------------------------------------
//  WHY BOTH LADDERS ARE EIGHT
//  ---------------------------------------------------------------------------
//  Because the second generation should not be climbing the first one's. An
//  heir who reaches a billion has done something different from a founder who
//  reached a billion, and the game has said so for twenty prompts: the company
//  carries and the person changes. The words carry that. The founder becomes an
//  INDUSTRIALIST and the heir becomes THE SECOND FOUNDER, at the same number,
//  and only one of them is a compliment.
//
//  Ranks are interleaved rather than stacked, so a successor is not
//  automatically wearing a better title than his father did. He is wearing a
//  different one at the same altitude.
//
//  ---------------------------------------------------------------------------
//  THE ADJECTIVE ONLY DECORATES THE COMPANY RUNG
//  ---------------------------------------------------------------------------
//  "Disgraced Magnate" is the whole point of having adjectives. "Celebrated
//  Founder of a Dynasty" is thirty one characters and truncates on the card,
//  and "Disgraced The One Who Bought Pear" is not English.
//
//  Everything outside the company ladder stands on its own, which is also the
//  truer reading: those titles are ALREADY a judgement, and a second one
//  stacked on top says less rather than more.
//
//  ---------------------------------------------------------------------------
//  AND IT HAS TO FIT ON ONE LINE
//  ---------------------------------------------------------------------------
//  The card renders it with `numberOfLines={1}`, so a long title does not wrap,
//  it silently truncates - the worst failure available here, because it happens
//  only to the players who earned the longest one. The test walks every string
//  this file can produce and asserts a ceiling.
//
//  PURE. No stores, no clock. `readTitle` in world.ts does the reading.
// ============================================================================

export type TitleWorld = {
    companyValue: number;
    /** From standing.ts: reputation plus what you are worth, 0 to 100. */
    standing: number;
    /** The player's own worth, not the company's. */
    netWorth: number;
    /** 1 is the founder. See core/story/succession.ts. */
    generation: number;
    /** How many children they have. */
    children: number;
    /** `usePlayerStore.reputation.casino`. Macau opens at 600. */
    casinoReputation: number;
    gender: 'male' | 'female';
    flags: {
        /** The trial went badly. */
        fbiGuilty?: boolean;
        /** You own Pear. */
        ownsPear?: boolean;
    };
};

export type TitleDef = {
    id: string;
    /** A function only where the label has to count something. */
    label: string | ((w: TitleWorld) => string);
    /** Higher wins when several are earned. */
    rank: number;
    /** Whether the company adjective is allowed in front of it. */
    decorated?: boolean;
    earned: (w: TitleWorld) => boolean;
};

const he = (w: TitleWorld, male: string, female: string) =>
    w.gender === 'female' ? female : male;

// ============================================================================
//  1. THE COMPANY
// ============================================================================
//  Eight rungs and the one everybody climbs. The FIRST one is a decision: he
//  inherited a factory and that is what he is, and a game about earning it must
//  not open by calling the player a chief executive in its first minute.
//
//  The last is a trillion, which almost nobody reaches, and that is correct.
//  A ladder whose top rung is comfortable is a ladder with no top rung.
// ============================================================================
export const COMPANY_RUNGS: { at: number; title: string }[] = [
    { at: 0, title: 'Factory Owner' },
    { at: 10_000_000, title: 'Manufacturer' },
    { at: 50_000_000, title: 'Chief Executive' },
    { at: 250_000_000, title: 'Industrialist' },
    { at: 1_000_000_000, title: 'Magnate' },
    { at: 10_000_000_000, title: 'Tycoon' },
    { at: 100_000_000_000, title: 'Titan of Industry' },
    { at: 1_000_000_000_000, title: 'Colossus' },
];

// ============================================================================
//  2. THE HOUSE
// ============================================================================
//  Eight more, and only a successor can reach any of them. Same thresholds as
//  the company ladder from the second rung on, so the two run alongside each
//  other rather than one above the other: an heir at a billion is HEAD OF THE
//  HOUSE where his father was a Magnate, at the same money, and the difference
//  is what the words say about how he got there.
//
//  "The Second Founder" is the one the whole track is for. It arrives at the
//  quarter an heir has grown the thing he was handed rather than held it, and
//  it is the nicest thing this game ever says to anybody.
// ============================================================================
export const HOUSE_RUNGS: { at: number; title: string }[] = [
    { at: 0, title: 'The Inheritor' },
    { at: 10_000_000, title: 'The One Who Kept It' },
    { at: 50_000_000, title: 'Keeper of the Name' },
    { at: 250_000_000, title: 'The Second Founder' },
    { at: 1_000_000_000, title: 'Head of the House' },
    { at: 10_000_000_000, title: 'Dynast' },
    { at: 100_000_000_000, title: 'Old Money' },
    { at: 1_000_000_000_000, title: 'Founder of a Dynasty' },
];

/** Below this, the world has stopped giving you the benefit of the doubt. */
export const DISGRACE_BELOW = 20;

/** And above this it has started giving you rather too much of it. */
export const CELEBRATED_ABOVE = 85;

/** Macau, the seventh room, and the only one worth a title. */
export const MACAU_REPUTATION = 600;

/** London, the fourth. Far enough in to be a habit rather than an evening. */
export const HIGH_ROLLER_REPUTATION = 300;

/** More children than most people have relatives. */
export const LARGE_FAMILY = 20;

const rungsToTitles = (
    rungs: { at: number; title: string }[],
    idPrefix: string,
    baseRank: number,
    extra: (w: TitleWorld) => boolean = () => true,
): TitleDef[] => rungs.map((rung, i) => ({
    id: `${idPrefix}-${i}`,
    label: rung.title,
    // Two apart, so the two ladders interleave at the same altitude rather
    // than one sitting permanently above the other.
    rank: baseRank + i * 10,
    decorated: idPrefix === 'company',
    earned: (w: TitleWorld) =>
        extra(w) && (Number.isFinite(w.companyValue) ? w.companyValue : 0) >= rung.at,
}));

export const TITLES: TitleDef[] = [
    ...rungsToTitles(COMPANY_RUNGS, 'company', 100),
    // +5 rather than +0: at the same money the house title wins, because a
    // successor who is still only as good as the ladder should be described
    // by the thing that is unusual about them.
    ...rungsToTitles(HOUSE_RUNGS, 'house', 105, w => (w.generation ?? 1) >= 2),

    // ------------------------------------------------------------------
    //  3. THE TABLES
    // ------------------------------------------------------------------
    //  Two, off `reputation.casino`, which is the one number in this game
    //  that records a life the balance sheet does not. Ranked at the height
    //  of the company rung they FEEL like rather than at the top: a Titan of
    //  Industry who also gambles is still a Titan, and demoting him to High
    //  Roller would be the tail wagging the dog.
    // ------------------------------------------------------------------
    {
        id: 'casino-high-roller',
        label: 'High Roller',
        // 132 sits just above the company's Industrialist (130) and just
        // below the house's Second Founder (135). Deliberately off the fives
        // the two ladders occupy, so a casino title can never tie with a rung.
        rank: 132,
        earned: w => (w.casinoReputation ?? 0) >= HIGH_ROLLER_REPUTATION,
    },
    {
        id: 'casino-macau',
        // The seventh room and the last one that opens. Nobody who has been
        // there needs telling what it means.
        label: 'Known in Macau',
        // Above Magnate (140), below Tycoon (150) and below Head of the
        // House (145). See the note on the rank above.
        rank: 142,
        earned: w => (w.casinoReputation ?? 0) >= MACAU_REPUTATION,
    },

    // ------------------------------------------------------------------
    //  4. AND FOUR THINGS THAT ARE NOT A RUNG AT ALL
    // ------------------------------------------------------------------
    {
        // Standing is capped at 100 and reaching it takes a clean record AND
        // real money, so this is the one title that needs both halves of the
        // prestige system at once. See core/story/standing.ts.
        id: 'beyond-reproach',
        label: 'Beyond Reproach',
        rank: 300,
        earned: w => (w.standing ?? 0) >= 100,
    },
    {
        // The wealth half, said out loud, and it wants the person rather than
        // the company: `netWorth` is what they actually hold.
        id: 'richest',
        label: w => he(w, 'The Richest Man Alive', 'The Richest Woman Alive'),
        rank: 310,
        earned: w => (w.standing ?? 0) >= 100 && (w.netWorth ?? 0) >= 10_000_000_000,
    },
    {
        // A dynasty measured the blunt way. The number is in the label because
        // twenty two children is funnier and sadder than "a large family".
        id: 'large-family',
        label: w => `${he(w, 'Patriarch', 'Matriarch')} of ${w.children}`,
        rank: 320,
        earned: w => (w.children ?? 0) >= LARGE_FAMILY,
    },
    {
        // One player in a thousand ever sees it and they should see nothing
        // else. Not "Celebrated Titan of Industry" with a footnote.
        id: 'bought-pear',
        label: 'The One Who Bought Pear',
        rank: 900,
        earned: w => !!w.flags?.ownsPear,
    },
];

/** The company rung alone, for the test and for anything that wants it. */
export const rungFor = (companyValue: number): string => {
    const worth = Number.isFinite(companyValue) ? companyValue : 0;
    let found = COMPANY_RUNGS[0].title;
    for (const rung of COMPANY_RUNGS) if (worth >= rung.at) found = rung.title;
    return found;
};

/**
 * The best title this player has earned.
 *
 * Exported separately from `titleFor` because the picker the player asked for
 * needs the LIST rather than the winner, and it should read that list from
 * here rather than growing its own copy of what counts as earned.
 */
export const earnedTitles = (w: TitleWorld): TitleDef[] =>
    TITLES.filter(t => t.earned(w)).sort((a, b) => a.rank - b.rank);

/**
 * What you are, right now.
 *
 * The adjective is the interesting half, and it decorates the COMPANY rung
 * only. A conviction beats the other two because it is the one thing in this
 * game a player cannot work off, and "Convicted Magnate" describes somebody
 * better than either word on its own.
 */
export const titleFor = (w: TitleWorld): string => {
    const earned = earnedTitles(w);
    const best = earned[earned.length - 1];
    if (!best) return COMPANY_RUNGS[0].title;

    const label = typeof best.label === 'function' ? best.label(w) : best.label;
    if (!best.decorated) return label;

    const standing = Number.isFinite(w.standing) ? w.standing : 50;
    const adjective = w.flags?.fbiGuilty ? 'Convicted'
        : standing < DISGRACE_BELOW ? 'Disgraced'
            : standing >= CELEBRATED_ABOVE ? 'Celebrated'
                : '';

    return adjective ? `${adjective} ${label}` : label;
};
