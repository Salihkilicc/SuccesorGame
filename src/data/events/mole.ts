// src/data/events/mole.ts
//
// ============================================================================
//  THE NUMBER, AND WHAT IT COSTS TO USE IT
// ============================================================================
//
//  The one arc in the game that is genuinely hidden. It needs Pear to have
//  become an enemy AND the friend to be close enough to hand over something
//  that could ruin him, and a player who has done neither will finish a whole
//  campaign without knowing it exists.
//
//  ---------------------------------------------------------------------------
//  THREE DOORS, AND ONLY THE THIRD IS THE CRIME
//  ---------------------------------------------------------------------------
//      1. Marco gives you a number. Costs nothing, commits to nothing, and
//         raises no flag beyond `moleUnlocked`. Almost everybody who reaches
//         this point will take the number - it would be strange not to.
//
//      2. You text it. `moleEngaged`. Still nothing has happened; you have
//         asked a stranger what they do.
//
//      3. You buy something. THIS is the one, and it is deliberately the
//         smallest, dullest thing in the arc: a pricing sheet. Not a
//         conspiracy - a spreadsheet, for money, from somebody who will not
//         say their name.
//
//  Splitting it three ways matters because the interesting failure is not
//  "player commits espionage". It is a player arriving at step three having
//  never once made a decision they would describe as a decision.
//
//  ---------------------------------------------------------------------------
//  THE FBI ODDS ARE A REAL QUANTITY, NOT A FLAG
//  ---------------------------------------------------------------------------
//  Two tiers, mutually exclusive, and the escalation is in the CHANCE rather
//  than in the gate:
//
//      moleEngaged, not repeated    ->  0.10 a quarter
//      moleRepeated                 ->  0.30 a quarter
//
//  So the first purchase is a risk somebody could reasonably take and the
//  second is a decision to keep doing it. The player is never shown either
//  number, and nothing in the game says the odds went up - the only evidence
//  is that the letter comes sooner, and by then there is nothing to do about
//  it.
//
//  The federal contact is built here rather than left as a flag for prompt 29
//  to consume, because a flag nothing reads is the exact failure this codebase
//  keeps producing. The three cases can be built on top; this makes the
//  consequence exist today.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { GameEvent } from '../../core/events/types';

/** He does not hand this over lightly, and both conditions are him, not you. */
const THE_DOOR_IS_THERE = [
    { kind: 'flag' as const, flag: 'fatherDead' as const },
    { kind: 'quarterAtLeast' as const, quarter: 80 },
    { kind: 'noFlag' as const, flag: 'friendRefused' as const },
    { kind: 'flag' as const, flag: 'friendHelped' as const },
    { kind: 'dialAtLeast' as const, dial: 'friendLoyalty' as const, band: 'extreme' as const },
    { kind: 'dialAtLeast' as const, dial: 'pearHostility' as const, band: 'high' as const },
];

// ============================================================================
//  1. THE HANDOVER
// ============================================================================
//  He is not offering a service. He is telling his friend about somebody he
//  met, badly, and regretting it while he types - which is the only way this
//  can arrive without the game endorsing it.
// ============================================================================
export const moleNumber: Conversation = {
    id: 'event-mole-number',
    channel: 'message',
    from: 'friend',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'friend',
            text: 'a contact who used to handle security for our assembler in penang is offering access. he is very effective at getting into places.',
            choices: [
                { text: 'What is the catch?', next: 'secondThing' },
                { text: 'Marco, no.', next: 'marcoNo' },
            ],
        },

        {
            id: 'marcoNo',
            speaker: 'friend',
            text: 'yeah ok. i had his number and i think i wanted someone to tell me not to. forgotten.',
            choices: [
                {
                    text: 'Forgotten.',
                    effects: [{ kind: 'dial', dial: 'friendLoyalty', delta: 8 }],
                },
                { text: 'Give me the details anyway.', next: 'secondThing' },
            ],
        },

        {
            id: 'secondThing',
            speaker: 'friend',
            text: 'if you contact him, do not tell me. i want zero involvement or knowledge if things go south.',
            choices: [
                { text: 'Then do not give me the number.', next: 'doNotGive' },
                { text: 'Send it.', next: 'sendIt' },
            ],
        },

        {
            id: 'doNotGive',
            speaker: 'friend',
            text: 'right call. but i am sending it anyway because you might need it sooner than you think.',
            choices: [
                {
                    text: 'Noted.',
                    effects: [
                        { kind: 'flag', flag: 'moleUnlocked' },
                        { kind: 'dial', dial: 'friendLoyalty', delta: 4 },
                    ],
                },
            ],
        },

        {
            id: 'sendIt',
            speaker: 'friend',
            text: 'sent. remember: he does not do favours, he only works for invoices.',
            choices: [
                {
                    text: 'Understood.',
                    effects: [
                        { kind: 'flag', flag: 'moleUnlocked' },
                        { kind: 'dial', dial: 'friendLoyalty', delta: -3 },
                    ],
                },
            ],
        },
    ],
};

export const moleNumberEvent: GameEvent = {
    id: 'mole-number',
    when: [...THE_DOOR_IS_THERE, { kind: 'noFlag', flag: 'moleUnlocked' }],
    chance: 0.25,
    cooldown: 6,
    conversation: moleNumber,
    headline: 'Security consultants report rising interest in supply-chain intelligence.',
    priority: 3,
};

// ============================================================================
//  2. THE UNKNOWN NUMBER
// ============================================================================
//  No greeting, no sign-off, and nothing in the first message that could be
//  reported to anybody. He is describing a service and the player is the one
//  who has to say the word.
// ============================================================================
export const moleFirstContact: Conversation = {
    id: 'event-mole-first-contact',
    channel: 'message',
    from: 'unknown',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'unknown',
            text: 'Marco said you might not.\n\nI compile market intelligence from filings, manifests, and supplier registers. Legal, thorough research.\n\nThat is tier one.',
            choices: [
                { text: 'And tier two?', next: 'secondTier' },
                { text: 'Tier one is fine.', next: 'firstTierOnly' },
            ],
        },

        {
            id: 'firstTierOnly',
            speaker: 'unknown',
            text: 'Eighty thousand a year. Quarterly reports on competitor supplier flows and public data synthesis.',
            choices: [
                {
                    text: 'Send an invoice.',
                    effects: [
                        { kind: 'capital', amount: -80_000 },
                        { kind: 'flag', flag: 'moleEngaged' },
                        { kind: 'brand', amount: 2 },
                    ],
                },
                {
                    text: 'Not interested.',
                    effects: [{ kind: 'dial', dial: 'publicReputation', delta: 1 }],
                },
            ],
        },

        {
            id: 'secondTier',
            speaker: 'unknown',
            text: 'Tier two is the same intelligence before public release. Confidential, high-value, and sensitive.',
            choices: [
                { text: 'How do you operate?', next: 'oddPitch' },
                { text: 'Not interested.', next: 'notInterested' },
            ],
        },

        {
            id: 'oddPitch',
            speaker: 'unknown',
            text: 'I source documents. You purchase them. The origin is something you choose not to question.',
            choices: [
                {
                    text: 'What would the first document be?',
                    effects: [
                        { kind: 'flag', flag: 'moleEngaged' },
                        {
                            kind: 'schedule',
                            conversation: 'event-mole-offer',
                            afterQuarters: 1,
                        },
                    ],
                },
                { text: 'Not interested.', next: 'notInterested' },
            ],
        },

        {
            id: 'notInterested',
            speaker: 'unknown',
            text: 'Understood. This channel remains open for two years.',
            choices: [
                {
                    text: '(delete thread)',
                    effects: [{ kind: 'dial', dial: 'publicReputation', delta: 2 }],
                },
            ],
        },
    ],
};

export const moleFirstContactEvent: GameEvent = {
    id: 'mole-first-contact',
    when: [
        { kind: 'flag', flag: 'moleUnlocked' },
        { kind: 'noFlag', flag: 'moleEngaged' },
        { kind: 'dialAtLeast', dial: 'pearHostility', band: 'high' },
        { kind: 'flag', flag: 'friendHelped' },
        { kind: 'noFlag', flag: 'friendRefused' },
    ],
    chance: 0.30,
    cooldown: 4,
    conversation: moleFirstContact,
    headline: 'Corporate intelligence firms report a busy quarter.',
    priority: 3,
};

// ============================================================================
//  3. THE OFFER
// ============================================================================
//  A pricing sheet. Deliberately the dullest possible crime: no conspiracy,
//  no drama, a spreadsheet for money. The player who has arrived here has made
//  three small decisions and is about to make a fourth.
//
//  Repeatable, and the second time is what changes the odds.
// ============================================================================
export const moleOffer: Conversation = {
    id: 'event-mole-offer',
    channel: 'message',
    from: 'unknown',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'unknown',
            text: 'Pear wholesale price book for the next two quarters: every SKU and distributor tier. Three hundred thousand.',
            choices: [
                { text: 'How do I verify authenticity?', next: 'howDoIKnow' },
                { text: 'No.', next: 'no' },
            ],
        },

        {
            id: 'howDoIKnow',
            speaker: 'unknown',
            text: 'I provide last quarter\'s actual pricing today for free to cross-reference against your invoices.',
            choices: [
                { text: 'Send verification.', next: 'sendIt' },
                { text: 'No.', next: 'no' },
            ],
        },

        {
            id: 'sendIt',
            speaker: 'unknown',
            text: 'Verification confirmed. Wire details attached. Do not remit from corporate accounts.',
            choices: [
                {
                    text: 'Pay fee ($300k).',
                    effects: [
                        { kind: 'capital', amount: -300_000 },
                        { kind: 'flag', flag: 'moleEngaged' },
                        { kind: 'brand', amount: 6 },
                        { kind: 'dial', dial: 'pearHostility', delta: 5 },
                        {
                            kind: 'news',
                            headline: 'Distributors report unusually well-targeted competitive pricing this quarter.',
                        },
                    ],
                },
                {
                    text: 'Pay it, and there will be more.',
                    effects: [
                        { kind: 'capital', amount: -300_000 },
                        { kind: 'flag', flag: 'moleEngaged' },
                        { kind: 'flag', flag: 'moleRepeated' },
                        { kind: 'brand', amount: 9 },
                        { kind: 'dial', dial: 'pearHostility', delta: 8 },
                        {
                            kind: 'news',
                            headline: 'Distributors report unusually well-targeted competitive pricing this quarter.',
                        },
                    ],
                },
            ],
        },

        {
            id: 'no',
            speaker: 'unknown',
            text: 'Noted. Channel remains active.',
            choices: [
                {
                    text: '(close)',
                    effects: [{ kind: 'dial', dial: 'publicReputation', delta: 1 }],
                },
            ],
        },
    ],
};

export const moleOfferEvent: GameEvent = {
    id: 'mole-offer',
    when: [
        { kind: 'flag', flag: 'moleEngaged' },
        { kind: 'dialAtLeast', dial: 'pearHostility', band: 'high' },
        { kind: 'noFlag', flag: 'fbiIndicted' },
        { kind: 'noFlag', flag: 'droveHimToIt' },
    ],
    chance: 0.15,
    cooldown: 8,
    conversation: moleOffer,
    headline: 'Market participants notice unusual pricing agility in consumer hardware.',
    priority: 3,
};

// ============================================================================
//  4. THE FBI FIRST CONTACT — standard and repeated
// ============================================================================
export const fbiFirstContact: Conversation = {
    id: 'event-fbi-first-contact',
    channel: 'mail',
    from: 'fbi',
    subject: 'Request for voluntary assistance, file 24-CR-0891',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'fbi',
            text:
                'This office is conducting an inquiry into the unauthorised disclosure of '
                + 'commercially sensitive material within the consumer electronics sector.\n\n'
                + 'You are not a subject of this inquiry. We are writing to a number of '
                + 'market participants to request voluntary assistance, and your company '
                + 'has been identified as one that may hold relevant records.\n\n'
                + 'A reply is not required.',
            choices: [
                { text: '"A reply is not required."', next: 'notRequired' },
                { text: 'Send them everything.', next: 'everything' },
            ],
        },

        {
            id: 'notRequired',
            speaker: 'fbi',
            text:
                'Acknowledged.\n\n'
                + 'For completeness: this office has issued the same request to eleven '
                + 'companies. Four have responded. We note responses and non-responses in '
                + 'the same schedule.\n\n'
                + 'No further action is required at this time.',
            choices: [
                {
                    text: '(file it)',
                    effects: [
                        { kind: 'flag', flag: 'fbiContacted' },
                        { kind: 'dial', dial: 'publicReputation', delta: -2 },
                    ],
                },
                { text: 'Send them what we have.', next: 'everything' },
            ],
        },

        {
            id: 'everything',
            speaker: 'fbi',
            text:
                'Received, and logged as voluntary.\n\n'
                + 'That distinction is worth more to you than it currently appears to be, '
                + 'and it stops being available on the day this office writes to you a '
                + 'third time.',
            choices: [
                {
                    text: 'Understood.',
                    effects: [
                        { kind: 'flag', flag: 'fbiContacted' },
                        { kind: 'dial', dial: 'publicReputation', delta: 4 },
                        {
                            kind: 'news',
                            headline: 'Several sector firms confirm they are assisting a federal inquiry.',
                        },
                    ],
                },
            ],
        },
    ],
};

/** Bought once. A risk somebody could reasonably take. */
export const fbiFirstContactEvent: GameEvent = {
    id: 'fbi-first-contact',
    when: [
        { kind: 'flag', flag: 'moleEngaged' },
        { kind: 'noFlag', flag: 'moleRepeated' },
        { kind: 'noFlag', flag: 'fbiContacted' },
    ],
    chance: 0.10,
    cooldown: 8,
    conversation: fbiFirstContact,
    headline: 'A federal inquiry into the sector is reported to be at an early stage.',
    priority: 4,
};

/**
 * Bought more than once. Three times the odds, same letter.
 */
export const fbiFirstContactRepeatEvent: GameEvent = {
    id: 'fbi-first-contact-repeat',
    when: [
        { kind: 'flag', flag: 'moleRepeated' },
        { kind: 'noFlag', flag: 'fbiContacted' },
    ],
    chance: 0.30,
    cooldown: 8,
    conversation: fbiFirstContact,
    headline: 'A federal inquiry into the sector is reported to be at an early stage.',
    priority: 4,
};
