// src/data/events/pearEscalation.ts
//
// ============================================================================
//  PEAR, GETTING LOUDER, AND THEN THE ONE TIME HE IS NOT
// ============================================================================
//
//  Three letters and a text message.
//
//  The letters escalate with hostility and they are all the same document with
//  the temperature turned up: a reference number, a legal formula, and a
//  paragraph that is not quite a threat. He never signs any of them. Vogel is
//  travelling, permanently, for years.
//
//      high     patent - "we are writing to remind you"
//      extreme  suppliers - your assembler has been offered a better contract
//      extreme  price - the same product, under your cost, in one category
//
//  ---------------------------------------------------------------------------
//  AND THEN HE TEXTS
//  ---------------------------------------------------------------------------
//  Written in prompt 3, before any of this existed, in the cast file:
//
//      "MAIL ONLY, and this is the character. He does not have your number and
//       has never wanted it. If he ever texts you, something has broken in him
//       - which is a scene worth saving for."
//
//  This is the scene. Twenty prompts of a machine-enforced rule exist to make
//  one message land, and the audit would have rejected it - which is exactly
//  right, and why the break is DECLARED (see `channelBreak` in graph.ts)
//  rather than the rule being loosened.
//
//  What makes it work is that it is not a threat. He has nothing left to
//  threaten with; the letters were the threats. It is four sentences at
//  00:41 from a man who has been beaten in a category for the first time in
//  nineteen years and cannot go to sleep. He is not even angry. He is
//  interested, which is worse, and he says one true thing about the player's
//  father that he has been holding since the first letter.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { GameEvent } from '../../core/events/types';

/** He has to have been told no, and be at war rather than merely irritated. */
const AT_WAR = [
    { kind: 'flag' as const, flag: 'refusedPear' as const },
    { kind: 'quarterAtLeast' as const, quarter: 20 },
];

// ============================================================================
//  1. THE PATENT — a reminder, which is the polite form of a threat
// ============================================================================
export const pearPatent: Conversation = {
    id: 'event-pear-patent',
    channel: 'mail',
    from: 'pear',
    subject: 'Notice, portfolio overlap, ref 7724-B',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'pear',
            text: 'We are writing to remind you of Pear\'s patent portfolio in your operating categories. A schedule of relevant grants is attached.\n\nWe are not currently asserting infringement. Sent on behalf of Nathan Vogel.',
            choices: [
                { text: 'Have counsel read the schedule.', next: 'counsel' },
                { text: 'File it.', next: 'file' },
            ],
        },

        {
            id: 'counsel',
            speaker: 'pear',
            text: 'Acknowledged. Your counsel will find that four of eleven grants are borderline, but the remaining seven are the reason for this notice.',
            choices: [
                {
                    text: 'Noted.',
                    effects: [
                        { kind: 'capital', amount: -450_000 },
                        { kind: 'dial', dial: 'pearHostility', delta: 4 },
                        { kind: 'dial', dial: 'cfoTrust', delta: 3 },
                    ],
                },
            ],
        },

        {
            id: 'file',
            speaker: 'pear',
            text: 'Noted. This office issues forty such notices annually and litigates two.',
            choices: [
                {
                    text: '(file it)',
                    effects: [
                        { kind: 'dial', dial: 'pearHostility', delta: 6 },
                        { kind: 'brand', amount: -2 },
                    ],
                },
            ],
        },
    ],
};

export const pearPatentEvent: GameEvent = {
    id: 'pear-patent',
    when: [...AT_WAR, { kind: 'dialAtLeast', dial: 'pearHostility', band: 'high' }],
    chance: 0.20,
    cooldown: 8,
    conversation: pearPatent,
    headline: 'Pear is understood to have written to several smaller manufacturers about its patent portfolio.',
    priority: 3,
};

// ============================================================================
//  2. THE SUPPLIERS — not addressed to you at all
// ============================================================================
//  The cruellest of the three, because it is a courtesy copy of a letter sent
//  to somebody else. He is not negotiating with the player; he is negotiating
//  around them and sending a copy.
// ============================================================================
export const pearSuppliers: Conversation = {
    id: 'event-pear-suppliers',
    channel: 'mail',
    from: 'pear',
    subject: 'FW: Capacity commitment 2031-33, for your information',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'pear',
            text: 'Forwarded for your information:\n\n"...Pear offers a three-year exclusivity commitment across consumer assembly lines..."\n\nYour assembler has 40 days to respond.',
            choices: [
                { text: 'Match it.', next: 'match' },
                { text: 'Let them go.', next: 'letGo' },
            ],
        },

        {
            id: 'match',
            speaker: 'pear',
            text: 'We understand a competing commitment was made. That sum represents 9% of your revenue and 0.1% of ours. The ratio speaks for itself.',
            choices: [
                {
                    text: 'Noted.',
                    effects: [
                        { kind: 'capital', amount: -1_800_000 },
                        { kind: 'dial', dial: 'pearHostility', delta: 6 },
                        { kind: 'brand', amount: 2 },
                        {
                            kind: 'news',
                            headline: 'A contract assembler stays with its existing customer after a competing offer.',
                        },
                    ],
                },
            ],
        },

        {
            id: 'letGo',
            speaker: 'pear',
            text: 'Acknowledged. We will honour outstanding orders placed through them at prevailing market rates.',
            choices: [
                {
                    text: '(close)',
                    effects: [
                        { kind: 'dial', dial: 'pearHostility', delta: 8 },
                        { kind: 'brand', amount: -5 },
                        {
                            kind: 'news',
                            headline: 'Pear signs an exclusive capacity commitment with a major contract assembler.',
                        },
                    ],
                },
            ],
        },
    ],
};

export const pearSuppliersEvent: GameEvent = {
    id: 'pear-suppliers',
    when: [...AT_WAR, { kind: 'dialAtLeast', dial: 'pearHostility', band: 'extreme' }],
    chance: 0.20,
    cooldown: 8,
    conversation: pearSuppliers,
    headline: 'Pear is said to be locking in multi-year assembly capacity.',
    priority: 3,
};

// ============================================================================
//  3. THE PRICE — stated as an operational fact
// ============================================================================
export const pearPriceWar: Conversation = {
    id: 'event-pear-price-war',
    channel: 'mail',
    from: 'pear',
    subject: 'Pricing notification, consumer category',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'pear',
            text: 'As a courtesy: Pear will reduce consumer pricing by 18% to 24% across competing categories next month. It is not directed at any particular participant.',
            choices: [
                { text: 'It is directed at one participant.', next: 'directed' },
                { text: 'We will hold our price.', next: 'hold' },
            ],
        },

        {
            id: 'directed',
            speaker: 'pear',
            text: 'It is a property of the participants rather than of the decision. How competitors absorb margin compression is an internal matter.',
            choices: [
                {
                    text: '(close)',
                    effects: [
                        { kind: 'dial', dial: 'pearHostility', delta: 5 },
                        { kind: 'brand', amount: -4 },
                        {
                            kind: 'news',
                            headline: 'Pear cuts consumer prices across the board. Analysts expect margin pressure on smaller rivals.',
                        },
                    ],
                },
            ],
        },

        {
            id: 'hold',
            speaker: 'pear',
            text: 'A valid strategy for a premier brand; risky for others. We look forward to seeing the result.',
            choices: [
                {
                    text: 'So do I.',
                    effects: [
                        { kind: 'dial', dial: 'pearHostility', delta: 7 },
                        { kind: 'dial', dial: 'publicReputation', delta: 3 },
                        {
                            kind: 'news',
                            headline: 'Pear cuts consumer prices. At least one rival says it will not follow.',
                        },
                    ],
                },
            ],
        },
    ],
};

export const pearPriceWarEvent: GameEvent = {
    id: 'pear-price-war',
    when: [
        ...AT_WAR,
        { kind: 'dialAtLeast', dial: 'pearHostility', band: 'extreme' },
        { kind: 'quarterAtLeast', quarter: 32 },
    ],
    chance: 0.15,
    cooldown: 10,
    conversation: pearPriceWar,
    headline: 'Pricing pressure building in consumer electronics.',
    priority: 3,
};

// ============================================================================
//  4. 00:41
// ============================================================================
//  The channel break. See the note at the top of this file and `channelBreak`
//  in core/story/graph.ts.
// ============================================================================
export const pearMidnight: Conversation = {
    id: 'event-pear-midnight',
    channel: 'message',
    from: 'pear',
    channelBreak:
        'Pear is mail-only, and the cast file has said since prompt 3 that a '
        + 'text from him means something has broken in him. This is that scene '
        + 'and there is exactly one of it. The rule stays; this is the payoff '
        + 'the rule was accumulating.',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'pear',
            text: '00:41. Found this in our 2019 supplier register.\n\nYou took eleven market share points from me in a category I led for decades. Nobody has done that before.',
            choices: [
                { text: 'Is this a threat?', next: 'threat' },
                { text: 'It is nearly one in the morning.', next: 'oneInTheMorning' },
            ],
        },

        {
            id: 'threat',
            speaker: 'pear',
            text: 'No. I have sent you the threats. I wanted to know what it was like to type it.',
            choices: [
                { text: 'And?', next: 'and' },
                { text: 'Go to bed, Nathan.', next: 'goToBed' },
            ],
        },

        {
            id: 'oneInTheMorning',
            speaker: 'pear',
            text: 'It is 00:43. I have reviewed the category numbers all evening. I am clear-headed.',
            choices: [
                { text: 'And?', next: 'and' },
                { text: 'You sound frustrated.', next: 'looksLike' },
            ],
        },

        {
            id: 'looksLike',
            speaker: 'pear',
            text: 'Perhaps. I am aware of how it looks.',
            choices: [
                { text: 'And?', next: 'and' },
            ],
        },

        {
            id: 'and',
            speaker: 'pear',
            text: 'Your father was better than me in ways I never admitted. He lost only because he would not do the two or three things I was willing to do. I assumed you would be identical.',
            choices: [
                { text: 'I am not him.', next: 'notHim' },
                { text: 'I would like to be him.', next: 'likeToBe' },
            ],
        },

        {
            id: 'notHim',
            speaker: 'pear',
            text: 'Good. That makes the competition simpler. I will be in touch through formal channels.',
            choices: [
                {
                    text: '(close message)',
                    effects: [
                        { kind: 'flag', flag: 'droveHimToIt' },
                        { kind: 'dial', dial: 'pearHostility', delta: 12 },
                        { kind: 'dial', dial: 'publicReputation', delta: 4 },
                        {
                            kind: 'news',
                            headline: 'Pear loses category share for the first time in nineteen years. The company declined to comment.',
                        },
                    ],
                },
            ],
        },

        {
            id: 'likeToBe',
            speaker: 'pear',
            text: 'Then you will lose honorably as he did. I respect the choice, even as I prepare to acquire you in due course.',
            choices: [
                {
                    text: '(close message)',
                    effects: [
                        { kind: 'flag', flag: 'droveHimToIt' },
                        { kind: 'dial', dial: 'pearHostility', delta: 8 },
                        { kind: 'dial', dial: 'publicReputation', delta: 7 },
                        {
                            kind: 'news',
                            headline: 'Pear loses category share for the first time in nineteen years. The company declined to comment.',
                        },
                    ],
                },
            ],
        },

        {
            id: 'goToBed',
            speaker: 'pear',
            text: 'Fair advice. I will not use this number again.',
            choices: [
                {
                    text: '(close message)',
                    effects: [
                        { kind: 'flag', flag: 'droveHimToIt' },
                        { kind: 'dial', dial: 'pearHostility', delta: 10 },
                        { kind: 'dial', dial: 'publicReputation', delta: 5 },
                        {
                            kind: 'news',
                            headline: 'Pear loses category share for the first time in nineteen years. The company declined to comment.',
                        },
                    ],
                },
            ],
        },
    ],
};

export const pearMidnightEvent: GameEvent = {
    id: 'pear-midnight',
    when: [
        ...AT_WAR,
        { kind: 'noFlag', flag: 'droveHimToIt' },
        { kind: 'dialAtLeast', dial: 'pearHostility', band: 'extreme' },
        // The thing that actually causes it: you took the category off him,
        // or you went for the company itself. Not hostility alone - being
        // hated is not the same as having beaten anybody.
        {
            kind: 'any',
            of: [
                { kind: 'marketShareAtLeast', percent: 11 },
                { kind: 'flag', flag: 'movedOnPear' },
            ],
        },
    ],
    // Near-certain, because by this point it is not a random event. It is a
    // consequence with a delay.
    chance: 0.40,
    conversation: pearMidnight,
    headline: 'Unusual overnight trading in Pear. No announcement accompanied it.',
    priority: 6,
};
