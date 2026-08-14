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
            text: 'i am going to say something and then i am going to say a second thing and the second thing is the important one\n\nthere is a bloke. he used to do security for the assembler in penang and he does not any more, and the reason he does not is that he is very good at getting into places',
            choices: [
                { text: 'What is the second thing?', next: 'secondThing' },
                { text: 'Marco, no.', next: 'marcoNo' },
            ],
        },

        {
            id: 'marcoNo',
            speaker: 'friend',
            // He is relieved. The scene lets the player close it here and it
            // does not come back, and he never mentions it again.
            text: 'yeah\n\nyeah ok. i have been carrying his number around for a month feeling clever about it and i think i wanted someone to tell me not to\n\nforget it',
            choices: [
                {
                    text: 'Forgotten.',
                    effects: [{ kind: 'dial', dial: 'friendLoyalty', delta: 8 }],
                },
                { text: 'Tell me the second thing anyway.', next: 'secondThing' },
            ],
        },

        {
            id: 'secondThing',
            speaker: 'friend',
            // THE SECOND THING, and it is the whole ethic of the scene: he
            // will not be the one who introduced them.
            text: 'if you ring him, do not tell me\n\ni mean it. i do not want to know, and it is not because of you. it is because i have a company and a person called priya who has a mortgage and if this goes wrong i would like to be a man who genuinely did not know',
            choices: [
                { text: 'Then do not give me the number.', next: 'doNotGive' },
                { text: 'Send it.', next: 'sendIt' },
            ],
        },

        {
            id: 'doNotGive',
            speaker: 'friend',
            text: 'that is the correct answer and i am going to send it anyway, because if i do not you will find someone worse in about eight months\n\nat least this one is careful',
            choices: [
                {
                    text: 'That is not a reason.',
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
            text: 'sent\n\nlast thing and then i am going to go and be somewhere else: he does not do favours and he is not on your side. he is on the side of the invoice',
            choices: [
                {
                    text: 'Understood.',
                    effects: [
                        { kind: 'flag', flag: 'moleUnlocked' },
                        // Not a loyalty gain. He is not pleased with himself.
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
    chance: 0.5,
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
            // Every sentence is deniable. That is the character and it is also
            // what makes the player's answer feel like theirs.
            text: 'Marco said you might not.\n\nI do research. Public filings, supplier registers, shipping manifests, the things people put in job adverts without thinking. All of it legal, all of it boring, most of it nobody bothers to assemble.\n\nThat is the first tier.',
            choices: [
                { text: 'And the second tier?', next: 'secondTier' },
                { text: 'The first tier is fine.', next: 'firstTierOnly' },
            ],
        },

        {
            id: 'firstTierOnly',
            speaker: 'unknown',
            // A genuine, legal, mildly useful service. Taking it is not a
            // crime and the arc does not punish it - it simply does not open.
            text: 'Sensible. Most of what people pay me for on the second tier they could have had from the first with more patience.\n\nEighty thousand a year. You will get a document every quarter and it will be dull and about one in five will be worth the whole fee.',
            choices: [
                {
                    text: 'Send an invoice.',
                    effects: [
                        { kind: 'capital', amount: -80_000 },
                        { kind: 'flag', flag: 'moleEngaged' },
                        // Real value, no risk. This is the honest door and it
                        // is deliberately not worthless.
                        { kind: 'brand', amount: 2 },
                    ],
                },
                {
                    text: 'Not even that.',
                    effects: [{ kind: 'dial', dial: 'publicReputation', delta: 1 }],
                },
            ],
        },

        {
            id: 'secondTier',
            speaker: 'unknown',
            text: 'The second tier is the same information before it is public.\n\nI am not going to describe how on a telephone. I will say that nobody gets hurt, nothing gets broken, and the only person who ever goes to prison for it is the one at your end.',
            choices: [
                { text: 'That is an odd sales pitch.', next: 'oddPitch' },
                { text: 'Not interested.', next: 'notInterested' },
            ],
        },

        {
            id: 'oddPitch',
            speaker: 'unknown',
            // The most honest character in the game, and it is the criminal.
            text: 'It is an accurate one. I have been doing this for nine years and I have never once been the one in the room with the lawyers.\n\nYou are buying a document. Where it came from is a thing you will decide not to ask about, and that decision is the product.',
            choices: [
                {
                    text: 'What would the first one be?',
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
            // He does not push. The number stays live, which is worse than a
            // hard close - the player can come back, and knows it.
            text: 'Fine.\n\nThis number works for about two years. I will not contact you again.',
            choices: [
                {
                    text: '(delete the thread)',
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
        // ------------------------------------------------------------------
        //  HIS FIRST LINE NAMES MARCO, SO MARCO MUST HAVE SENT IT
        // ------------------------------------------------------------------
        //  `moleUnlocked` was already being raised by two OTHER arcs before
        //  this file existed - the CFO's "look into Braga" and the brother's
        //  Halberd disclosure - and both are reasonable ways to learn this
        //  world exists. Neither involves Marco.
        //
        //  Gated on the flag alone, a player who took either of those paths
        //  would get a stranger opening with "Marco said you might not" about
        //  a number Marco never sent. Nothing would have crashed; the scene
        //  would simply have been about something that did not happen.
        //
        //  The other two arcs keep raising the flag. It means "you now know
        //  this world exists", which is a real thing for a later prompt to
        //  read. It just is not this scene.
        // ------------------------------------------------------------------
        { kind: 'flag', flag: 'friendHelped' },
        { kind: 'noFlag', flag: 'friendRefused' },
    ],
    chance: 0.6,
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
            text: 'Pear\'s wholesale price book for the next two quarters. Every SKU, every volume band, every distributor discount.\n\nThree hundred thousand. It is worth more than that to you and we both know it, and I price on what I can get rather than what it is worth.',
            choices: [
                { text: 'How do I know it is real?', next: 'howDoIKnow' },
                { text: 'No.', next: 'no' },
            ],
        },

        {
            id: 'howDoIKnow',
            speaker: 'unknown',
            text: 'You will have last quarter\'s free, this afternoon, and you can check it against what they actually charged you.\n\nIf it is wrong you have lost an afternoon. If it is right you will pay me, and you will pay me again in November.',
            choices: [
                { text: 'Send it.', next: 'sendIt' },
                { text: 'No.', next: 'no' },
            ],
        },

        {
            id: 'sendIt',
            speaker: 'unknown',
            // He is right, which is the trap. The information is real and
            // immediately valuable, and the cost arrives in a different
            // quarter through a different door.
            text: 'It was right. You have checked; that is what the afternoon was for.\n\nAccount details are in the next message. Do not pay it out of the company.',
            choices: [
                {
                    text: 'Pay it.',
                    effects: [
                        { kind: 'capital', amount: -300_000 },
                        { kind: 'flag', flag: 'moleEngaged' },
                        // Real and large. It has to be, or the risk is a
                        // moralising tax rather than a decision.
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
                        // THE LINE THAT MOVES THE ODDS. Nothing tells the
                        // player it did.
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
            text: 'Noted.\n\nThe number still works.',
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
        { kind: 'noFlag', flag: 'fbiGuilty' },
        { kind: 'dialAtLeast', dial: 'pearHostility', band: 'high' },
    ],
    chance: 0.45,
    cooldown: 5,
    conversation: moleOffer,
    headline: 'Corporate intelligence firms report a busy quarter.',
    priority: 2,
};

// ============================================================================
//  4. THE LETTER — two tiers, and the tier is the odds
// ============================================================================
//  Identical text, different probability. That is the entire mechanism and it
//  is invisible: the player who bought once and the player who said "there
//  will be more" get exactly the same letter, and one of them gets it three
//  times sooner.
//
//  It is written as a request for assistance, because that is what the first
//  one always is.
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
            // The second letter, and it is the first one with the sentence
            // taken out. Nothing else changes.
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
                        // Cooperating early is worth something real, and the
                        // player has no way to know how much until later.
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
 *
 * A separate event rather than a modifier because the engine takes a fixed
 * chance per event, and the exclusive gates make exactly one of the two live
 * at a time. The player is never shown either number and nothing anywhere
 * says the odds moved - the only evidence is that it comes sooner.
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
