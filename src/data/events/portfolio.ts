// src/data/events/portfolio.ts
//
// ============================================================================
//  THREE PEOPLE WHO WOULD LIKE TO BUY SOMETHING OFF YOU
// ============================================================================
//
//  Provenance again: the plan says "all three as in your notes", and those
//  notes are not in the repository. So these are written from the one-line
//  descriptions and from who these three people already are, which by now is
//  quite a lot.
//
//  ---------------------------------------------------------------------------
//  THE PRICE IS THE CHARACTERISATION
//  ---------------------------------------------------------------------------
//  The ordinary market exit is 0.85 of a subsidiary's current fair value -
//  see DIVESTITURE_DISCOUNT and the note above it: you cannot take a premium
//  on the way out, and "why are you selling?" drags the price down. Every one
//  of these three is deliberately NOT 0.85, and the distance from it is the
//  whole scene:
//
//      PEAR      1.25   He is not buying an asset. He is buying it not being
//                       yours, and he can price that however he likes.
//      HALBERD   0.55   He knows what your balance sheet looks like this
//                       quarter. That is the entire offer.
//      MARCO     0.80   Slightly under, and he apologises for it, and it is
//                       the only one of the three where the number is not the
//                       point.
//
//  ---------------------------------------------------------------------------
//  THE FUND ARRIVES WHEN IT HURTS, AND THAT IS NOT DECORATION
//  ---------------------------------------------------------------------------
//  Halberd's letter is gated on `capitalAtMost` - it can only reach a player
//  who is genuinely short. That is what makes 0.55 a real decision instead of
//  an obviously bad one: a company with money laughs at it and never sees it,
//  and a company three quarters from empty has to do arithmetic about a number
//  it hates.
//
//  It is also below the CFO's own warning threshold, so by the time it arrives
//  Arthur Vance has already told the player this was coming. Being warned and
//  then squeezed anyway is a better quarter than either half alone.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { Condition } from '../../core/story/conditions';
import type { GameEvent } from '../../core/events/types';

// ---------------------------------------------------------------------------
//  The three prices, named here rather than imported, for the reason written
//  out in territory.ts: story data may not reach into the engine, and doing it
//  does not fail loudly - it switches the audit's data/events pass off. Held
//  to the engine by a test.
// ---------------------------------------------------------------------------

/** He is buying it not being yours. */
export const PEAR_MULTIPLE = 1.25;
/** He knows what your quarter looks like. */
export const VULTURE_MULTIPLE = 0.55;
/** Under the odds, and he says so first. */
export const FRIEND_MULTIPLE = 0.80;

/**
 * Where "short of cash" starts.
 *
 * Deeper than the CFO's warning, which fires at two million - see
 * data/events/cashWarning.ts. He tells you it is coming; this is it arriving.
 * A fund that turned up at the same moment as the warning would make the
 * warning pointless, and the sequence is the point.
 */
export const SQUEEZE_THRESHOLD = 1_200_000;

// ============================================================================
//  1. PEAR — the tactical purchase
// ============================================================================
//  He tried to hire Streamify's people the week you bought it (see ripple.ts).
//  This is the other approach, and it is the one that should worry the player
//  more, because it is generous.
//
//  He offers over the odds and explains why in a way that leaves nothing to
//  argue with: the price is not about the company. Selling COOLS him - you
//  gave him what he wanted, and a man who has what he wants stops writing
//  letters - which makes it a genuinely tempting bad idea rather than a trap
//  with a sign on it.
// ============================================================================
const PEAR_OFFER: Condition[] = [
    { kind: 'flag', flag: 'fatherDead' },
    { kind: 'owns', company: 'tech_streamify' },
];

export const portfolioPear: Conversation = {
    id: 'event-portfolio-pear',
    channel: 'mail',
    from: 'pear',
    subject: 'Ref: CORP/ACQ/0442-1 — indicative offer',
    when: PEAR_OFFER,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'pear',
            text: 'We are prepared to acquire the streaming business from you at twenty-five per cent above its current assessed value, in cash, on a timetable of your choosing.\n\nThis is above what it is worth and we are aware of that. The figure has been approved and will not be revised downwards during the period of this letter.\n\nNo reasoning is offered because none would assist you.',
            choices: [
                { text: 'Offer the reasoning anyway.', next: 'reasoning' },
                { text: 'Why would I sell at all?', next: 'whySell' },
            ],
        },
        {
            id: 'reasoning',
            speaker: 'pear',
            // The one paragraph in the letter that is not a form, and it is
            // the most alarming thing in it because it is candid.
            text: 'Very well.\n\nThe business is worth what it is worth to anybody. It is worth twenty-five per cent more to us because it is currently yours, and every quarter it stays yours it appears in a slide about you rather than a slide about the category.\n\nWe are not buying a catalogue. We are buying a row in a spreadsheet moving from one column to another. At our size that is cheap.',
            choices: [
                { text: 'Why would I sell at all?', next: 'whySell' },
                {
                    text: 'Twenty-five over. Done.',
                    effects: [
                        { kind: 'divest', company: 'tech_streamify', priceMultiple: PEAR_MULTIPLE },
                        // He got what he wanted, and a man who has what he
                        // wanted stops writing letters. This is the only place
                        // in the game where his hostility comes DOWN by a
                        // meaningful amount, and it is for obeying him.
                        { kind: 'dial', dial: 'pearHostility', delta: -15 },
                        { kind: 'flag', flag: 'soldToPearTactically' },
                    ],
                },
            ],
        },
        {
            id: 'whySell',
            speaker: 'pear',
            text: 'Because it is more money than the asset is worth and you have other uses for money.\n\nI would add that we have made this offer four times in eleven years to four different companies, and three of them accepted. The fourth is no longer a company. I am not implying a connection; there is not one. I mention it because you would have found out and drawn one.',
            choices: [
                {
                    text: 'Then take it.',
                    effects: [
                        { kind: 'divest', company: 'tech_streamify', priceMultiple: PEAR_MULTIPLE },
                        { kind: 'dial', dial: 'pearHostility', delta: -15 },
                        { kind: 'flag', flag: 'soldToPearTactically' },
                    ],
                },
                {
                    text: 'It is not for sale.',
                    effects: [
                        // Refusing him costs nothing today and moves the dial
                        // that decides how the rest of his arc arrives.
                        { kind: 'dial', dial: 'pearHostility', delta: 8 },
                    ],
                },
            ],
        },
    ],
};

export const portfolioPearEvent: GameEvent = {
    id: 'portfolio-pear',
    when: PEAR_OFFER,
    chance: 0.6,
    cooldown: 10,
    conversation: portfolioPear,
    headline: 'Pear is understood to have approached Hale about a streaming asset.',
    priority: 2,
};

// ============================================================================
//  2. HALBERD — the squeeze
// ============================================================================
//  The automatic one. He does not arrive because a die came up; he arrives
//  because the player is short, which he can see from the outside, and he says
//  so in the first line.
//
//  Cheerful about the disaster, as always. He never threatens and never
//  pretends the offer is fair - he describes the player's position accurately,
//  which is worse than either.
// ============================================================================
const SQUEEZE: Condition[] = [
    { kind: 'flag', flag: 'fatherDead' },
    { kind: 'owns', company: 'tech_skynet' },
    // The whole mechanic. He cannot reach a company that is comfortable.
    { kind: 'capitalAtMost', amount: SQUEEZE_THRESHOLD },
];

export const portfolioVulture: Conversation = {
    id: 'event-portfolio-vulture',
    channel: 'mail',
    from: 'vulture',
    subject: 'The research asset',
    when: SQUEEZE,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'vulture',
            text: 'Your last two filings suggest you have between one and two quarters of cash, and the research business is the largest thing on your balance sheet that does not earn any.\n\nWe will take it at fifty-five per cent of assessed value. Wire within four working days.\n\nThat is a bad price and I want to be the one who tells you so, because somebody will and it may as well be the person offering it.',
            choices: [
                { text: 'That is theft.', next: 'theft' },
                { text: 'Sixty-five and we can talk.', next: 'haggle' },
            ],
        },
        {
            id: 'theft',
            speaker: 'vulture',
            // He agrees, without any pleasure and without moving.
            text: 'It is a price. Theft would be if I took it.\n\nYou are welcome to run a proper process — six weeks, three bidders, a fair number. I would advise it if you had six weeks. What I am selling is Thursday, and Thursday is the whole product.',
            choices: [
                { text: 'Sixty-five and we can talk.', next: 'haggle' },
                {
                    text: 'Fifty-five. Send the papers.',
                    effects: [
                        { kind: 'divest', company: 'tech_skynet', priceMultiple: VULTURE_MULTIPLE },
                        { kind: 'flag', flag: 'soldUnderPressure' },
                    ],
                },
            ],
        },
        {
            id: 'haggle',
            speaker: 'vulture',
            // The refusal, and the reason for it, which is the cruellest
            // sentence in the file because it is a compliment.
            text: 'No, and I will tell you why rather than pretend to consider it.\n\nIf you could wait for sixty-five you would not be reading this letter on a Tuesday. The price is fifty-five because of a fact about you, and negotiating it would mean I had been wrong about the fact.\n\nI hope very much that I am. Nothing would please me more than a company that does not need me.',
            choices: [
                {
                    text: 'Fifty-five, then.',
                    effects: [
                        { kind: 'divest', company: 'tech_skynet', priceMultiple: VULTURE_MULTIPLE },
                        { kind: 'flag', flag: 'soldUnderPressure' },
                    ],
                },
                {
                    text: 'We will find the money elsewhere.',
                    effects: [
                        // Refusing costs nothing and fixes nothing. He does not
                        // punish it, and the cash problem is still there in
                        // the morning - which is the point.
                        { kind: 'dial', dial: 'publicReputation', delta: 2 },
                    ],
                },
            ],
        },
    ],
};

export const portfolioVultureEvent: GameEvent = {
    id: 'portfolio-vulture',
    when: SQUEEZE,
    // NEAR CERTAIN, and it is allowed to be by the pool's own rule: an event
    // may be common when it is gated on a specific situation rather than on
    // time passing. Being one quarter from empty is about as specific as this
    // game gets, and a fund that noticed only 30% of the time would make the
    // squeeze a matter of luck rather than of the balance sheet.
    chance: 0.95,
    cooldown: 6,
    conversation: portfolioVulture,
    headline: 'Halberd Partners has approached Hale regarding a non-core asset.',
    // The highest in the pool, with the cash warning and the walkout. All
    // three are quarters where the player must act now.
    priority: 5,
};

// ============================================================================
//  3. MARCO — do not let it go to a stranger
// ============================================================================
//  He wants his company back, and he has picked the worst possible moment to
//  ask, which he knows, which is why he leads with it.
//
//  The number is under the odds and he says so before the player can. What he
//  is actually asking for is not a discount - it is to be told first, and the
//  scene's whole weight is that he had to ask for that.
//
//  Gated on the player being short as well, because the request only means
//  anything when selling is on the table. Asking to buy something nobody was
//  selling is a different and much smaller scene.
// ============================================================================
const FRIEND_ASK: Condition[] = [
    { kind: 'flag', flag: 'fatherDead' },
    { kind: 'owns', company: 'tech_planora' },
    { kind: 'capitalAtMost', amount: SQUEEZE_THRESHOLD * 2 },
];

export const portfolioFriend: Conversation = {
    id: 'event-portfolio-friend',
    channel: 'message',
    from: 'friend',
    when: FRIEND_ASK,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'friend',
            text: 'ok this is going to be awkward and im going to do it badly so bear with me\n\ni heard youre having a quarter. everyone has. and i know what happens next because i have been the thing that happens next\n\nif planora is on a list somewhere. can i be on the list',
            choices: [
                { text: 'It is not on a list.', next: 'notOnList' },
                { text: 'What can you pay?', next: 'whatPay' },
            ],
        },
        {
            id: 'notOnList',
            speaker: 'friend',
            // He does not accuse and does not sulk. He explains the thing he
            // has actually learned, which is that lists appear.
            text: 'ok. good\n\nsorry. i dont think youd lie to me, i think there isnt a list yet and then in six weeks there is one and it was never a decision anybody made\n\nthats how it went for me. nobody decided anything. i just got a call from a man i had never met',
            choices: [
                { text: 'What can you pay?', next: 'whatPay' },
                {
                    text: 'If it ever is, you are first.',
                    effects: [
                        // A promise costs nothing and is worth something to
                        // him. It is also, deliberately, not binding on
                        // anything - no flag, no schedule. Just the dial.
                        { kind: 'dial', dial: 'friendLoyalty', delta: 6 },
                    ],
                },
            ],
        },
        {
            id: 'whatPay',
            speaker: 'friend',
            text: 'eighty per cent of whatever the assessment says. thats everything i have plus what my brother in law will lend me and i already asked him which was its own evening\n\ni know thats under. im not going to pretend its a favour to you. im asking for the favour',
            choices: [
                {
                    text: 'Eighty. Take it home.',
                    effects: [
                        { kind: 'divest', company: 'tech_planora', priceMultiple: FRIEND_MULTIPLE },
                        { kind: 'dial', dial: 'friendLoyalty', delta: 20 },
                        { kind: 'flag', flag: 'gavePlanoraBack' },
                    ],
                },
                { text: 'I cannot take eighty right now.', next: 'cannot' },
            ],
        },
        {
            id: 'cannot',
            speaker: 'friend',
            // No damage. He does not read it as a betrayal and the dial does
            // not move, because refusing a favour is not a betrayal - which is
            // a thing this game should be willing to say about somebody, once.
            text: 'no i know. i did the same maths you just did and i got the same answer\n\nit was worth asking. thanks for reading it properly instead of doing the thing where you say we should get dinner',
            choices: [
                {
                    text: 'We should get dinner.',
                    effects: [{ kind: 'dial', dial: 'friendLoyalty', delta: 3 }],
                },
                { text: '(leave it)' },
            ],
        },
    ],
};

export const portfolioFriendEvent: GameEvent = {
    id: 'portfolio-friend',
    when: FRIEND_ASK,
    chance: 0.7,
    cooldown: 8,
    conversation: portfolioFriend,
    headline: 'Quiet interest in Planora from its former owner, according to two people.',
    priority: 2,
};
