// src/data/story/cfoDividend.ts
//
// ============================================================================
//  THE CFO, ON THE DIVIDEND YOUR BROTHER IS DEMANDING
// ============================================================================
//
//  The first conversation written as data, and it exists partly to prove the
//  shape can carry a real scene: a gate, branching, two endings, effects on
//  three different systems, and one answer that only appears if you can
//  actually afford it.
//
//  WHAT IT IS ABOUT. Your brother owns fifteen percent and does not believe in
//  you. He wants cash out. The money exists. Spending it on him buys quiet;
//  spending it on R&D buys a chance against Pear. There is no correct answer,
//  which is the only kind worth writing - both branches cost something you can
//  name.
//
//  The CFO is not neutral here. He tells you what the board wants and then
//  tells you what he thinks, in that order, because that is what a man who has
//  survived four CEOs does.
// ============================================================================

import type { Conversation } from '../../core/story/graph';

const DIVIDEND = 2_000_000;

export const cfoDividend: Conversation = {
    id: 'cfo-dividend',
    channel: 'message',
    from: 'cfo',
    // Only after the father is gone: while he was alive this was his fight.
    when: [{ kind: 'flag', flag: 'fatherDead' }],
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text: 'Your brother called an item onto the agenda again. He wants a dividend declared this quarter, and he has the language for it, "returning value to shareholders". He has been practising.',
            choices: [
                { text: 'How much is he asking for?', next: 'amount' },
                {
                    text: 'He owns fifteen percent. He can ask.',
                    next: 'dismissed',
                    effects: [{ kind: 'dial', dial: 'cfoTrust', delta: -4 }],
                },
            ],
        },

        {
            id: 'amount',
            speaker: 'cfo',
            text: '{brotherDividendTotal}. The cash is there, that is the problem, because everyone can see it is there. If we had nothing, this would not be a conversation.',
            choices: [
                { text: 'And if we spend it instead?', next: 'advice' },
                { text: 'Pay him. I want the quarter quiet.', next: 'paid' },
            ],
        },

        {
            id: 'advice',
            speaker: 'cfo',
            text: 'Then we put it into research and we are three months closer to something Pear cannot copy by Christmas. And your brother tells the board you ignored them. Both of those are true at once. I have watched your father choose the quiet option eleven times.',
            choices: [
                {
                    text: 'Pay the dividend.',
                    next: 'paid',
                    // Only offered when the company can actually cover it -
                    // an answer you cannot afford is not an answer.
                    when: [{ kind: 'capitalAtLeast', amount: DIVIDEND }],
                },
                { text: 'We spend it. Let him complain.', next: 'refused' },
            ],
        },

        {
            id: 'paid',
            speaker: 'cfo',
            text: 'It will be in the minutes by Friday. He will be pleasant to you for about a month. I would use the month.',
            choices: [
                {
                    text: 'Understood.',
                    effects: [
                        { kind: 'capital', amount: -DIVIDEND },
                        { kind: 'dial', dial: 'brotherTrust', delta: 12 },
                        { kind: 'dial', dial: 'cfoTrust', delta: -3 },
                    ],
                },
            ],
        },

        {
            id: 'refused',
            speaker: 'cfo',
            text: 'Then I will minute it as a deferral rather than a refusal, which buys you one quarter of ambiguity. After that he will say the word "removal" in a room I am not in.',
            choices: [
                {
                    text: 'Let him say it.',
                    effects: [
                        { kind: 'dial', dial: 'brotherTrust', delta: -15 },
                        { kind: 'dial', dial: 'cfoTrust', delta: 8 },
                        {
                            kind: 'message',
                            who: 'brother',
                            text: 'Heard you turned down the dividend. Bold. Dad used to say the same thing about money he did not have yet.',
                        },
                    ],
                },
                {
                    text: 'Buy me the quarter.',
                    effects: [
                        { kind: 'dial', dial: 'brotherTrust', delta: -6 },
                        { kind: 'dial', dial: 'cfoTrust', delta: 4 },
                    ],
                },
            ],
        },

        {
            id: 'dismissed',
            speaker: 'cfo',
            // No choices: he has the last word. A terminal card, not a trap.
            text: 'He can. He will. I only wanted it on your desk before it was on the agenda.',
        },
    ],
};
