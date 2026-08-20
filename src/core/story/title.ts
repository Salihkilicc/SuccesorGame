// src/core/story/title.ts
//
// ============================================================================
//  WHAT YOU ARE, IN TWO WORDS, ON THE HOME SCREEN
// ============================================================================
//
//  The line under the player's name said "Beta Tester, CEO Edition". It came
//  from `useUserStore.bio`, which has a setter that NOTHING CALLS: a field the
//  player could never change, holding a placeholder, in the second most
//  looked at piece of text in the app.
//
//  ---------------------------------------------------------------------------
//  IT IS DERIVED, LIKE THE STANDING IS
//  ---------------------------------------------------------------------------
//  No new stored state, no `title` field anybody has to remember to update.
//  Every input already exists and already moves, so the line changes on the
//  quarter the thing it describes changes, and it cannot go stale.
//
//  Three inputs and each says something the other two cannot:
//
//    COMPANY VALUE gives the rung. It is what you run, and it is the one the
//    player is deliberately climbing.
//
//    STANDING colours it. Not reputation raw - `standing` from standing.ts,
//    which is reputation plus what you are worth, so being rich makes you
//    harder to disgrace. That is not a loophole, it is the observation the
//    whole prestige system is built on.
//
//    ONE FLAG OVERRIDES BOTH. Buying Pear is not a rung on a ladder.
//
//  ---------------------------------------------------------------------------
//  AND IT HAS TO FIT ON ONE LINE
//  ---------------------------------------------------------------------------
//  The card renders it with `numberOfLines={1}`, so a title that is too long
//  does not wrap, it silently truncates - which is the worst failure available
//  here, because it happens only to the players who earned the longest one.
//  The longest string this can produce is "Celebrated Titan of Industry", and
//  the test asserts a ceiling rather than trusting anybody to notice.
//
//  This is also why the GENERATION is not in it. "Second Generation Chief
//  Executive" is the best line this file could produce and it is thirty three
//  characters. It belongs on the profile, where there is room.
//
//  PURE. No stores, no clock. `readTitle` in world.ts does the reading.
// ============================================================================

/** What the company has to be worth for each rung, worst to best. */
export const TITLE_RUNGS: { at: number; title: string }[] = [
    // Where the game starts. He inherited a factory and that is what he is,
    // and a player whose first title is "Chief Executive" has been flattered
    // in the opening minute of a game about earning it.
    { at: 0, title: 'Factory Owner' },
    { at: 25_000_000, title: 'Chief Executive' },
    { at: 250_000_000, title: 'Industrialist' },
    { at: 2_000_000_000, title: 'Magnate' },
    { at: 20_000_000_000, title: 'Tycoon' },
    { at: 200_000_000_000, title: 'Titan of Industry' },
];

/** Below this the world has stopped giving you the benefit of the doubt. */
export const DISGRACE_BELOW = 20;

/** And above this it has started giving you rather too much of it. */
export const CELEBRATED_ABOVE = 85;

export type TitleInput = {
    companyValue: number;
    /** From standing.ts: reputation plus what you are worth, 0 to 100. */
    standing: number;
    flags: {
        /** The trial went badly. Beats every other adjective. */
        fbiGuilty?: boolean;
        /** You own Pear. Not a rung on a ladder. */
        ownsPear?: boolean;
    };
};

/** The rung alone, without the adjective. */
export const rungFor = (companyValue: number): string => {
    const worth = Number.isFinite(companyValue) ? companyValue : 0;
    let found = TITLE_RUNGS[0].title;
    for (const rung of TITLE_RUNGS) {
        if (worth >= rung.at) found = rung.title;
    }
    return found;
};

/**
 * What you are, right now.
 *
 * The adjective is the interesting half. A conviction beats everything because
 * it is the only thing in this game that a player cannot work off, and
 * "Convicted Magnate" is a more honest description of somebody than either
 * word on its own.
 */
export const titleFor = (input: TitleInput): string => {
    // Not a rung and not an adjective. One player in a thousand ever sees it
    // and they should see nothing else.
    if (input.flags?.ownsPear) return 'The One Who Bought Pear';

    const rung = rungFor(input.companyValue);
    const standing = Number.isFinite(input.standing) ? input.standing : 50;

    const adjective = input.flags?.fbiGuilty ? 'Convicted'
        : standing < DISGRACE_BELOW ? 'Disgraced'
            : standing >= CELEBRATED_ABOVE ? 'Celebrated'
                : '';

    return adjective ? `${adjective} ${rung}` : rung;
};
