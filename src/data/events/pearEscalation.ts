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
    { kind: 'quarterAtLeast' as const, quarter: 10 },
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
            text:
                'We are writing to remind you of Pear\'s portfolio in the areas in which '
                + 'your current products operate. A schedule of the relevant grants is '
                + 'attached for your records.\n\n'
                + 'We are not at this time asserting any of them. This letter should not be '
                + 'construed as an allegation of infringement, and we would ask that it is '
                + 'not characterised as one.\n\n'
                + 'Sent on behalf of Nathan Vogel.',
            choices: [
                { text: 'Have counsel read the schedule.', next: 'counsel' },
                { text: 'File it.', next: 'file' },
            ],
        },

        {
            id: 'counsel',
            speaker: 'pear',
            // The reply to a reply is always the same document with one more
            // sentence, and the sentence is always about the record.
            text:
                'Acknowledged.\n\n'
                + 'Your counsel will find that four of the eleven grants are of doubtful '
                + 'relevance and that we have said so ourselves, in writing, in 2019.\n\n'
                + 'The remaining seven are the reason for the letter.',
            choices: [
                {
                    text: 'Seven.',
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
            text:
                'Noted.\n\n'
                + 'For the record, this office sends approximately forty such letters a '
                + 'year and litigates two. We have found the ratio to be stable.',
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
    chance: 0.4,
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
            text:
                'Forwarded for your information.\n\n'
                + '"...Pear is pleased to offer a three-year capacity commitment across all '
                + 'lines, at the volumes discussed, subject to exclusivity within the '
                + 'consumer category..."\n\n'
                + 'Your assembler has forty days to respond. We thought it courteous that '
                + 'you should hear it from us rather than from them.',
            choices: [
                { text: 'Match it.', next: 'match' },
                { text: 'Let them go.', next: 'letGo' },
            ],
        },

        {
            id: 'match',
            speaker: 'pear',
            // He does not gloat about the money. He observes the ratio, which
            // is the only thing he actually cares about.
            text:
                'We understand a competing commitment has been made.\n\n'
                + 'For context: the sum you have committed represents roughly nine percent '
                + 'of your annual revenue and under one tenth of one percent of ours. We '
                + 'note this not as a taunt but because the ratio is the whole of it.',
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
            text:
                'Acknowledged.\n\n'
                + 'We will of course honour any outstanding orders placed through them on '
                + 'your behalf, at the prevailing rate.',
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
    chance: 0.4,
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
            text:
                'As a courtesy: from the first of next month Pear will be reducing '
                + 'consumer pricing in the categories in which we compete with you, by '
                + 'between eighteen and twenty-four percent.\n\n'
                + 'This is a category decision and is not directed at any particular '
                + 'participant.',
            choices: [
                { text: 'It is directed at one participant.', next: 'directed' },
                { text: 'We will hold our price.', next: 'hold' },
            ],
        },

        {
            id: 'directed',
            speaker: 'pear',
            // The single most Vogel sentence in the game: he agrees, in a way
            // that makes agreeing worse than denying.
            text:
                'It is available to every participant in the category.\n\n'
                + 'We are aware that the effect is not evenly distributed. That is a '
                + 'property of the participants rather than of the decision.',
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
            text:
                'That is the correct decision for a company with a brand and the wrong one '
                + 'for a company without.\n\n'
                + 'We look forward to finding out which you are.',
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
        { kind: 'quarterAtLeast', quarter: 16 },
    ],
    chance: 0.35,
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
//
//  It is not a threat. The letters were the threats and they are finished. He
//  has nothing left to send, so he sends the only thing he has never sent,
//  from a number the player did not know he had - and the fact that he has it
//  is the loudest thing in the message.
//
//  He is not angry either. He is INTERESTED, which is worse from him, and he
//  says one true thing about the player's father that he has been holding
//  since the very first letter about a panel in Lisbon.
// ============================================================================
export const pearMidnight: Conversation = {
    id: 'event-pear-midnight',
    channel: 'message',
    from: 'pear',
    // ------------------------------------------------------------------
    //  THE DECLARED EXCEPTION
    // ------------------------------------------------------------------
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
            text: '00:41\n\nI have your number from the 2019 supplier register. I have had it for six years and this is the first time I have used it.\n\nYou took eleven points off me in a category I have led since before you could drive. Nobody has done that to me. Not once.',
            choices: [
                { text: 'Is this a threat?', next: 'threat' },
                { text: 'It is nearly one in the morning.', next: 'oneInTheMorning' },
            ],
        },

        {
            id: 'threat',
            speaker: 'pear',
            // The answer is no, and the no is worse.
            text: 'No. I have sent you the threats. There are three of them and you have read them all and they did not work.\n\nThis is the other thing. I wanted to know what it was like to type it.',
            choices: [
                { text: 'And?', next: 'and' },
                { text: 'Go to bed, Nathan.', next: 'goToBed' },
            ],
        },

        {
            id: 'oneInTheMorning',
            speaker: 'pear',
            text: 'It is 00:43 now. I have been sitting with the category numbers since nine.\n\nI am not upset. I want to be clear that I am not upset, because I know how this looks and I have thought about that too.',
            choices: [
                { text: 'And?', next: 'and' },
                { text: 'It looks like you are upset.', next: 'looksLike' },
            ],
        },

        {
            id: 'looksLike',
            speaker: 'pear',
            text: 'Yes.\n\nI am aware.',
            choices: [
                { text: 'And?', next: 'and' },
            ],
        },

        {
            id: 'and',
            speaker: 'pear',
            // The true thing, and it is generous, and it costs him everything
            // to say. This is the only warmth Vogel shows in the entire game.
            text: 'Your father was better than me and I have never said that out loud. He was slower and he was smaller and he was right about the things I was wrong about, and the reason he never beat me is that he would not do the two or three things I was willing to do.\n\nI assumed you would be him. I have run this company for four years on that assumption.',
            choices: [
                { text: 'I am not him.', next: 'notHim' },
                { text: 'I would like to be him.', next: 'likeToBe' },
            ],
        },

        {
            id: 'notHim',
            speaker: 'pear',
            // He is relieved. It is the closest he comes to a compliment and
            // it is also him deciding to stop being careful.
            text: 'No.\n\nGood. That is a great deal simpler.\n\nI will be in touch through the office.',
            choices: [
                {
                    text: '(he does not reply again)',
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
            text: 'Then you will lose, eventually, the way he did. Slowly, and with everybody\'s respect, and it will be entirely your own decision.\n\nI would think less of you if you chose differently. I would also buy you in about six years.',
            choices: [
                {
                    text: '(he does not reply again)',
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
            // He does. And he never uses the number again, which the player
            // will only notice in retrospect.
            text: 'Yes.\n\nThat was the correct thing to say and I will not use this number again.',
            choices: [
                {
                    text: '(he does not)',
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
    chance: 0.8,
    conversation: pearMidnight,
    headline: 'Unusual overnight trading in Pear. No announcement accompanied it.',
    priority: 6,
};
