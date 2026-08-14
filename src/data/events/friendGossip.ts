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
    { kind: 'quarterAtLeast' as const, quarter: 11 },
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
            text: 'this is probably nothing but i heard it twice this week so i am passing it on\n\nsomeone at microhard is telling people their consumer line is "under review". could mean they are killing it. could mean a man in a meeting said a word',
            choices: [
                { text: 'Where did you hear it?', next: 'where' },
                { text: 'Keep listening.', next: 'keep' },
            ],
        },
        {
            id: 'where',
            speaker: 'friend',
            text: 'a conference. and then from someone who was at the same conference, which is how one rumour becomes two rumours\n\nso: nothing. i am aware it is nothing',
            choices: [
                { text: 'Keep listening anyway.', next: 'keep' },
            ],
        },
        {
            id: 'keep',
            speaker: 'friend',
            text: 'always do\n\ni am a terrible gossip. it is my one business skill',
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
    chance: 0.35,
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
            text: 'ok this one is actually something\n\nfacespace are launching into your category. not next year, eleven weeks. i know because they tried to hire my head of design on friday and he came and told me the whole pitch deck',
            choices: [
                { text: 'Eleven weeks.', next: 'elevenWeeks' },
                { text: 'Does he know he told you?', next: 'doesHeKnow' },
            ],
        },
        {
            id: 'doesHeKnow',
            speaker: 'friend',
            // A small joke that is also the character: he does not experience
            // any of this as espionage, because it is not.
            text: 'he told me on purpose, he was showing off. people love telling you about the job they did not take\n\nhe is staying by the way. i gave him the design lead thing i was going to give him anyway and now it looks like i fought for him',
            choices: [
                { text: 'Eleven weeks.', next: 'elevenWeeks' },
            ],
        },
        {
            id: 'elevenWeeks',
            speaker: 'friend',
            text: 'eleven. and they are going in cheap, which is the bit that should worry you rather than the date\n\nanyway. that is what i have. do something clever with it',
            choices: [
                {
                    text: 'Thank you. Genuinely.',
                    effects: [
                        { kind: 'dial', dial: 'friendLoyalty', delta: 6 },
                        // Real and usable: a quarter's warning is worth a
                        // brand point or two if the player acts on it.
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
            // The player checking is the moment the arc is quietly about, and
            // he does not understand the question - which is the answer.
            text: 'probably not? it is not my information\n\nit is not theirs either though. a bloke told me a thing in a pub. i am not going to start running my friendships through a lawyer',
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
    chance: 0.4,
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
            text: 'are you up\n\ni have had three glasses of something a man in a waistcoat described to me at length and i have been sitting here for twenty minutes deciding whether to send this',
            choices: [
                { text: 'Go to bed, Marco.', next: 'goToBed' },
                { text: 'I am up.', next: 'iAmUp' },
            ],
        },

        {
            id: 'goToBed',
            speaker: 'friend',
            // THE EXPENSIVE DECENT ANSWER. He is grateful, the player gets
            // nothing, and the door does not close - it just does not open
            // tonight. The scene can come round again.
            text: 'yeah\n\nyeah you are right. i will ring you about it when i am boring and it is daylight and i will probably not say it then either\n\nnight x',
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
            text: 'right\n\nthe pear thing. i have been sat next to their supply people twice this year because we use the same contract assembler in penang, which nobody knows and which i am now telling you',
            choices: [
                { text: 'What about them?', next: 'whatAbout' },
                { text: 'You should not tell me this.', next: 'shouldNot' },
            ],
        },

        {
            id: 'shouldNot',
            speaker: 'friend',
            text: 'no\n\ni know. i have thought about that and i have decided i do not care, which is not the same as it being fine\n\ndo you want it or not',
            choices: [
                { text: 'No. Not like this.', next: 'notLikeThis' },
                { text: 'Tell me.', next: 'whatAbout' },
            ],
        },

        {
            id: 'notLikeThis',
            speaker: 'friend',
            text: 'ok\n\nfor what it is worth i think you are being an idiot and i also think it is the right call, which is the most annoying combination of things to be on the end of\n\nnight',
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
            // The actual intelligence, and it is specific enough to be worth
            // something: a single point of failure with a date on it.
            text: 'they are single sourced on the display driver. one fab, one line, and the line is being retooled in the autumn\n\nfor about six weeks pear cannot increase volume on anything. they can hold, they cannot grow. if you were going to pick a quarter to take a category off them it is that one',
            choices: [
                {
                    text: 'That is enormous.',
                    effects: [
                        { kind: 'flag', flag: 'knowsPearWeakness' },
                        { kind: 'dial', dial: 'friendLoyalty', delta: 5 },
                        // A real, usable advantage. Pear cannot answer for a
                        // quarter, and the market notices the gap being taken.
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
            text: 'i am not going to tell anyone else, i am telling YOU, that is the entire\n\noh. yes. i see',
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
    chance: 0.5,
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
            text: 'sitting down? probably not, it is a tuesday\n\ni have had an offer for planora. a real one, from people with a data room and a lawyer who says "quantum" instead of "amount"',
            choices: [
                { text: 'Is it a good offer?', next: 'goodOffer' },
                { text: 'Do you want to sell?', next: 'doYouWant' },
            ],
        },

        {
            id: 'doYouWant',
            speaker: 'friend',
            // He is honest about being tired, which is the real reason
            // founders sell and almost never the reason they give.
            text: 'i think so? i am forty-one and i have run this for nine years and last month i realised i was excited about a spreadsheet\n\nthat is not a crisis. that is just what it is now',
            choices: [
                { text: 'Is it a good offer?', next: 'goodOffer' },
            ],
        },

        {
            id: 'goodOffer',
            speaker: 'friend',
            text: 'it is a fine offer. it is what the company is worth to somebody who has never met it\n\nwhich is why i am messaging you instead of signing it',
            choices: [
                { text: 'What are you asking?', next: 'whatAsking' },
                { text: 'Take their money, Marco.', next: 'takeTheirs' },
            ],
        },

        {
            id: 'takeTheirs',
            speaker: 'friend',
            // The player being decent, again, at a real cost - and the door
            // stays shut afterwards. This is the version most people should
            // take and the game does not reward it with anything but a
            // sentence.
            text: 'you are a genuinely terrible businessman and i am very glad about it\n\nfine. i will take theirs. come to the thing in june, i will be the one in a suit looking like a hostage',
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
            text: 'less than them. properly less, not politely less\n\ni would rather it went to someone who will not fire priya in the first fortnight. that is worth money to me and i have decided i am allowed to spend it',
            choices: [
                {
                    text: 'Then I will look at it properly.',
                    effects: [
                        { kind: 'flag', flag: 'planoraOffered' },
                        { kind: 'dial', dial: 'friendLoyalty', delta: 8 },
                        // The discount is real and it persists - the anchor
                        // moves, not just the price, so it does not drift
                        // back to the listed value within a few quarters.
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
            text: 'that is what i thought you would say and i am annoyed about how much i wanted you to say the other thing\n\nno, you are right. it would have been weird forever',
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
        { kind: 'quarterAtLeast', quarter: 20 },
    ],
    chance: 0.45,
    cooldown: 8,
    conversation: friendOffersPlanora,
    headline: 'Planora is said to have attracted interest.',
    priority: 3,
};
