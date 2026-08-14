// src/data/events/friendGossip.ts
//
// ============================================================================
//  WHAT COMES THROUGH THE CHANNEL
// ============================================================================
//
//  He talks too much to people he likes. That is the whole mechanism, and the
//  game is careful that the player is the one turning it into an advantage -
//  he is never trading, never hinting that he expects something, and never
//  aware that he is a source.
//
//  Three rungs, gated by friendLoyalty, and they are exclusive so exactly one
//  is possible at a time:
//
//      low      a rumour worth nothing, offered because he cannot help himself
//      high     a competitor's real timing, worth money
//      extreme  where Pear is soft - which he should not tell anybody, and
//               which he tells you at two in the morning
//
//  ALL THREE REQUIRE `noFlag: friendRefused`. A player who turned down the two
//  hundred thousand never sees any of them, is never told they exist, and is
//  never told why. See data/story/friendArc.ts.
//
//  ---------------------------------------------------------------------------
//  THE TOP RUNG IS THE ONLY PIECE OF REAL INTELLIGENCE IN THE GAME
//  ---------------------------------------------------------------------------
//  It has to cost him something to say, or it is a vending machine. So it is
//  told badly, at the wrong hour, by somebody who is going to regret it - and
//  the player can stop him, which is the one choice in the arc where being a
//  good friend is expensive.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { GameEvent } from '../../core/events/types';

const CHANNEL_OPEN = [
    { kind: 'flag' as const, flag: 'fatherDead' as const },
    { kind: 'noFlag' as const, flag: 'friendRefused' as const },
    { kind: 'flag' as const, flag: 'friendHelped' as const },
    { kind: 'quarterAtLeast' as const, quarter: 24 },
];

// ============================================================================
//  RUNG 1 — worth nothing, and he knows it
// ============================================================================
export const friendGossipSmall: Conversation = {
    id: 'event-friend-gossip-small',
    channel: 'message',
    from: 'friend',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'friend',
            text: 'heard a rumour this week: someone at microhard says their consumer line is "under review". might mean killing it, might be nothing.',
            choices: [
                { text: 'Where did you hear it?', next: 'where' },
                { text: 'Keep listening.', next: 'keep' },
            ],
        },
        {
            id: 'where',
            speaker: 'friend',
            text: 'a conference. from someone who heard it from someone else.\n\nso: likely nothing, just passing it along.',
            choices: [
                { text: 'Keep listening anyway.', next: 'keep' },
            ],
        },
        {
            id: 'keep',
            speaker: 'friend',
            text: 'always do.\n\ni am a terrible gossip. my one business skill.',
            choices: [
                {
                    text: 'It is a real one.',
                    effects: [{ kind: 'dial', dial: 'friendLoyalty', delta: 4 }],
                },
            ],
        },
    ],
};

export const friendGossipSmallEvent: GameEvent = {
    id: 'friend-gossip-small',
    when: [
        ...CHANNEL_OPEN,
        { kind: 'dialAtMost', dial: 'friendLoyalty', band: 'high' },
    ],
    chance: 0.15,
    cooldown: 5,
    conversation: friendGossipSmall,
    headline: 'Trade press picks up talk of a strategic review at Microhard.',
    priority: 1,
};

// ============================================================================
//  RUNG 2 — a date, and dates are worth money
// ============================================================================
//  The first thing he brings that a competitor would pay for, and he does not
//  know that. He is telling his friend about his week.
// ============================================================================
export const friendGossipReal: Conversation = {
    id: 'event-friend-gossip-real',
    channel: 'message',
    from: 'friend',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'friend',
            text: 'ok this one is real.\n\nfacespace is launching into your category in eleven weeks. they tried hiring my design head and pitched him the whole deck.',
            choices: [
                { text: 'Eleven weeks.', next: 'elevenWeeks' },
                { text: 'Does he know he told you?', next: 'doesHeKnow' },
            ],
        },
        {
            id: 'doesHeKnow',
            speaker: 'friend',
            text: 'he told me on purpose, showing off. people love bragging about jobs they turned down.\n\nhe is staying, i matched it.',
            choices: [
                { text: 'Eleven weeks.', next: 'elevenWeeks' },
            ],
        },
        {
            id: 'elevenWeeks',
            speaker: 'friend',
            text: 'eleven weeks, and they are pricing cheap.\n\ndo something clever with the heads-up.',
            choices: [
                {
                    text: 'Thank you. Genuinely.',
                    effects: [
                        { kind: 'dial', dial: 'friendLoyalty', delta: 6 },
                        { kind: 'brand', amount: 3 },
                        {
                            kind: 'news',
                            headline: 'FaceSpace is preparing a push into consumer hardware, according to people familiar.',
                        },
                    ],
                },
                {
                    text: 'Should you be telling me this?',
                    next: 'shouldYou',
                },
            ],
        },
        {
            id: 'shouldYou',
            speaker: 'friend',
            text: 'probably not? but someone told me in a pub. i am not running my friendships through legal.',
            choices: [
                {
                    text: 'Thank you.',
                    effects: [
                        { kind: 'dial', dial: 'friendLoyalty', delta: 8 },
                        { kind: 'brand', amount: 3 },
                        {
                            kind: 'news',
                            headline: 'FaceSpace is preparing a push into consumer hardware, according to people familiar.',
                        },
                    ],
                },
            ],
        },
    ],
};

export const friendGossipRealEvent: GameEvent = {
    id: 'friend-gossip-real',
    when: [
        ...CHANNEL_OPEN,
        { kind: 'dialAtLeast', dial: 'friendLoyalty', band: 'extreme' },
        { kind: 'noFlag', flag: 'knowsPearWeakness' },
    ],
    chance: 0.20,
    cooldown: 6,
    conversation: friendGossipReal,
    headline: 'Trade press picks up talk of a new consumer entrant.',
    priority: 1,
};

// ============================================================================
//  RUNG 3 — where Pear is soft
// ============================================================================
//  Two in the morning, and he should not be saying it. It costs him
//  something, which is the only thing that stops the channel being a vending
//  machine - and the player can stop him, which is the one moment in the arc
//  where being a decent friend is genuinely expensive.
// ============================================================================
export const friendPearWeakness: Conversation = {
    id: 'event-friend-pear-weakness',
    channel: 'message',
    from: 'friend',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'friend',
            text: 'are you up\n\ni have been sitting here deciding whether to send this after a late dinner.',
            choices: [
                { text: 'Go to bed, Marco.', next: 'goToBed' },
                { text: 'I am up.', next: 'iAmUp' },
            ],
        },

        {
            id: 'goToBed',
            speaker: 'friend',
            text: 'yeah you are right. better said in daylight anyway.\n\nnight x',
            choices: [
                {
                    text: 'Night.',
                    effects: [{ kind: 'dial', dial: 'friendLoyalty', delta: 10 }],
                },
            ],
        },

        {
            id: 'iAmUp',
            speaker: 'friend',
            text: 'the pear thing. we use the same assembler in penang, and their supply reps let something slip.',
            choices: [
                { text: 'What about them?', next: 'whatAbout' },
                { text: 'You should not tell me this.', next: 'shouldNot' },
            ],
        },

        {
            id: 'shouldNot',
            speaker: 'friend',
            text: 'i know. but i want to tell you.\n\ndo you want it or not?',
            choices: [
                { text: 'No. Not like this.', next: 'notLikeThis' },
                { text: 'Tell me.', next: 'whatAbout' },
            ],
        },

        {
            id: 'notLikeThis',
            speaker: 'friend',
            text: 'ok. you are stubborn and it is the right call.\n\nnight.',
            choices: [
                {
                    text: 'Night.',
                    effects: [{ kind: 'dial', dial: 'friendLoyalty', delta: 12 }],
                },
            ],
        },

        {
            id: 'whatAbout',
            speaker: 'friend',
            text: 'pear is single sourced on display drivers, and the line retools this autumn. for six weeks they cannot increase volume at all. that is your window.',
            choices: [
                {
                    text: 'That is enormous.',
                    effects: [
                        { kind: 'flag', flag: 'knowsPearWeakness' },
                        { kind: 'dial', dial: 'friendLoyalty', delta: 5 },
                        { kind: 'brand', amount: 8 },
                        { kind: 'dial', dial: 'pearHostility', delta: 6 },
                        {
                            kind: 'news',
                            headline: 'Component analysts flag a retooling window in the display driver supply chain.',
                        },
                    ],
                },
                {
                    text: 'Do not tell anyone else.',
                    next: 'notAnyone',
                },
            ],
        },

        {
            id: 'notAnyone',
            speaker: 'friend',
            text: 'only telling you. sleep well.',
            choices: [
                {
                    text: 'Get some sleep.',
                    effects: [
                        { kind: 'flag', flag: 'knowsPearWeakness' },
                        { kind: 'dial', dial: 'friendLoyalty', delta: 9 },
                        { kind: 'brand', amount: 8 },
                        { kind: 'dial', dial: 'pearHostility', delta: 6 },
                        {
                            kind: 'news',
                            headline: 'Component analysts flag a retooling window in the display driver supply chain.',
                        },
                    ],
                },
            ],
        },
    ],
};

export const friendPearWeaknessEvent: GameEvent = {
    id: 'friend-pear-weakness',
    when: [
        ...CHANNEL_OPEN,
        { kind: 'dialAtLeast', dial: 'friendLoyalty', band: 'extreme' },
        { kind: 'flag', flag: 'friendGrewUp' },
        { kind: 'noFlag', flag: 'knowsPearWeakness' },
        { kind: 'dialAtLeast', dial: 'pearHostility', band: 'low' },
    ],
    chance: 0.25,
    cooldown: 4,
    conversation: friendPearWeakness,
    headline: 'Quiet talk of capacity constraints among the large assemblers.',
    priority: 3,
};

// ============================================================================
//  RUNG 4 — the other door
// ============================================================================
//  He offers you the company. Not because he is in trouble - because he has
//  had a real offer from somebody else and would rather it were you, and he
//  says so in a way that makes refusing perfectly easy.
//
//  The reward is REAL: it reprices Planora on the market at a little over half,
//  and the anchor moves with it so the discount does not evaporate in three
//  quarters. The player still has to go and buy it through the acquisition
//  screen like anything else.
// ============================================================================
export const friendOffersPlanora: Conversation = {
    id: 'event-friend-offers-planora',
    channel: 'message',
    from: 'friend',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'friend',
            text: 'i had a buyout offer for planora. real term sheet, serious buyer.',
            choices: [
                { text: 'Is it a good offer?', next: 'goodOffer' },
                { text: 'Do you want to sell?', next: 'doYouWant' },
            ],
        },

        {
            id: 'doYouWant',
            speaker: 'friend',
            text: 'i think so. nine years is long enough and i am tired.',
            choices: [
                { text: 'Is it a good offer?', next: 'goodOffer' },
            ],
        },

        {
            id: 'goodOffer',
            speaker: 'friend',
            text: 'fair price. but i would rather sell to you than a faceless fund.',
            choices: [
                { text: 'What are you asking?', next: 'whatAsking' },
                { text: 'Take their money, Marco.', next: 'takeTheirs' },
            ],
        },

        {
            id: 'takeTheirs',
            speaker: 'friend',
            text: 'fair enough. i will take their deal. come celebrate when it closes.',
            choices: [
                {
                    text: 'I will be there.',
                    effects: [
                        { kind: 'dial', dial: 'friendLoyalty', delta: 12 },
                        {
                            kind: 'news',
                            headline: 'Planora agrees a sale. The founder will stay through the transition.',
                        },
                    ],
                },
            ],
        },

        {
            id: 'whatAsking',
            speaker: 'friend',
            text: 'a solid discount. i want planora in good hands who will keep the team.',
            choices: [
                {
                    text: 'Then I will look at it properly.',
                    effects: [
                        { kind: 'flag', flag: 'planoraOffered' },
                        { kind: 'dial', dial: 'friendLoyalty', delta: 8 },
                        { kind: 'reprice', company: 'tech_planora', multiplier: 0.55 },
                        {
                            kind: 'news',
                            headline: 'Planora is understood to be in talks with a single named buyer.',
                        },
                    ],
                },
                {
                    text: 'I am not going to buy my friend\'s company.',
                    next: 'notGoingTo',
                },
            ],
        },

        {
            id: 'notGoingTo',
            speaker: 'friend',
            text: 'figured you might say that. you are right, keeping business separate is cleaner.',
            choices: [
                {
                    text: 'It would have.',
                    effects: [{ kind: 'dial', dial: 'friendLoyalty', delta: 10 }],
                },
                {
                    text: 'Let me look at the number at least.',
                    effects: [
                        { kind: 'flag', flag: 'planoraOffered' },
                        { kind: 'dial', dial: 'friendLoyalty', delta: 5 },
                        { kind: 'reprice', company: 'tech_planora', multiplier: 0.55 },
                    ],
                },
            ],
        },
    ],
};

export const friendOffersPlanoraEvent: GameEvent = {
    id: 'friend-offers-planora',
    when: [
        ...CHANNEL_OPEN,
        { kind: 'flag', flag: 'friendGrewUp' },
        { kind: 'noFlag', flag: 'planoraOffered' },
        { kind: 'dialAtLeast', dial: 'friendLoyalty', band: 'extreme' },
        { kind: 'quarterAtLeast', quarter: 80 },
    ],
    chance: 0.25,
    cooldown: 8,
    conversation: friendOffersPlanora,
    headline: 'Planora is said to have attracted interest.',
    priority: 3,
};
