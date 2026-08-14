// src/data/events/brotherDividend.ts
//
// ============================================================================
//  THE BROTHER — the same demand, three temperatures
// ============================================================================
//
//  He wants cash out. He will always want cash out; fifteen percent of a
//  company that pays nothing is a number on a page. That does not change with
//  the relationship. What changes is what it sounds like, and the whole point
//  of this file is that the player can hear the dial.
//
//  Three events, one subject, mutually exclusive band gates:
//
//      COLD   (brotherTrust < 50)   through a lawyer, and the word "minute"
//      WARM   (50-74)               to your face, badly, and he knows it
//      CLOSE  (75+)                 like a brother, and it is worse
//
//  ---------------------------------------------------------------------------
//  WHY THREE EVENTS RATHER THAN ONE WITH BRANCHES
//  ---------------------------------------------------------------------------
//  A conversation has one opening card, and the opening card is the tone. A
//  single event with gated choices could change what the PLAYER may say and
//  not what he sounds like when he says the first thing, which is the entire
//  effect being aimed at. The duplication is five lines of trigger; the
//  content is supposed to differ, and that is the prompt.
//
//  The bands are exclusive, so exactly one is eligible in any quarter. If
//  trust moves between quarters the player gets a differently-tempered version
//  of a demand they already recognise, which is the cheapest possible way to
//  make a number legible without printing it.
//
//  ---------------------------------------------------------------------------
//  HE IS NEVER SAFE, AND THE WARM ONE IS THE DANGEROUS ONE
//  ---------------------------------------------------------------------------
//  The instinct is that high trust makes him harmless. That would make the
//  dial a difficulty slider and the character a puzzle to be solved once.
//
//  He is not lying at 80. He means it. He is sincere in the moment and
//  unreliable across time, and he does not experience those as contradictory -
//  so at CLOSE he tells you, warmly and unprompted, that he has been talking
//  to people he should not be talking to, because he genuinely cannot see why
//  that would bother you. The player gets better information and a worse
//  problem, and cannot even be angry about it without punishing honesty.
//
//  MECHANICALLY THIS IS NOT DECORATION. He is on the cap table as a Snake, so
//  brotherTrust IS his board vote, inverted (core/story/brother.ts). Warming
//  him up is not flavour; it is votes.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { GameEvent } from '../../core/events/types';

/** He has to have something to be aggrieved about, and a company to bleed. */
const BASE = [
    { kind: 'flag' as const, flag: 'fatherDead' as const },
    { kind: 'quarterAtLeast' as const, quarter: 16 },
];

const DIVIDEND = 2_000_000;

// ============================================================================
//  CALIBRATED AGAINST THE DRIFT, NOT BY FEEL
// ============================================================================
//  He is on the board, so his number already moves every quarter without the
//  player saying a word: a board demand met moves the others +3, one failed
//  moves them -5 (core/market/governance.ts). Over six quarters that is
//  thirty-odd points of ambient movement - measured, by playing it.
//
//  The first draft of this file used deltas of 4 to 8, which meant a scene
//  about whether to pay your own brother was worth about one quarter of
//  somebody else's board demand failing. The conversations would have been
//  seasoning on a number the player could not see moving.
//
//  So the decisions that are ABOUT HIM are worth two to three quarters of
//  drift, and the ordering carries meaning: paying willingly beats paying
//  under a requisition, and refusing to be told beats being told and
//  objecting to it.
// ============================================================================


// ============================================================================
//  COLD — he has stopped talking to you and started talking about you
// ============================================================================
// ============================================================================
//  COLD — he has stopped talking to you and started talking about you
// ============================================================================
export const brotherDividendCold: Conversation = {
    id: 'event-brother-dividend-cold',
    channel: 'message',
    from: 'brother',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'brother',
            text: 'I had Farrow requisition an agenda item for the next board meeting: a shareholder distribution. I hold the 15% required to force the vote.',
            choices: [
                { text: 'You could have just asked me.', next: 'couldHaveAsked' },
                { text: 'Then I will see it on the agenda.', next: 'agenda' },
            ],
        },

        {
            id: 'couldHaveAsked',
            speaker: 'brother',
            text: 'I asked twice this year and got pointed to quarterly reports. This is what asking looks like when informal requests get ignored.',
            choices: [
                { text: 'Two million. Fine.', next: 'paid' },
                { text: 'Then use the procedure.', next: 'agenda' },
            ],
        },

        {
            id: 'agenda',
            speaker: 'brother',
            text: 'I will. Even if it fails, the minutes will show I raised it and you refused. Minutes last a long time.',
            choices: [
                {
                    text: '(leave it)',
                    effects: [
                        { kind: 'dial', dial: 'brotherTrust', delta: -12 },
                        { kind: 'flag', flag: 'brotherPlottedOpenly' },
                        {
                            kind: 'news',
                            headline: 'A shareholder requisition at Hale. Family sources describe the request as "routine".',
                        },
                    ],
                },
                { text: 'Two million. Take it.', next: 'paid' },
            ],
        },

        {
            id: 'paid',
            speaker: 'brother',
            text: 'Thank you. I note that I had to force the issue, but the distribution is appreciated.',
            choices: [
                {
                    text: '(leave it)',
                    effects: [
                        { kind: 'capital', amount: -DIVIDEND },
                        { kind: 'dial', dial: 'brotherTrust', delta: 10 },
                    ],
                },
            ],
        },
    ],
};

export const brotherDividendColdEvent: GameEvent = {
    id: 'brother-dividend-cold',
    when: [...BASE, { kind: 'dialAtMost', dial: 'brotherTrust', band: 'low' }],
    chance: 0.25,
    cooldown: 6,
    conversation: brotherDividendCold,
    headline: 'A minority shareholder at Hale is understood to be pressing for a distribution.',
    priority: 2,
};

// ============================================================================
//  WARM — to your face, badly
// ============================================================================
//  The middle, and the most human of the three: he is asking, he is bad at
//  asking, and he keeps undercutting himself. This is the version where the
//  needle comes out, because a needle only works from someone close enough.
// ============================================================================
export const brotherDividendWarm: Conversation = {
    id: 'event-brother-dividend-warm',
    channel: 'message',
    from: 'brother',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'brother',
            text: 'Are you free to talk over a table about a dividend? Two million total across all shares, which means three hundred thousand for me.',
            choices: [
                { text: 'How much for the company?', next: 'howMuch' },
                { text: 'What is the point of this?', next: 'thePoint' },
            ],
        },

        {
            id: 'howMuch',
            speaker: 'brother',
            text: 'Two million across the register. Small enough that you might think it is not worth discussing.',
            choices: [
                { text: 'It is not worth discussing.', next: 'soundsLike' },
                { text: 'What is the point, then?', next: 'thePoint' },
            ],
        },

        {
            id: 'thePoint',
            speaker: 'brother',
            text: 'A dividend is the only thing a company does that acknowledges its shareholders directly.',
            choices: [
                { text: 'Then we declare one.', next: 'paid' },
                { text: 'Not this year. I need cash in the business.', next: 'notThisYear' },
            ],
        },

        {
            id: 'soundsLike',
            speaker: 'brother',
            text: 'Dad trusted you with all of it and assumed I would be fine without a say. I just want some recognition.',
            choices: [
                { text: 'That is not fair.', next: 'notFair' },
                { text: 'Then we declare one.', next: 'paid' },
            ],
        },

        {
            id: 'notFair',
            speaker: 'brother',
            text: 'It is not. But I am telling you honestly how it feels.',
            choices: [
                { text: 'We declare one.', next: 'paid' },
                { text: 'Not this year.', next: 'notThisYear' },
            ],
        },

        {
            id: 'notThisYear',
            speaker: 'brother',
            text: 'All right. I would rather hear no directly from my brother than get ignored by corporate counsel.',
            choices: [
                {
                    text: 'I appreciate that.',
                    effects: [{ kind: 'dial', dial: 'brotherTrust', delta: 4 }],
                },
                {
                    text: 'Next year will be better.',
                    effects: [{ kind: 'dial', dial: 'brotherTrust', delta: 7 }],
                },
            ],
        },

        {
            id: 'paid',
            speaker: 'brother',
            text: 'Thank you. Genuinely. I will put it to good use.',
            choices: [
                {
                    text: 'Glad we sorted it.',
                    effects: [
                        { kind: 'capital', amount: -DIVIDEND },
                        { kind: 'dial', dial: 'brotherTrust', delta: 12 },
                    ],
                },
            ],
        },
    ],
};

export const brotherDividendWarmEvent: GameEvent = {
    id: 'brother-dividend-warm',
    when: [
        ...BASE,
        { kind: 'dialAtLeast', dial: 'brotherTrust', band: 'high' },
        { kind: 'dialAtMost', dial: 'brotherTrust', band: 'high' },
    ],
    chance: 0.20,
    cooldown: 6,
    conversation: brotherDividendWarm,
    headline: 'Hale is understood to be reviewing its distribution policy.',
    priority: 2,
};

// ============================================================================
//  CLOSE — like a brother, and it is worse
// ============================================================================
//  He is warm, he is useful, he gives you something you could not get
//  anywhere else - and then mentions, in the same breath and without any
//  sense that it is a confession, that he has been having dinner with the
//  people who want to take the company off you.
// ============================================================================
export const brotherDividendClose: Conversation = {
    id: 'event-brother-dividend-close',
    channel: 'message',
    from: 'brother',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'brother',
            text: 'Two things: first, I am not pushing on dividends this year. The cash is better reinvested in the company.\n\nSecond: I had dinner with Halberd again. They are lending against tech acquisitions.',
            choices: [
                { text: 'What did Halberd want?', next: 'whatWant' },
                { text: 'How many times have they approached you?', next: 'twice' },
            ],
        },

        {
            id: 'twice',
            speaker: 'brother',
            text: 'Twice this year over dinner. As a shareholder, I listen to what people value the stake at.',
            choices: [
                { text: 'Keep family business private.', next: 'normalBrother' },
                { text: 'What do they want?', next: 'whatWant' },
            ],
        },

        {
            id: 'normalBrother',
            speaker: 'brother',
            text: 'I am telling you openly because I am allowed to have dinner with who I want, and I bring the intel straight to you.',
            choices: [
                { text: 'What did they tell you?', next: 'whatWant' },
            ],
        },

        {
            id: 'whatWant',
            speaker: 'brother',
            text: 'They are looking to back a buyer and checking if the family would split in a vote. I told them we vote as one block.',
            choices: [
                {
                    text: 'Thank you for telling me.',
                    effects: [
                        { kind: 'dial', dial: 'brotherTrust', delta: 11 },
                        { kind: 'dial', dial: 'pearHostility', delta: 4 },
                        { kind: 'flag', flag: 'moleUnlocked' },
                        {
                            kind: 'news',
                            headline: 'Halberd Partners is said to be sounding out shareholders in the sector.',
                        },
                    ],
                },
                {
                    text: 'Do not meet them again.',
                    next: 'doNotAgain',
                },
            ],
        },

        {
            id: 'doNotAgain',
            speaker: 'brother',
            text: 'Understood. But if they ring, we both know I will pick up the phone.',
            choices: [
                {
                    text: 'Keep me posted.',
                    effects: [
                        { kind: 'dial', dial: 'brotherTrust', delta: 5 },
                        { kind: 'dial', dial: 'pearHostility', delta: 4 },
                        { kind: 'flag', flag: 'moleUnlocked' },
                    ],
                },
                {
                    text: 'That is not a promise.',
                    effects: [
                        { kind: 'dial', dial: 'brotherTrust', delta: -13 },
                    ],
                },
            ],
        },
    ],
};

export const brotherDividendCloseEvent: GameEvent = {
    id: 'brother-dividend-close',
    when: [...BASE, { kind: 'dialAtLeast', dial: 'brotherTrust', band: 'extreme' }],
    chance: 0.20,
    cooldown: 8,
    conversation: brotherDividendClose,
    headline: 'Family shareholders at Hale are described as aligned.',
    priority: 2,
};
