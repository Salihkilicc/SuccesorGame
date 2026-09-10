// src/data/story/floorHints.ts
//
// ============================================================================
//  THE PEOPLE WHO WORK HERE, TELLING YOU WHAT YOU JUST DID
// ============================================================================
//
//  Asked for as a tutorial folded into the game rather than bolted onto the
//  front of it: the C-levels explain a mechanic at the moment the player runs
//  into it, after the father is gone and there is nobody left to narrate.
//
//  ---------------------------------------------------------------------------
//  IT IS A HINT SYSTEM AND NOT A TUTORIAL, AND THE NAME MATTERS
//  ---------------------------------------------------------------------------
//  A tutorial covers its material. Four of these seven are triggered by the
//  player making the mistake, so a player who never overbuilds never hears
//  about the warehouse, and that is CORRECT rather than a gap: the lesson
//  arrives when it bites or not at all. But it means nobody should read
//  "skipped the hints" as "skipped something complete".
//
//  ---------------------------------------------------------------------------
//  MESSAGES, NOT MAIL, AND THE REASON IS THE INBOX
//  ---------------------------------------------------------------------------
//  Mail in this game carries the field office, the board's demands, Pear and
//  the sponsors. A teaching line in that envelope is read as story, skimmed
//  and lost. A text from Dana reads like a colleague; the same words as a
//  letter read like a document, and documents get postponed.
//
//  All three C-levels are `channels: 'both'` and the brother is message only,
//  so every one of these is in a channel its sender already uses.
//
//  ---------------------------------------------------------------------------
//  THE THREE RULES THEY ARE WRITTEN TO
//  ---------------------------------------------------------------------------
//    AFTER THE FATHER. Every one is gated on `fatherDead`. The first year has
//    a narrator and does not need a second.
//
//    NO EXCLAMATION MARKS. These people are professionals reporting a
//    problem, and a raised voice would make the game sound like a helper app.
//    Pinned by a test, like the ban on dashes.
//
//    SHORT. Two sentences, three at the outside. A long hint is not read, and
//    an unread hint is worse than none because it taught nothing and spent the
//    quarter's one delivery. Also pinned.
//
//  One node each, no choices: `graph.ts` says a card with no choices means the
//  other person had the last word, and that is exactly the shape of somebody
//  telling you a thing you needed to know.
//  ---------------------------------------------------------------------------
//  AND THE SOURCE IS ENGLISH, WHICH WAS GOT WRONG FIRST TIME
//  ---------------------------------------------------------------------------
//  These were written straight into this file in Turkish and
//  `script.test.ts` caught it: every line a player reads is authored in
//  English here and translated in data/i18n/storyText.ts, keyed
//  `<conversation>/<node>`. The whole export tooling, the translator's view
//  and that test all rest on it, and a file that opts out is a file whose
//  Turkish nobody can find.
// ============================================================================

import type { Conversation } from '../../core/story/graph';

// ---------------------------------------------------------------------------
//  THE THRESHOLDS, AND WHERE EACH NUMBER COMES FROM
// ---------------------------------------------------------------------------
//  Written out rather than imported, for the reason recorded in
//  data/tutorial/sequence.ts: the reachability audit refuses story data that
//  reaches outside core/story and data/story, and it refuses it QUIETLY by
//  going blind on the folder. Each one is welded to its real source by
//  floorHints.test.ts instead.
// ---------------------------------------------------------------------------

/**
 * Everything available went, which is a shelf that emptied.
 *
 * Reads backwards at first: a hundred per cent sell-through is not triumph.
 * It means the last unit left and whoever came after it bought elsewhere. 98
 * rather than 100 because a run that ends on a handful of units is the same
 * story and rounding should not decide whether the COO notices.
 */
export const SOLD_OUT_PERCENT = 98;

/**
 * A full quarter of the STARTING plant's output, sitting unsold.
 *
 * `capacity.ts` tier one builds 4,500 units in a quarter. A pile that size is
 * an entire quarter of work that nobody bought, which is the thing worth
 * saying out loud - the storage rent is real but small, and the money that
 * actually went is the cost of building all of it.
 *
 * A FIXED number against a capacity that grows to 19,600 by tier five, and
 * that is right here rather than sloppy: the hint fires ONCE, is gated on the
 * father being dead, and is therefore aimed at a player still on the first or
 * second plant. `seenScenes` means it never returns to be wrong later.
 */
export const OVERSTOCKED_UNITS = 4_500;

/**
 * A tenth of what the company started with.
 *
 * `useStatsStore` opens at 3,000,000 of company capital. At 300,000 the
 * quarter's wages are in genuine question, which is the moment the CFO's line
 * is true rather than alarmist - and it is well above the insolvency
 * machinery, which only starts counting once capital has gone NEGATIVE. A
 * warning that arrives at the same time as the consequence is not a warning.
 */
export const THIN_CAPITAL = 300_000;

/** After the father, and only ever after him. */
const AFTER_HIM = { kind: 'flag', flag: 'fatherDead' } as const;

// ============================================================================
//  1. MARKETING FOUND THEM AND THE LINE COULD NOT FEED THEM
// ============================================================================
export const hintDemand: Conversation = {
    id: 'hint-demand',
    channel: 'message',
    from: 'coo',
    when: [AFTER_HIM, { kind: 'sellThroughAtLeast', percent: SOLD_OUT_PERCENT }],
    start: 'open',
    nodes: [{
        id: 'open',
        speaker: 'coo',
        // Dana speaks for the floor and does not soften it: short sentences,
        // concrete nouns. She names the problem and stops - what to do about
        // it is the player's job and she has never pretended otherwise.
        text: 'Marketing is working and there is nothing on the shelf. The customers it found are buying from somebody else.',
    }],
};

// ============================================================================
//  2. AND THE OTHER DIRECTION, WHICH COSTS MORE AND LOOKS LIKE NOTHING
// ============================================================================
export const hintStockCost: Conversation = {
    id: 'hint-stock-cost',
    channel: 'message',
    from: 'cfo',
    when: [AFTER_HIM, { kind: 'inventoryAtLeast', units: OVERSTOCKED_UNITS }],
    start: 'open',
    nodes: [{
        id: 'open',
        speaker: 'cfo',
        // Arthur gives the position first and dryly. He does not say "you
        // made a mistake"; he says what the ledger says, which is worse.
        text: 'We pay for every unit that comes off the line, not only the ones that sell. What is sitting in the warehouse is charging us rent.',
    }],
};

// ============================================================================
//  3. VALUABLE ON PAPER AND UNABLE TO MAKE PAYROLL
// ============================================================================
export const hintCashFlow: Conversation = {
    id: 'hint-cash-flow',
    channel: 'message',
    from: 'cfo',
    when: [AFTER_HIM, { kind: 'capitalAtMost', amount: THIN_CAPITAL }],
    start: 'open',
    nodes: [{
        id: 'open',
        speaker: 'cfo',
        // The one time Arthur is not dry, believe him. This is close to it,
        // and it is still one sentence longer than he would like.
        text: 'We are valuable on paper and there is no cash to make payroll. If you do not solve this we will be explaining ourselves to the bank.',
    }],
};

// ============================================================================
//  4. THE BROTHER, COUNTING YOUR SHARES OUT LOUD
// ============================================================================
//  A QUARTER RATHER THAN A TRIGGER, because his subject is not something the
//  player does - it is something that has been true since the will was read
//  and that they have probably not looked at yet.
//
//  His percentage is NOT written into the line. It is correct at quarter
//  eight of a fresh run and wrong the moment the player buys a single share,
//  and a number from Julian's mouth that the cap table contradicts is worse
//  than no number: he is the one character whose whole manner is that he has
//  checked. So he refers to it without stating it.
// ============================================================================
export const hintBoard: Conversation = {
    id: 'hint-board',
    channel: 'message',
    from: 'brother',
    when: [AFTER_HIM, { kind: 'quarterAtLeast', quarter: 8 }],
    start: 'open',
    nodes: [{
        id: 'open',
        speaker: 'brother',
        // Affectionate on the surface, auditing underneath. A compliment that
        // is really a question, and "just asking" after something that was
        // not one.
        text: 'Have you ever counted your votes on that board. When you want a decision to pass you are going to need me, or one of the others. Just asking.',
    }],
};

// ============================================================================
//  5. NOBODY IS COMPLAINING AND NOBODY IS TRYING
// ============================================================================
export const hintMorale: Conversation = {
    id: 'hint-morale',
    channel: 'message',
    from: 'coo',
    when: [AFTER_HIM, { kind: 'quarterAtLeast', quarter: 9 }],
    start: 'open',
    nodes: [{
        id: 'open',
        speaker: 'coo',
        // Angry on behalf of other people rather than herself.
        text: 'We pay the going rate and nobody is complaining. Nobody is doing anything extra either. Average money buys average work.',
    }],
};

// ============================================================================
//  6. THE NAME DOES NOT TRAVEL
// ============================================================================
export const hintSectorBrand: Conversation = {
    id: 'hint-sector-brand',
    channel: 'message',
    from: 'coo',
    when: [AFTER_HIM, { kind: 'categoriesOpenAtLeast', count: 2 }],
    start: 'open',
    nodes: [{
        id: 'open',
        speaker: 'coo',
        text: 'Brand does not travel between categories. In this new one our name means nothing to anybody and we are starting from zero.',
    }],
};

// ============================================================================
//  7. AND WHY THE SECOND MARKET WILL NOT OPEN
// ============================================================================
//  THE ONE TRIGGER THAT IS AN ABSENCE, and it is the most useful of the seven
//  because it fires at the moment of confusion rather than after the mistake.
//
//  A player three years in, with money in the bank, who is still selling one
//  thing, is a player who has tried the second category and been refused and
//  does not know why. Telling them at that moment is the whole point; telling
//  them in quarter one would be advice about a door they have not walked into.
//
//  `not` over `categoriesOpenAtLeast: 2` is how "still only the one" is said
//  in a vocabulary that only counts upwards.
// ============================================================================
export const hintSkillGate: Conversation = {
    id: 'hint-skill-gate',
    channel: 'message',
    from: 'cto',
    when: [
        AFTER_HIM,
        { kind: 'quarterAtLeast', quarter: 12 },
        { kind: 'capitalAtLeast', amount: 2_000_000 },
        { kind: 'not', of: { kind: 'categoriesOpenAtLeast', count: 2 } },
    ],
    start: 'open',
    nodes: [{
        id: 'open',
        speaker: 'cto',
        // Priya talks in what is possible, and is impatient with money
        // questions in a way she is slightly embarrassed about.
        text: 'You do not get into a new industry with money alone. Until we build the company skill it needs, that market is shut to us.',
    }],
};

/**
 * All seven, in the order they were specified.
 *
 * Exported as a list because three separate things need to walk it: the
 * conversation registry, the beat list, and the returning-player skip. Three
 * hand-maintained copies of one set is how one of them comes to be missing an
 * entry, silently, in the direction nobody tests.
 */
export const FLOOR_HINTS: readonly Conversation[] = [
    hintDemand,
    hintStockCost,
    hintCashFlow,
    hintBoard,
    hintMorale,
    hintSectorBrand,
    hintSkillGate,
] as const;

/** Their ids, for the skip and for the beat list. */
export const FLOOR_HINT_IDS: readonly string[] = FLOOR_HINTS.map(h => h.id);
